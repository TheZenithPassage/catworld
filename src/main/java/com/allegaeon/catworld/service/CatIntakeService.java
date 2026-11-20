package com.allegaeon.catworld.service;

import com.allegaeon.catworld.dto.CatIntakeDtos.*;
import com.allegaeon.catworld.exception.BadRequestException;
import com.allegaeon.catworld.exception.CatPhotoErrorCode;
import com.allegaeon.catworld.exception.CatPhotoException;
import com.allegaeon.catworld.exception.ConflictException;
import com.allegaeon.catworld.exception.ResourceNotFoundException;
import com.allegaeon.catworld.model.Cat;
import com.allegaeon.catworld.model.CatInformationalPhoto;
import com.allegaeon.catworld.model.CatIntakeInvitation;
import com.allegaeon.catworld.model.CatIntakePhoto;
import com.allegaeon.catworld.model.CatIntakeReview;
import com.allegaeon.catworld.repository.CatInformationalPhotoRepository;
import com.allegaeon.catworld.repository.CatIntakeInvitationRepository;
import com.allegaeon.catworld.repository.CatIntakePhotoRepository;
import com.allegaeon.catworld.repository.CatIntakeReviewRepository;
import com.allegaeon.catworld.repository.CatRepository;
import com.allegaeon.catworld.repository.OwnerRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.util.UriComponentsBuilder;
import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.ObjectMapper;

import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Base64;
import java.util.Collection;
import java.util.Collections;
import java.util.HashSet;
import java.util.HexFormat;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CatIntakeService {
    private static final Duration INVITATION_LIFETIME = Duration.ofDays(7);
    private static final int MAX_CATS = 20;
    private static final int MAX_PHOTOS_PER_CAT = 2;
    private static final long MAX_PHOTO_BYTES = 8L * 1024 * 1024;
    private static final long MAX_TOTAL_PHOTO_BYTES = 32L * 1024 * 1024;
    private static final Pattern TOKEN_PATTERN = Pattern.compile("[A-Za-z0-9_-]{43}");
    private static final Pattern PHOTO_KEY_PATTERN = Pattern.compile("[A-Za-z0-9_-]{1,48}");
    private static final Set<String> VACCINE_FIELDS = Set.of("lastRabiesDate", "lastTripleFelineDate");

    private final CatIntakeInvitationRepository invitations;
    private final CatIntakeReviewRepository reviews;
    private final CatIntakePhotoRepository intakePhotos;
    private final CatInformationalPhotoRepository gallery;
    private final OwnerRepository owners;
    private final CatRepository cats;
    private final CatMutationTransactionService catMutations;
    private final CatIntakeFields fields;
    private final HouseholdIntakePreparation preparation;
    private final FoodBrandService foodBrands;
    private final LibVipsCatPhotoNormalizer normalizer;
    private final PlatformTransactionManager transactions;
    private final ObjectMapper json;
    private final Clock clock;
    private final SecureRandom random = new SecureRandom();

    @Value("${CATWORLD_INTAKE_URL:https://fichas.catworld.com.ar/}")
    private String intakeUrl;

    public String recipientOrigin() {
        URI url = URI.create(intakeUrl);
        String scheme = url.getScheme() == null ? "" : url.getScheme().toLowerCase(Locale.ROOT);
        if ((!scheme.equals("https") && !scheme.equals("http")) || url.getHost() == null || url.getUserInfo() != null) {
            throw new IllegalArgumentException("CATWORLD_INTAKE_URL must use an absolute HTTP or HTTPS URL");
        }
        int port = url.getPort();
        boolean defaultPort = port == -1 || (scheme.equals("https") ? port == 443 : port == 80);
        return scheme + "://" + url.getHost().toLowerCase(Locale.ROOT) + (defaultPort ? "" : ":" + port);
    }

    @Transactional
    public IssuedInvite issue(InviteRequest request) {
        var owner = owners.findByIdForUpdate(request.ownerId())
                .orElseThrow(() -> new ResourceNotFoundException("Owner", request.ownerId()));
        var livingCats = preparation.livingCats(owner.getId());
        if (livingCats.isEmpty() && !request.allowNewCats()) {
            throw new BadRequestException("The tutor has no living cats and registration is disabled");
        }
        Map<UUID, Map<String, String>> scope = new LinkedHashMap<>();
        livingCats.forEach(cat -> scope.put(cat.getId(), fields.snapshot(cat)));
        var requested = requestedAtIssuance(owner.getId(), livingCats, request.stayId());

        Instant now = clock.instant();
        invitations.findOutstandingByOwnerForUpdate(owner.getId()).forEach(invitation -> revoke(invitation, now));
        byte[] secret = new byte[32];
        random.nextBytes(secret);
        String token = Base64.getUrlEncoder().withoutPadding().encodeToString(secret);
        var invitation = invitations.save(new CatIntakeInvitation(owner, digest(token),
                request.allowNewCats(), json.writeValueAsString(scope), json.writeValueAsString(requested),
                now.plus(INVITATION_LIFETIME)));
        String url = UriComponentsBuilder.fromUriString(intakeUrl).replaceQuery(null)
                .fragment("token=" + token).build().toUriString();
        return new IssuedInvite(invitation.getId(), url, invitation.getExpiresAt());
    }

    @Transactional(readOnly = true)
    public Optional<ActiveInvite> active(UUID ownerId) {
        return invitations.findByOwner_IdAndRevokedAtIsNullAndSubmittedAtIsNullAndExpiresAtAfter(ownerId, clock.instant())
                .map(invitation -> new ActiveInvite(invitation.getId(), ownerId,
                        List.copyOf(scopeOf(invitation.getScopeSnapshot()).keySet()),
                        invitation.isAllowNewCats(), invitation.getExpiresAt()));
    }

    @Transactional
    public void revoke(UUID id) {
        var invitation = invitations.findByIdForUpdate(id)
                .orElseThrow(() -> new ResourceNotFoundException("Cat intake invitation", id));
        if (invitation.getSubmittedAt() == null && invitation.getRevokedAt() == null) {
            revoke(invitation, clock.instant());
        }
    }

    public boolean hasOpenLink(String authorization) {
        String hash = digestFromAuthorization(authorization);
        return hash != null && invitations.existsByTokenHashAndRevokedAtIsNullAndSubmittedAtIsNullAndExpiresAtAfter(
                hash, clock.instant());
    }

    @Transactional(readOnly = true)
    public RecipientForm form(String authorization) {
        var invite = openScope(requireDigest(authorization));
        var scope = scopeOf(invite.getScopeSnapshot());
        var eligible = eligibleCats(invite.getOwnerId(), scope.keySet(), false);
        requireAccessible(invite.getAllowNewCats(), eligible);
        var requested = requestedForOpenScope(invite.getRequestedFieldsSnapshot(), invite.getOwnerId(), eligible);
        var submitted = reviews.findByInvitation_IdOrderBySubmittedAtAscIdAsc(invite.getId());
        var byCat = existingReviews(submitted);
        var result = new ArrayList<ScopedCat>();
        var eligibleIds = catIds(eligible);
        scope.forEach((catId, original) -> {
            var draft = byCat.get(catId);
            if (eligibleIds.contains(catId) && (draft == null || draft.getApprovedAt() == null)) {
                result.add(scopedCat(catId, original, requested.getOrDefault(catId, List.of()), draft));
            }
        });
        if (invite.getAllowNewCats()) {
            submitted.stream().filter(review -> review.getCatId() == null && review.getApprovedAt() == null)
                    .map(draft -> scopedCat(null, Map.of(), List.of(), draft)).forEach(result::add);
        }
        return new RecipientForm(invite.getAllowNewCats(), result, invite.getExpiresAt(), foodBrands.approvedBrands());
    }

    @Transactional(readOnly = true)
    public byte[] recipientPhoto(String authorization, UUID photoId) {
        var invite = openScope(requireDigest(authorization));
        var review = intakePhotos.findPendingReview(invite.getId(), photoId).orElseThrow(CatIntakeService::unavailable);
        UUID catId = review.getCatId();
        boolean eligible = catId == null ? invite.getAllowNewCats()
                : scopeOf(invite.getScopeSnapshot()).containsKey(catId)
                  && cats.findById(catId).filter(cat -> isEligible(cat, invite.getOwnerId())).isPresent();
        if (!eligible) {
            throw unavailable();
        }
        return intakePhotos.findContent(review.getId(), photoId).orElseThrow(CatIntakeService::unavailable);
    }

    public void submit(String authorization, Submission submission, Map<String, List<MultipartFile>> parts) {
        String hash = requireDigest(authorization);
        openScope(hash);
        var normalized = normalizePhotos(parts, submissionPhotoKeys(submission));

        new TransactionTemplate(transactions).executeWithoutResult(status -> {
            var locked = invitations.findByTokenHashForUpdate(hash).orElseThrow(CatIntakeService::unavailable);
            Instant now = clock.instant();
            if (!locked.isOpenAt(now)) throw unavailable();
            var scope = scopeOf(locked.getScopeSnapshot());
            UUID ownerId = locked.getOwner().getId();
            var eligible = eligibleCats(ownerId, scope.keySet(), true);
            requireAccessible(locked.isAllowNewCats(), eligible);
            var requested = requestedForOpenScope(locked.getRequestedFieldsSnapshot(), ownerId, eligible);
            var submitted = reviews.findByInvitation_IdOrderBySubmittedAtAscIdAsc(locked.getId());
            var byCat = existingReviews(submitted);
            var byDraft = submitted.stream().filter(review -> review.getDraftId() != null)
                    .collect(Collectors.toMap(CatIntakeReview::getDraftId, review -> review));
            var eligibleById = eligible.stream().collect(Collectors.toMap(Cat::getId, cat -> cat));
            var drafts = prepareDrafts(submission, locked, scope, eligibleById, byCat, byDraft);
            validateRequestedAnswer(drafts, requested, eligible, byCat);
            drafts.forEach(draft -> saveDraft(locked, draft, normalized, now));
        });
    }

    @Transactional(readOnly = true)
    public List<ReviewRow> pending() {
        return reviews.findPendingRows().stream().map(row -> new ReviewRow(row.getId(), row.getOwnerId(),
                row.getOwnerName(), row.getCatId(), row.getCatName(), row.getSubmittedAt())).toList();
    }

    @Transactional(readOnly = true)
    public ReviewDetail review(UUID id) {
        var review = requirePendingReview(reviews.findById(id), id);
        var owner = review.getInvitation().getOwner();
        requireReviewScope(review);
        var cat = review.getCatId() == null ? null : requireReviewCat(cats.findById(review.getCatId()), owner.getId());
        var current = cat == null ? null : fields.snapshot(cat);
        var original = fieldsOf(review.getOriginalFields());
        var proposed = fieldsOf(review.getProposedFields());
        List<String> conflicts = current == null ? List.of() : proposed.keySet().stream()
                .filter(key -> !Objects.equals(original.get(key), current.get(key))).toList();
        return new ReviewDetail(id, owner.getId(), owner.getFullName(), review.getCatId(), review.getCatName(),
                review.getSubmittedAt(), current, proposed, conflicts,
                intakePhotos.findIdsByReview(id).stream().map(ReviewPhoto::new).toList(),
                cat == null ? null : cat.getUpdatedAt(), review.getRevision());
    }

    @Transactional(readOnly = true)
    public byte[] reviewPhoto(UUID reviewId, UUID photoId) {
        var review = requirePendingReview(reviews.findById(reviewId), reviewId);
        requireReviewScope(review);
        if (review.getCatId() != null) {
            requireReviewCat(cats.findById(review.getCatId()), review.getInvitation().getOwner().getId());
        }
        return intakePhotos.findContent(reviewId, photoId)
                .orElseThrow(() -> new ResourceNotFoundException("Cat intake photo", photoId));
    }

    @Transactional
    public void approve(UUID id, Approval approval) {
        // Registering a new cat also writes an owner foreign key. Use issuance's owner-then-invitation lock order.
        owners.findByNewCatReviewForUpdate(id);
        // Submission and approval acquire the same invitation lock before reading or changing proposals.
        var invitation = invitations.findByReviewIdForUpdate(id)
                .orElseThrow(() -> new ResourceNotFoundException("Cat intake review", id));
        var review = requirePendingReview(reviews.findByIdForUpdate(id), id);
        requireReviewScope(review);
        if (!Objects.equals(review.getRevision(), approval.expectedReviewRevision())) {
            throw new ConflictException("The proposal has changed since this review was opened");
        }
        UUID ownerId = invitation.getOwner().getId();
        var cat = review.getCatId() == null ? null
                : requireReviewCat(cats.findByIdForUpdate(review.getCatId()), ownerId);
        if (cat != null && !Objects.equals(cat.getUpdatedAt(), approval.expectedCatUpdatedAt())) {
            throw new ConflictException("The cat has changed since this review was opened");
        }

        var accepted = fields.nonBlank(approval.fields());
        accepted.computeIfPresent("foodBrand", (key, value) -> foodBrands.matchingName(value));
        if (cat != null && !fieldsOf(review.getProposedFields()).keySet().containsAll(accepted.keySet())) {
            throw new BadRequestException("Select fields proposed in this review");
        }
        List<UUID> photoIds = approval.photoIds() == null ? List.of() : approval.photoIds();
        if (photoIds.size() > MAX_PHOTOS_PER_CAT || photoIds.stream().anyMatch(Objects::isNull)
                || new HashSet<>(photoIds).size() != photoIds.size()) {
            throw new BadRequestException("Invalid selection of intake photos");
        }
        List<CatIntakePhoto> acceptedPhotos = photoIds.isEmpty() ? List.of() : intakePhotos.findByReview_IdAndIdIn(id, photoIds);
        if (acceptedPhotos.size() != photoIds.size()) {
            throw new BadRequestException("Select photos belonging to this review");
        }

        Map<String, String> values = cat == null ? new LinkedHashMap<>() : fields.snapshot(cat);
        values.putAll(accepted);
        var request = fields.request(ownerId, cat, values);
        if (accepted.containsKey("foodBrand")) {
            request.setFoodBrand(accepted.get("foodBrand"));
            request.setApproveFoodBrand(true);
        }
        if (cat == null) {
            cat = catMutations.create(request, null);
        } else if (!accepted.isEmpty()) {
            catMutations.applyProfile(cat, request);
        }
        Cat approvedCat = cat;
        Instant now = clock.instant();
        gallery.saveAll(acceptedPhotos.stream()
                .map(photo -> new CatInformationalPhoto(approvedCat, now, photo.getContent())).toList());
        intakePhotos.deleteByReview(id);
        review.approve(approvedCat.getId(), now);
        closeIfComplete(invitation, now);
    }

    private Set<String> submissionPhotoKeys(Submission submission) {
        if (submission == null || submission.cats() == null || submission.cats().isEmpty() || submission.cats().size() > MAX_CATS) {
            throw new BadRequestException("Include between 1 and 20 cats");
        }
        Set<String> expectedPhotos = new HashSet<>();
        for (var submitted : submission.cats()) {
            if (submitted == null) throw new BadRequestException("Cat details are required");
            var photoKeys = photoKeys(submitted);
            if (photoKeys.size() > MAX_PHOTOS_PER_CAT) {
                throw new BadRequestException("Up to two photos are allowed per cat");
            }
            for (String key : photoKeys) {
                if (key == null || "submission".equals(key) || !PHOTO_KEY_PATTERN.matcher(key).matches()
                        || !expectedPhotos.add(key)) {
                    throw new BadRequestException("Invalid intake photo reference");
                }
            }
        }
        return expectedPhotos;
    }

    private List<Draft> prepareDrafts(Submission submission, CatIntakeInvitation invite,
                                      Map<UUID, Map<String, String>> scope, Map<UUID, Cat> eligible,
                                      Map<UUID, CatIntakeReview> byCat, Map<UUID, CatIntakeReview> byDraft) {
        Set<UUID> includedCats = new HashSet<>();
        Set<UUID> includedDrafts = new HashSet<>();
        List<Draft> drafts = new ArrayList<>();
        for (var submitted : submission.cats()) {
            UUID catId = submitted.catId();
            UUID draftId = submitted.draftId();
            Cat current = catId == null ? null : eligible.get(catId);
            if (catId == null && (!invite.isAllowNewCats() || draftId == null)) {
                throw new BadRequestException("New cats require a draft ID and registration permission");
            }
            if ((catId != null && (current == null || !includedCats.add(catId)))
                    || (draftId != null && !includedDrafts.add(draftId))) {
                throw new BadRequestException("A cat or draft is duplicated or outside this link's scope");
            }
            var previous = previousDraft(submitted, byCat, byDraft);
            var original = catId == null ? Map.<String, String>of() : scope.get(catId);
            var proposed = proposedFields(submitted, original);
            var oldPhotoIds = previous == null ? List.<UUID>of() : intakePhotos.findIdsByReview(previous.getId());
            var retained = retainedPhotoIds(submitted, oldPhotoIds);
            var uploads = photoKeys(submitted);
            if (catId != null && proposed.isEmpty() && retained.isEmpty() && uploads.isEmpty()) continue;
            if (previous != null && proposed.equals(fieldsOf(previous.getProposedFields()))
                    && retained.size() == oldPhotoIds.size() && uploads.isEmpty()) continue;
            if (!Collections.disjoint(proposed.keySet(), VACCINE_FIELDS) && retained.isEmpty() && uploads.isEmpty()) {
                throw new BadRequestException("Vaccination dates require a supporting photo for this cat");
            }

            Map<String, String> values = current == null ? new LinkedHashMap<>() : fields.snapshot(current);
            values.putAll(proposed);
            fields.request(invite.getOwner().getId(), current, values);
            Map<String, String> baseline = new LinkedHashMap<>(original);
            baseline.keySet().retainAll(proposed.keySet());
            UUID stableDraftId = previous != null ? previous.getDraftId() : draftId == null ? UUID.randomUUID() : draftId;
            drafts.add(new Draft(previous, catId, stableDraftId, proposed.getOrDefault("name", original.get("name")),
                    baseline, proposed, retained, uploads));
        }
        return drafts;
    }

    private CatIntakeReview previousDraft(SubmittedCat submitted, Map<UUID, CatIntakeReview> byCat,
                                          Map<UUID, CatIntakeReview> byDraft) {
        var draftId = submitted.draftId();
        var named = draftId == null ? null : byDraft.get(draftId);
        if (named != null && !Objects.equals(named.getCatId(), submitted.catId())) {
            throw new BadRequestException("Draft does not belong to this cat");
        }
        var existing = submitted.catId() == null ? named : byCat.get(submitted.catId());
        if (existing == null) {
            if (submitted.revision() != null && submitted.revision() != 0) throw staleDraft();
        } else if (existing.getApprovedAt() != null || !Objects.equals(existing.getRevision(), submitted.revision())
                || (draftId != null && !draftId.equals(existing.getDraftId()))) {
            throw staleDraft();
        }
        return existing;
    }

    private Map<String, String> proposedFields(SubmittedCat submitted, Map<String, String> original) {
        var proposed = fields.nonBlank(submitted.fields());
        String supplied = proposed.computeIfPresent("foodBrand", (key, value) -> foodBrands.matchingName(value));
        if (supplied != null && supplied.equals(foodBrands.matchingName(original.get("foodBrand")))) {
            proposed.remove("foodBrand");
        }
        proposed.entrySet().removeIf(entry -> Objects.equals(
                entry.getValue(), original.getOrDefault(entry.getKey(), "").strip()));
        return proposed;
    }

    private static List<UUID> retainedPhotoIds(SubmittedCat submitted, List<UUID> existingIds) {
        var retained = submitted.retainedPhotoIds() == null ? existingIds : submitted.retainedPhotoIds();
        if (retained.size() + photoKeys(submitted).size() > MAX_PHOTOS_PER_CAT || retained.stream().anyMatch(Objects::isNull)
                || new HashSet<>(retained).size() != retained.size() || !existingIds.containsAll(retained)) {
            throw new BadRequestException("Invalid selection of photos for this cat");
        }
        return retained;
    }

    private static List<String> photoKeys(SubmittedCat submitted) {
        return submitted.photoKeys() == null ? List.of() : submitted.photoKeys();
    }

    private static void validateRequestedAnswer(List<Draft> drafts, Map<UUID, List<String>> requested, List<Cat> eligible,
                                                Map<UUID, CatIntakeReview> byCat) {
        if (drafts.isEmpty() || drafts.stream().anyMatch(draft -> draft.catId() == null)) return;
        boolean hasRequests = eligible.stream().map(Cat::getId)
                .filter(id -> byCat.get(id) == null || byCat.get(id).getApprovedAt() == null)
                .anyMatch(id -> !requested.getOrDefault(id, List.of()).isEmpty());
        if (hasRequests && drafts.stream().noneMatch(draft -> requested.getOrDefault(draft.catId(), List.of())
                .stream().anyMatch(draft.proposed()::containsKey))) {
            throw new BadRequestException("Answer at least one requested field in the household");
        }
    }

    private void saveDraft(CatIntakeInvitation invitation, Draft draft, Map<String, NormalizedCatPhoto> normalized,
                           Instant now) {
        String original = json.writeValueAsString(draft.original());
        String proposed = json.writeValueAsString(draft.proposed());
        var previous = draft.previous();
        CatIntakeReview review;
        if (previous == null) {
            review = reviews.save(new CatIntakeReview(invitation, draft.catId(), draft.draftId(), draft.catName(),
                    original, proposed, now));
        } else {
            review = previous;
            review.replaceProposal(draft.catName(), original, proposed, now);
            if (draft.retainedPhotoIds().isEmpty()) intakePhotos.deleteByReview(review.getId());
            else intakePhotos.deleteUnretained(review.getId(), draft.retainedPhotoIds());
        }
        intakePhotos.saveAll(draft.photoKeys().stream()
                .map(key -> new CatIntakePhoto(review, normalized.get(key).bytes())).toList());
    }

    private Map<String, NormalizedCatPhoto> normalizePhotos(Map<String, List<MultipartFile>> parts,
                                                            Set<String> expectedPhotos) {
        Map<String, MultipartFile> uploads = new LinkedHashMap<>();
        parts.forEach((key, files) -> {
            if ("submission".equals(key)) return;
            if (!expectedPhotos.contains(key) || files.size() != 1 || files.getFirst().isEmpty()) {
                throw new BadRequestException("Unexpected or empty intake photo");
            }
            var file = files.getFirst();
            if (file.getSize() > MAX_PHOTO_BYTES) {
                throw new CatPhotoException(CatPhotoErrorCode.CAT_PHOTO_FILE_TOO_LARGE);
            }
            uploads.put(key, file);
        });
        if (!uploads.keySet().equals(expectedPhotos)) throw new BadRequestException("Missing intake photo");
        if (uploads.values().stream().mapToLong(MultipartFile::getSize).sum() > MAX_TOTAL_PHOTO_BYTES) {
            throw new CatPhotoException(CatPhotoErrorCode.CAT_PHOTO_FILE_TOO_LARGE);
        }
        Map<String, NormalizedCatPhoto> result = new LinkedHashMap<>();
        uploads.forEach((key, upload) -> result.put(key, normalizer.normalize(upload)));
        return result;
    }

    private List<Cat> eligibleCats(UUID ownerId, Collection<UUID> ids, boolean lock) {
        if (ids.isEmpty()) return List.of();
        return lock ? cats.findScopedForUpdate(ids, ownerId) : cats.findByOwner_IdAndIdInAndDeceasedFalse(ownerId, ids);
    }

    private static void requireAccessible(boolean allowNewCats, List<Cat> eligible) {
        if (!allowNewCats && eligible.isEmpty()) throw unavailable();
    }

    private Map<UUID, List<String>> requestedAtIssuance(UUID ownerId, List<Cat> eligible, UUID stayId) {
        return preparation.prepare(ownerId, eligible, stayId).entrySet().stream().collect(Collectors.toMap(
                Map.Entry::getKey, entry -> entry.getValue().requestedFields()));
    }

    private Map<UUID, List<String>> requestedForOpenScope(String snapshot, UUID ownerId, List<Cat> eligible) {
        return snapshot == null ? requestedAtIssuance(ownerId, eligible, null)
                : json.readValue(snapshot, new TypeReference<>() {});
    }

    private ScopedCat scopedCat(UUID id, Map<String, String> original, List<String> requested, CatIntakeReview draft) {
        if (draft == null) return new ScopedCat(id, original, requested, null, 0, Map.of(), List.of());
        return new ScopedCat(id, original, requested, draft.getDraftId(), draft.getRevision(),
                fieldsOf(draft.getProposedFields()),
                intakePhotos.findIdsByReview(draft.getId()).stream().map(ReviewPhoto::new).toList());
    }

    private void closeIfComplete(CatIntakeInvitation invite, Instant now) {
        if (!invite.isOpenAt(now)) return;
        var scope = scopeOf(invite.getScopeSnapshot());
        UUID ownerId = invite.getOwner().getId();
        var eligible = eligibleCats(ownerId, scope.keySet(), false);
        var eligibleIds = catIds(eligible);
        var submitted = reviews.findByInvitation_IdOrderBySubmittedAtAscIdAsc(invite.getId());
        if (submitted.stream().anyMatch(review -> review.getApprovedAt() == null
                && (review.getCatId() == null || eligibleIds.contains(review.getCatId())))) return;
        var approvedIds = existingReviews(submitted).keySet();
        var requested = requestedForOpenScope(invite.getRequestedFieldsSnapshot(), ownerId, eligible);
        boolean needsAnswer = eligibleIds.stream().filter(id -> !approvedIds.contains(id))
                .anyMatch(id -> !requested.getOrDefault(id, List.of()).isEmpty());
        if (!needsAnswer) invite.close(now, identifiersOnly(scope));
    }

    private void revoke(CatIntakeInvitation invitation, Instant now) {
        invitation.revoke(now, identifiersOnly(scopeOf(invitation.getScopeSnapshot())));
    }

    private String identifiersOnly(Map<UUID, Map<String, String>> scope) {
        return json.writeValueAsString(scope.keySet().stream().collect(Collectors.toMap(id -> id, id -> Map.of())));
    }

    private static Set<UUID> catIds(List<Cat> cats) {
        return cats.stream().map(Cat::getId).collect(Collectors.toSet());
    }

    private static Map<UUID, CatIntakeReview> existingReviews(List<CatIntakeReview> submitted) {
        return submitted.stream().filter(review -> review.getCatId() != null)
                .collect(Collectors.toMap(CatIntakeReview::getCatId, review -> review));
    }

    private static CatIntakeReview requirePendingReview(Optional<CatIntakeReview> review, UUID id) {
        return review.filter(value -> value.getApprovedAt() == null)
                .orElseThrow(() -> new ResourceNotFoundException("Cat intake review", id));
    }

    private void requireReviewScope(CatIntakeReview review) {
        var invitation = review.getInvitation();
        if (review.getCatId() == null) {
            if (invitation.isAllowNewCats()) return;
        } else {
            var scope = scopeOf(invitation.getScopeSnapshot());
            // Consumed V17 invitations discarded their selected IDs. Their review's cat ID is retained.
            if (scope.containsKey(review.getCatId()) ||
                    (invitation.getRequestedFieldsSnapshot() == null && scope.isEmpty() && invitation.getSubmittedAt() != null)) {
                return;
            }
        }
        throw new ConflictException("The proposal is outside this invitation's scope");
    }

    private static Cat requireReviewCat(Optional<Cat> candidate, UUID ownerId) {
        return candidate.filter(cat -> isEligible(cat, ownerId))
                .orElseThrow(() -> new ConflictException("The cat is no longer available for this tutor"));
    }

    private static boolean isEligible(Cat cat, UUID ownerId) {
        return !cat.isDeceased() && ownerId.equals(cat.getOwner().getId());
    }

    private CatIntakeInvitationRepository.OpenScope openScope(String hash) {
        return invitations.findOpenScope(hash, clock.instant()).orElseThrow(CatIntakeService::unavailable);
    }

    private Map<UUID, Map<String, String>> scopeOf(String snapshot) {
        return json.readValue(snapshot, new TypeReference<>() {});
    }

    private Map<String, String> fieldsOf(String snapshot) {
        return json.readValue(snapshot, new TypeReference<>() {});
    }

    private static String requireDigest(String authorization) {
        String hash = digestFromAuthorization(authorization);
        if (hash == null) throw unavailable();
        return hash;
    }

    private static String digestFromAuthorization(String authorization) {
        if (authorization == null || !authorization.regionMatches(true, 0, "Bearer ", 0, 7)) return null;
        String token = authorization.substring(7);
        return TOKEN_PATTERN.matcher(token).matches() ? digest(token) : null;
    }

    private static String digest(String token) {
        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256")
                    .digest(token.getBytes(StandardCharsets.US_ASCII)));
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("SHA-256 is unavailable", exception);
        }
    }

    private static ResponseStatusException unavailable() {
        return new ResponseStatusException(HttpStatus.NOT_FOUND, "Intake link unavailable");
    }

    private static ConflictException staleDraft() {
        return new ConflictException("The proposal has changed since this form was opened");
    }

    private record Draft(CatIntakeReview previous, UUID catId, UUID draftId, String catName, Map<String, String> original,
                         Map<String, String> proposed, List<UUID> retainedPhotoIds, List<String> photoKeys) {}
}
