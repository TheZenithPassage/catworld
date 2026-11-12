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

    private final CatIntakeInvitationRepository invitations;
    private final CatIntakeReviewRepository reviews;
    private final CatIntakePhotoRepository intakePhotos;
    private final CatInformationalPhotoRepository gallery;
    private final OwnerRepository owners;
    private final CatRepository cats;
    private final CatMutationTransactionService catMutations;
    private final CatIntakeFields fields;
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
        List<UUID> ids = request.catIds() == null ? List.of() : request.catIds();
        if (ids.size() > MAX_CATS || ids.stream().anyMatch(Objects::isNull) || new HashSet<>(ids).size() != ids.size()
                || (ids.isEmpty() && !request.allowNewCats())) {
            throw new BadRequestException("Select up to 20 existing cats or allow new cats");
        }
        var owner = owners.findByIdForUpdate(request.ownerId())
                .orElseThrow(() -> new ResourceNotFoundException("Owner", request.ownerId()));
        Map<UUID, Map<String, String>> scope = new LinkedHashMap<>();
        for (UUID id : ids) {
            var cat = cats.findById(id).filter(value -> value.getOwner().getId().equals(owner.getId()))
                    .orElseThrow(() -> new BadRequestException("Selected cats must belong to the tutor"));
            scope.put(id, fields.snapshot(cat));
        }

        Instant now = clock.instant();
        invitations.findOutstandingByOwnerForUpdate(owner.getId()).forEach(invitation -> invitation.revoke(now));
        byte[] secret = new byte[32];
        random.nextBytes(secret);
        String token = Base64.getUrlEncoder().withoutPadding().encodeToString(secret);
        var invitation = invitations.save(new CatIntakeInvitation(owner, digest(token),
                request.allowNewCats(), json.writeValueAsString(scope), now.plus(INVITATION_LIFETIME)));
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
            invitation.revoke(clock.instant());
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
        requireCurrentScope(invite.getOwnerId(), scope.keySet());
        return new RecipientForm(invite.getAllowNewCats(),
                scope.entrySet().stream().map(entry -> new ScopedCat(entry.getKey(), entry.getValue())).toList(),
                invite.getExpiresAt());
    }

    public void submit(String authorization, Submission submission, Map<String, List<MultipartFile>> parts) {
        String hash = requireDigest(authorization);
        // Read a projection, so this request cannot later reuse a cached invitation before acquiring its write lock.
        var invite = openScope(hash);
        var scope = scopeOf(invite.getScopeSnapshot());
        requireCurrentScope(invite.getOwnerId(), scope.keySet());
        var expectedPhotos = new HashSet<String>();
        var drafts = prepareDrafts(submission, invite, scope, expectedPhotos);
        var normalized = normalizePhotos(parts, expectedPhotos);

        new TransactionTemplate(transactions).executeWithoutResult(status -> {
            var locked = invitations.findByTokenHashForUpdate(hash).orElseThrow(CatIntakeService::unavailable);
            Instant now = clock.instant();
            if (!locked.isOpenAt(now)) throw unavailable();
            var ownerId = locked.getOwner().getId();
            if (!scope.isEmpty() && cats.findScopedForUpdate(scope.keySet(), ownerId).size() != scope.size()) {
                throw unavailable();
            }
            for (var draft : drafts) {
                var review = reviews.save(new CatIntakeReview(locked, draft.catId(), draft.catName(),
                        json.writeValueAsString(draft.original()), json.writeValueAsString(draft.proposed()), now));
                intakePhotos.saveAll(draft.photoKeys().stream()
                        .map(key -> new CatIntakePhoto(review, normalized.get(key).bytes())).toList());
            }
            locked.consume(now);
        });
    }

    @Transactional(readOnly = true)
    public List<ReviewRow> pending() {
        return reviews.findPendingRows().stream().map(row -> new ReviewRow(row.getId(), row.getOwnerId(),
                row.getOwnerName(), row.getCatId(), row.getCatName(), row.getSubmittedAt())).toList();
    }

    @Transactional(readOnly = true)
    public ReviewDetail review(UUID id) {
        var review = reviews.findById(id).filter(value -> value.getApprovedAt() == null)
                .orElseThrow(() -> new ResourceNotFoundException("Cat intake review", id));
        var owner = review.getInvitation().getOwner();
        var cat = review.getCatId() == null ? null : requireReviewCat(cats.findById(review.getCatId()), owner.getId());
        var current = cat == null ? null : fields.snapshot(cat);
        var original = fieldsOf(review.getOriginalFields());
        var proposed = fieldsOf(review.getProposedFields());
        List<String> conflicts = current == null ? List.of() : proposed.keySet().stream()
                .filter(key -> !Objects.equals(original.get(key), current.get(key))).toList();
        return new ReviewDetail(id, owner.getId(), owner.getFullName(), review.getCatId(), review.getCatName(),
                review.getSubmittedAt(), current, proposed, conflicts,
                intakePhotos.findIdsByReview(id).stream().map(ReviewPhoto::new).toList(),
                cat == null ? null : cat.getUpdatedAt());
    }

    @Transactional(readOnly = true)
    public byte[] reviewPhoto(UUID reviewId, UUID photoId) {
        return intakePhotos.findContent(reviewId, photoId)
                .orElseThrow(() -> new ResourceNotFoundException("Cat intake photo", photoId));
    }

    @Transactional
    public void approve(UUID id, Approval approval) {
        var review = reviews.findByIdForUpdate(id).filter(value -> value.getApprovedAt() == null)
                .orElseThrow(() -> new ResourceNotFoundException("Cat intake review", id));
        UUID ownerId = review.getInvitation().getOwner().getId();
        var cat = review.getCatId() == null ? null
                : requireReviewCat(cats.findByIdForUpdate(review.getCatId()), ownerId);
        if (cat != null && !Objects.equals(cat.getUpdatedAt(), approval.expectedCatUpdatedAt())) {
            throw new ConflictException("The cat has changed since this review was opened");
        }

        var accepted = fields.nonBlank(approval.fields());
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
        if (cat == null) {
            cat = catMutations.create(request, null);
        } else if (!accepted.isEmpty()) {
            cat = catMutations.update(cat.getId(), request, null, false);
        }
        Cat approvedCat = cat;
        Instant now = clock.instant();
        gallery.saveAll(acceptedPhotos.stream()
                .map(photo -> new CatInformationalPhoto(approvedCat, now, photo.getContent())).toList());
        intakePhotos.deleteByReview(id);
        review.approve(approvedCat.getId(), now);
    }

    private List<Draft> prepareDrafts(Submission submission, CatIntakeInvitationRepository.OpenScope invite,
                                      Map<UUID, Map<String, String>> scope, Set<String> expectedPhotos) {
        if (submission == null || submission.cats() == null || submission.cats().isEmpty() || submission.cats().size() > MAX_CATS) {
            throw new BadRequestException("Include between 1 and 20 cats");
        }
        Set<UUID> includedCats = new HashSet<>();
        List<Draft> drafts = new ArrayList<>();
        for (var submitted : submission.cats()) {
            if (submitted == null) throw new BadRequestException("Cat details are required");
            UUID catId = submitted.catId();
            if (catId == null && !invite.getAllowNewCats()) {
                throw new BadRequestException("This link is not open for new cats");
            }
            if (catId != null && (!scope.containsKey(catId) || !includedCats.add(catId))) {
                throw new BadRequestException("A cat is duplicated or outside this link's scope");
            }
            var proposed = fields.nonBlank(submitted.fields());
            var original = catId == null ? Map.<String, String>of() : scope.get(catId);
            proposed.entrySet().removeIf(entry -> Objects.equals(
                    entry.getValue(), original.getOrDefault(entry.getKey(), "").strip()));
            List<String> photoKeys = submitted.photoKeys() == null ? List.of() : submitted.photoKeys();
            if (photoKeys.size() > MAX_PHOTOS_PER_CAT) {
                throw new BadRequestException("Up to two photos are allowed per cat");
            }
            for (String key : photoKeys) {
                if (key == null || "submission".equals(key) || !PHOTO_KEY_PATTERN.matcher(key).matches()
                        || !expectedPhotos.add(key)) {
                    throw new BadRequestException("Invalid intake photo reference");
                }
            }
            if (catId != null && proposed.isEmpty() && photoKeys.isEmpty()) continue;

            Map<String, String> values = new LinkedHashMap<>(original);
            values.putAll(proposed);
            fields.request(invite.getOwnerId(), null, values);
            Map<String, String> previous = new LinkedHashMap<>(original);
            previous.keySet().retainAll(proposed.keySet());
            drafts.add(new Draft(catId, values.get("name"), previous, proposed, photoKeys));
        }
        return drafts;
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

    private void requireCurrentScope(UUID ownerId, Collection<UUID> ids) {
        if (!owners.existsById(ownerId)
                || (!ids.isEmpty() && cats.countByOwner_IdAndIdIn(ownerId, ids) != ids.size())) {
            throw unavailable();
        }
    }

    private static Cat requireReviewCat(Optional<Cat> candidate, UUID ownerId) {
        return candidate.filter(cat -> ownerId.equals(cat.getOwner().getId()))
                .orElseThrow(() -> new ConflictException("The cat is no longer available for this tutor"));
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

    private record Draft(UUID catId, String catName, Map<String, String> original,
                         Map<String, String> proposed, List<String> photoKeys) {}
}
