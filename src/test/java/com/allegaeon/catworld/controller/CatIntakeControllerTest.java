package com.allegaeon.catworld.controller;

import com.allegaeon.catworld.exception.CatPhotoErrorCode;
import com.allegaeon.catworld.exception.CatPhotoException;
import com.allegaeon.catworld.model.Cat;
import com.allegaeon.catworld.model.CatIntakeInvitation;
import com.allegaeon.catworld.model.CatIntakePhoto;
import com.allegaeon.catworld.model.CatIntakeReview;
import com.allegaeon.catworld.model.CatPhoto;
import com.allegaeon.catworld.model.Owner;
import com.allegaeon.catworld.model.Sex;
import com.allegaeon.catworld.model.UserAccount;
import com.allegaeon.catworld.model.UserRole;
import com.allegaeon.catworld.repository.CatInformationalPhotoRepository;
import com.allegaeon.catworld.repository.CatIntakeInvitationRepository;
import com.allegaeon.catworld.repository.CatIntakePhotoRepository;
import com.allegaeon.catworld.repository.CatIntakeReviewRepository;
import com.allegaeon.catworld.repository.CatPhotoRepository;
import com.allegaeon.catworld.repository.CatRepository;
import com.allegaeon.catworld.repository.OwnerRepository;
import com.allegaeon.catworld.repository.UserAccountRepository;
import com.allegaeon.catworld.service.LibVipsCatPhotoNormalizer;
import com.allegaeon.catworld.service.NormalizedCatPhoto;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.context.jdbc.Sql;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockMultipartHttpServletRequestBuilder;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Base64;
import java.util.HashMap;
import java.util.HexFormat;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.containsInAnyOrder;
import static org.hamcrest.Matchers.containsInAnyOrder;
import static org.hamcrest.Matchers.hasItem;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doReturn;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.httpBasic;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:catworld_intake;MODE=MySQL",
        "CATWORLD_INTAKE_URL=http://localhost:4202/"
})
@AutoConfigureMockMvc
@ActiveProfiles("test")
class CatIntakeControllerTest {
    private static final String INVITATIONS = "/api/cat-intake/invitations";
    private static final String REVIEW = "/api/cat-intake/review";
    private static final String REQUEST = "/api/intake/request";
    private static final String SUBMISSIONS = "/api/intake/submissions";
    private static final Instant NOW = Instant.parse("2026-10-05T13:00:00Z");
    private static final byte[] JPEG = {(byte) 0xff, (byte) 0xd8, (byte) 0xff, (byte) 0xd9};

    @Autowired MockMvc mvc;
    @Autowired ObjectMapper json;
    @Autowired CatRepository cats;
    @Autowired OwnerRepository owners;
    @Autowired UserAccountRepository users;
    @Autowired CatInformationalPhotoRepository photos;
    @Autowired CatPhotoRepository profilePhotos;
    @Autowired CatIntakeInvitationRepository invitations;
    @Autowired CatIntakeReviewRepository reviews;
    @Autowired CatIntakePhotoRepository intakePhotos;
    @Autowired PasswordEncoder passwordEncoder;
    @Autowired JdbcTemplate jdbc;
    @MockitoBean Clock clock;
    @MockitoBean LibVipsCatPhotoNormalizer normalizer;

    @DynamicPropertySource
    static void nativeDatabase(DynamicPropertyRegistry registry) {
        String url = System.getenv("CATWORLD_NATIVE_MYSQL_URL");
        if (url == null || url.isBlank()) return;
        registry.add("spring.datasource.url", () -> url);
        registry.add("spring.datasource.driver-class-name", () -> "com.mysql.cj.jdbc.Driver");
        registry.add("spring.datasource.username", () -> System.getenv("CATWORLD_NATIVE_MYSQL_USERNAME"));
        registry.add("spring.datasource.password", () -> System.getenv("CATWORLD_NATIVE_MYSQL_PASSWORD"));
        registry.add("spring.flyway.enabled", () -> true);
        registry.add("spring.jpa.hibernate.ddl-auto", () -> "validate");
    }

    @BeforeEach
    void setClock() {
        // Approval publishes shared options. Each scenario starts with its own catalog.
        jdbc.update("""
                update cats set food_variety_id = null, food_brand_id = null, breed_option_id = null,
                    coat_option_id = null, color_option_id = null, last_internal_dewormer_option_id = null,
                    last_external_dewormer_option_id = null
                """);
        jdbc.update("delete from food_varieties");
        jdbc.update("delete from food_brands");
        jdbc.update("delete from cat_profile_options");
        when(clock.instant()).thenReturn(NOW);
        when(clock.getZone()).thenReturn(ZoneId.of("America/Argentina/Buenos_Aires"));
    }

    @Test
    @Sql(statements = "insert into litter_rates (id) "
            + "select 1 where not exists (select 1 from litter_rates where id = 1)")
    void exposesTheExactLitterReferenceThroughThePrivateForm() throws Exception {
        Owner owner = owner();
        cat(owner, "Fictional cat");
        var invite = issue(owner, false);
        String rate = "9876543210987654321";

        mvc.perform(put("/api/litter-rate").with(admin()).contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of("litterRatePerKg", rate))))
                .andExpect(status().isOk());
        try {
            mvc.perform(get(REQUEST).header(HttpHeaders.AUTHORIZATION, invite.authorization()))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.catalogOptions").isMap())
                    .andExpect(jsonPath("$.foodVarieties").isArray())
                    .andExpect(jsonPath("$.litterRatePerKg").isString())
                    .andExpect(jsonPath("$.litterRatePerKg").value(rate));
            mvc.perform(get("/api/litter-rate").header(HttpHeaders.AUTHORIZATION, invite.authorization()))
                    .andExpect(status().isUnauthorized());
        } finally {
            mvc.perform(delete("/api/litter-rate").with(admin())).andExpect(status().isNoContent());
        }
    }

    @Test
    void snapshotsTheHouseholdAndKeepsPendingProfilesOpenUntilTheFinalApproval() throws Exception {
        Owner owner = owner();
        Cat withPending = cat(owner, "Pending vaccine");
        withPending.setLastRabiesDate(null);
        cats.saveAndFlush(withPending);
        Cat complete = cat(owner, "Up to date");

        var invite = issue(owner, false);
        Cat addedLater = cat(owner, "Added later");
        mvc.perform(get(REQUEST).header(HttpHeaders.AUTHORIZATION, invite.authorization()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.cats.length()").value(2))
                .andExpect(jsonPath("$.cats[0].requestedFields[0]").value("lastRabiesDate"))
                .andExpect(jsonPath("$.cats[1].requestedFields").isEmpty());
        mvc.perform(submission(invite, List.of(Map.of("catId", addedLater.getId(), "fields", Map.of("coat", "Largo")))))
                .andExpect(status().isBadRequest());
        mvc.perform(submission(invite, List.of(Map.of("catId", complete.getId(), "fields", Map.of("coat", "Largo")))))
                .andExpect(status().isBadRequest());

        var first = Map.of("catId", withPending.getId(), "fields", Map.of("lastRabiesDate", "2026-09-20"),
                "photoKeys", List.of("proof"));
        mvc.perform(submission(invite, List.of(Map.of("catId", withPending.getId(),
                "fields", Map.of("lastRabiesDate", "2026-09-20")))))
                .andExpect(status().isBadRequest());
        doReturn(new NormalizedCatPhoto(JPEG, 10, 10, "a".repeat(64))).when(normalizer).normalize(any());
        mvc.perform(submission(invite, List.of(first),
                new MockMultipartFile("proof", "proof.jpg", "image/jpeg", JPEG)))
                .andExpect(status().isNoContent());

        var row = rowFor(reviewList(), owner.getId(), "Pending vaccine");
        String reviewId = row.get("id").asString();
        var before = detail(reviewId);
        String photoId = before.get("photos").get(0).get("id").asString();
        var reopened = json.readTree(mvc.perform(get(REQUEST).header(HttpHeaders.AUTHORIZATION, invite.authorization()))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString());
        var draft = reopened.get("cats").get(0);
        assertThat(draft.get("proposedFields").get("lastRabiesDate").asString()).isEqualTo("2026-09-20");
        mvc.perform(get("/api/intake/photos/{id}", photoId).header(HttpHeaders.AUTHORIZATION, invite.authorization()))
                .andExpect(status().isOk()).andExpect(content().bytes(JPEG));
        var unrelated = issue(owner(), true);
        mvc.perform(get("/api/intake/photos/{id}", photoId)
                        .header(HttpHeaders.AUTHORIZATION, unrelated.authorization()))
                .andExpect(status().isNotFound());
        mvc.perform(submission(unrelated, List.of(Map.of("draftId", UUID.randomUUID(), "retainedPhotoIds", List.of(photoId),
                        "fields", newRegistration("Unrelated", Map.of())))))
                .andExpect(status().isBadRequest());
        var correction = Map.of("catId", withPending.getId(), "draftId", draft.get("draftId").asString(),
                "revision", draft.get("revision").asInt(), "retainedPhotoIds", List.of(photoId),
                "fields", Map.of("lastRabiesDate", "2026-09-21"));
        mvc.perform(submission(invite, List.of(correction))).andExpect(status().isNoContent());
        mvc.perform(submission(invite, List.of(correction))).andExpect(status().isConflict());
        assertThat(rowFor(reviewList(), owner.getId(), "Pending vaccine").get("id").asString()).isEqualTo(reviewId);
        var approval = new java.util.HashMap<String, Object>();
        approval.put("expectedCatUpdatedAt", before.get("catUpdatedAt").asString());
        approval.put("expectedReviewRevision", before.get("revision").asInt());
        approval.put("fields", Map.of("lastRabiesDate", "2026-09-20"));
        mvc.perform(post(REVIEW + "/{id}/approve", reviewId).with(admin()).contentType(MediaType.APPLICATION_JSON)
                .content(json.writeValueAsString(approval))).andExpect(status().isConflict());
        approval.put("expectedReviewRevision", detail(reviewId).get("revision").asInt());
        approval.put("fields", Map.of("lastRabiesDate", "2026-09-21"));
        mvc.perform(post(REVIEW + "/{id}/approve", reviewId).with(admin()).contentType(MediaType.APPLICATION_JSON)
                .content(json.writeValueAsString(approval))).andExpect(status().isNoContent());
        mvc.perform(get(REQUEST).header(HttpHeaders.AUTHORIZATION, invite.authorization()))
                .andExpect(status().isNotFound());
    }

    @Test
    void reviewReportsOnlyUnansweredFieldsFromTheOriginalRequest() throws Exception {
        var owner = owner();
        var cat = cat(owner, "Partial profile");
        cat.setFoodBrand(null);
        cat.setLitterBrand(null);
        cat.setLastRabiesDate(null);
        cat.setLastTripleFelineDate(null);
        cats.saveAndFlush(cat);
        var invite = issue(owner, false);
        mvc.perform(submission(invite, List.of(Map.of("catId", cat.getId(),
                        "fields", Map.of("foodBrand", "Royal Canin")))))
                .andExpect(status().isNoContent());

        cat.setLastRabiesDate(LocalDate.of(2026, 10, 1));
        cats.saveAndFlush(cat);
        var row = rowFor(reviewList(), owner.getId(), cat.getName());
        mvc.perform(get(REVIEW + "/{id}", row.get("id").asString()).with(admin()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.unansweredRequestedFields",
                        containsInAnyOrder("foodDetail", "litterBrand", "lastRabiesDate", "lastTripleFelineDate")));
    }

    @Test
    void keepsTheOtherRequestedCatOpenAndPreservesPendingReviewAfterRevocation() throws Exception {
        Owner owner = owner();
        Cat first = cat(owner, "First");
        Cat second = cat(owner, "Second");
        first.setLitterBrand(null);
        second.setLitterBrand(null);
        cats.saveAllAndFlush(List.of(first, second));

        var invite = issue(owner, false);
        mvc.perform(submission(invite, List.of(Map.of("catId", first.getId(), "fields",
                        Map.of("coat", "Corto", "foodBrand", "\u00a0")))))
                .andExpect(status().isNoContent());
        assertThat(reviewList().valueStream().noneMatch(row -> owner.getId().toString().equals(row.get("ownerId").asString())))
                .isTrue();
        mvc.perform(submission(invite, List.of(Map.of("catId", first.getId(), "fields", Map.of("litterBrand", "Pellets")))))
                .andExpect(status().isNoContent());

        var firstReview = detail(rowFor(reviewList(), owner.getId(), "First").get("id").asString());
        approve(firstReview, Map.of("litterBrand", "Pellets"), List.of(), firstReview.get("catUpdatedAt").asString(), 204);
        mvc.perform(get(REQUEST).header(HttpHeaders.AUTHORIZATION, invite.authorization()))
                .andExpect(status().isOk()).andExpect(jsonPath("$.cats.length()").value(1))
                .andExpect(jsonPath("$.cats[0].catId").value(second.getId().toString()));
        mvc.perform(submission(invite, List.of(Map.of("catId", first.getId(), "revision", 1,
                        "fields", Map.of("litterBrand", "Clay")))))
                .andExpect(status().isConflict());

        mvc.perform(submission(invite, List.of(Map.of("catId", second.getId(),
                        "fields", Map.of("litterBrand", "Other pellets", "coat", "Sin pelo")))))
                .andExpect(status().isNoContent());
        var secondReview = detail(rowFor(reviewList(), owner.getId(), "Second").get("id").asString());
        mvc.perform(delete(INVITATIONS + "/{id}", invite.id()).with(admin())).andExpect(status().isNoContent());
        mvc.perform(get(REQUEST).header(HttpHeaders.AUTHORIZATION, invite.authorization())).andExpect(status().isNotFound());
        approve(secondReview, Map.of("coat", "Sin pelo"), List.of(), secondReview.get("catUpdatedAt").asString(), 204);
    }

    @Test
    void dismissesNewAndExistingProposalsIndependentlyWithoutApplyingTheirData() throws Exception {
        Owner owner = owner();
        Cat existing = cat(owner, "Existing");
        existing.setLitterBrand(null);
        Cat other = cat(owner, "Other");
        other.setLitterBrand(null);
        cats.saveAllAndFlush(List.of(existing, other));
        var invite = issue(owner, true);
        UUID draftId = UUID.randomUUID();
        var newFields = newRegistration("New", Map.of("lastRabiesDate", "2026-09-21",
                "foodBrand", "Never Approved Food"));
        doReturn(new NormalizedCatPhoto(JPEG, 10, 10, "a".repeat(64))).when(normalizer).normalize(any());
        mvc.perform(submission(invite, List.of(
                        Map.of("draftId", draftId, "fields", newFields, "photoKeys", List.of("new-proof")),
                        Map.of("catId", existing.getId(), "fields", Map.of("litterBrand", "Pellets",
                                "lastRabiesDate", "2026-09-20"), "photoKeys", List.of("existing-proof"))),
                new MockMultipartFile("new-proof", "new.jpg", "image/jpeg", JPEG),
                new MockMultipartFile("existing-proof", "existing.jpg", "image/jpeg", JPEG)))
                .andExpect(status().isNoContent());

        var newReview = detail(rowFor(reviewList(), owner.getId(), "New").get("id").asString());
        var existingReview = detail(rowFor(reviewList(), owner.getId(), "Existing").get("id").asString());
        String newPhoto = newReview.get("photos").get(0).get("id").asString();
        dismiss(newReview, 204);
        dismiss(newReview, 404);
        approve(newReview, newFields, List.of(newPhoto), null, 404);
        mvc.perform(get(REQUEST).header(HttpHeaders.AUTHORIZATION, invite.authorization()))
                .andExpect(status().isOk()).andExpect(jsonPath("$.cats.length()").value(2))
                .andExpect(jsonPath("$.cats[*].catId", containsInAnyOrder(
                        existing.getId().toString(), other.getId().toString())));
        mvc.perform(get("/api/intake/photos/{id}", newPhoto).header(HttpHeaders.AUTHORIZATION, invite.authorization()))
                .andExpect(status().isNotFound());
        mvc.perform(submission(invite, List.of(Map.of("draftId", draftId, "fields", newFields))))
                .andExpect(status().isConflict());
        assertThat(cats.findByOwner_Id(owner.getId(), org.springframework.data.domain.Pageable.unpaged()).getContent())
                .extracting(Cat::getId).containsExactlyInAnyOrder(existing.getId(), other.getId());

        var existingTimestamp = existingReview.get("catUpdatedAt").asString();
        approve(existingReview, Map.of("litterBrand", "  "), List.of(), existingTimestamp, 400);
        String existingPhoto = existingReview.get("photos").get(0).get("id").asString();
        mvc.perform(submission(invite, List.of(Map.of("catId", existing.getId(),
                        "revision", existingReview.get("revision").asLong(), "retainedPhotoIds", List.of(existingPhoto),
                        "fields", Map.of("litterBrand", "New pellets", "lastRabiesDate", "2026-09-20")))))
                .andExpect(status().isNoContent());
        dismiss(existingReview, 409);
        var corrected = detail(existingReview.get("id").asString());
        assertThat(corrected.get("proposed").get("litterBrand").asString()).isEqualTo("New pellets");
        dismiss(corrected, 204);
        mvc.perform(submission(invite, List.of(Map.of("catId", existing.getId(),
                        "revision", corrected.get("revision").asLong(), "fields", Map.of("litterBrand", "Replay")))))
                .andExpect(status().isConflict());
        mvc.perform(get(REQUEST).header(HttpHeaders.AUTHORIZATION, invite.authorization()))
                .andExpect(status().isOk()).andExpect(jsonPath("$.cats.length()").value(1))
                .andExpect(jsonPath("$.cats[0].catId").value(other.getId().toString()));

        var persisted = cats.findById(existing.getId()).orElseThrow();
        assertThat(persisted.getLitterBrand()).isNull();
        assertThat(persisted.getLastRabiesDate()).isEqualTo(LocalDate.of(2026, 8, 12));
        assertThat(photos.findGallery(existing.getId())).isEmpty();
        for (var row : List.of(newReview, existingReview)) {
            UUID id = UUID.fromString(row.get("id").asString());
            assertThat(intakePhotos.findIdsByReview(id)).isEmpty();
            var dismissed = reviews.findById(id).orElseThrow();
            assertThat(dismissed.getApprovedAt()).isNull();
            assertThat(dismissed.getDismissedAt()).isEqualTo(NOW);
        }
        assertThat(reviewList().valueStream().noneMatch(row -> owner.getId().toString().equals(row.get("ownerId").asString())))
                .isTrue();
        mvc.perform(submission(invite, List.of(Map.of("catId", other.getId(), "fields", Map.of("litterBrand", "Pellets")))))
                .andExpect(status().isNoContent());
        var last = detail(rowFor(reviewList(), owner.getId(), "Other").get("id").asString());
        dismiss(last, 204);
        mvc.perform(get(REQUEST).header(HttpHeaders.AUTHORIZATION, invite.authorization())).andExpect(status().isNotFound());
    }

    @Test
    void allowsSelectedPhotosWhenNoProfileFieldsAreApplied() throws Exception {
        Owner owner = owner();
        Cat existing = cat(owner, "Existing");
        var invite = issue(owner, false);
        doReturn(new NormalizedCatPhoto(JPEG, 10, 10, "a".repeat(64))).when(normalizer).normalize(any());
        mvc.perform(submission(invite, List.of(Map.of("catId", existing.getId(),
                        "fields", Map.of("lastRabiesDate", "2026-09-20"), "photoKeys", List.of("proof"))),
                new MockMultipartFile("proof", "proof.jpg", "image/jpeg", JPEG)))
                .andExpect(status().isNoContent());
        var review = detail(rowFor(reviewList(), owner.getId(), "Existing").get("id").asString());
        approve(review, Map.of(), List.of(review.get("photos").get(0).get("id").asString()),
                review.get("catUpdatedAt").asString(), 204);
        assertThat(cats.findById(existing.getId()).orElseThrow().getLastRabiesDate()).isEqualTo(LocalDate.of(2026, 8, 12));
        assertThat(photos.findGallery(existing.getId())).hasSize(1);
    }

    @Test
    void stagesAndApprovesFivePhotosAndRejectsASixthWhenEditing() throws Exception {
        var owner = owner();
        var existing = cat(owner, "Vaccine evidence");
        var invite = issue(owner, false);
        var firstFive = List.of("proof-0", "proof-1", "proof-2", "proof-3", "proof-4");
        var six = List.of("proof-0", "proof-1", "proof-2", "proof-3", "proof-4", "proof-5");
        var vaccine = Map.of("lastRabiesDate", "2026-09-20");
        doReturn(new NormalizedCatPhoto(JPEG, 10, 10, "a".repeat(64))).when(normalizer).normalize(any());

        mvc.perform(submission(invite, List.of(Map.of("catId", existing.getId(), "fields", vaccine,
                        "photoKeys", six)), six.stream().map(CatIntakeControllerTest::proof)
                        .toArray(MockMultipartFile[]::new)))
                .andExpect(status().isBadRequest()).andExpect(content().string("Up to five photos are allowed per cat"));
        mvc.perform(submission(invite, List.of(Map.of("catId", existing.getId(), "fields", vaccine,
                        "photoKeys", firstFive)), firstFive.stream().map(CatIntakeControllerTest::proof)
                        .toArray(MockMultipartFile[]::new)))
                .andExpect(status().isNoContent());
        var row = rowFor(reviewList(), owner.getId(), "Vaccine evidence");
        var review = detail(row.get("id").asString());
        var staged = review.get("photos").valueStream().map(photo -> photo.get("id").asString()).toList();
        assertThat(staged).hasSize(5);
        var edit = new HashMap<String, Object>(Map.of("catId", existing.getId(), "fields", vaccine,
                "revision", review.get("revision").asLong(), "photoKeys", List.of("replacement")));
        edit.put("retainedPhotoIds", staged);
        mvc.perform(submission(invite, List.of(edit), proof("replacement")))
                .andExpect(status().isBadRequest()).andExpect(content().string("Up to five photos are allowed per cat"));

        edit.put("retainedPhotoIds", staged.subList(0, 4));
        mvc.perform(submission(invite, List.of(edit), proof("replacement"))).andExpect(status().isNoContent());
        var updated = detail(row.get("id").asString());
        var updatedPhotos = updated.get("photos").valueStream().map(photo -> photo.get("id").asString()).toList();
        assertThat(updatedPhotos).hasSize(5).containsAll(staged.subList(0, 4)).doesNotContain(staged.getLast());
        var invalidApproval = new ArrayList<>(updatedPhotos);
        invalidApproval.add(UUID.randomUUID().toString());
        approve(updated, vaccine, invalidApproval, updated.get("catUpdatedAt").asString(), 400);
        approve(updated, vaccine, updatedPhotos, updated.get("catUpdatedAt").asString(), 204);
        assertThat(photos.findGallery(existing.getId())).hasSize(5);
    }

    private static MockMultipartFile proof(String key) {
        return new MockMultipartFile(key, key + ".jpg", "image/jpeg", JPEG);
    }

    @Test
    void returningToOriginalValuesAndRemovingEvidenceWithdrawsAnExistingProposal() throws Exception {
        var owner = owner();
        var cat = cat(owner, "Original profile");
        cat.setLitterBrand(null);
        cats.saveAndFlush(cat);
        var invite = issue(owner, false);
        doReturn(new NormalizedCatPhoto(JPEG, 10, 10, "a".repeat(64))).when(normalizer).normalize(any());
        mvc.perform(submission(invite, List.of(Map.of("catId", cat.getId(), "fields",
                        Map.of("litterBrand", "Pellets", "lastRabiesDate", "2026-08-30"),
                        "photoKeys", List.of("proof"))),
                new MockMultipartFile("proof", "record.jpg", "image/jpeg", JPEG)))
                .andExpect(status().isNoContent());
        var row = rowFor(reviewList(), owner.getId(), cat.getName());
        var pending = detail(row.get("id").asString());
        var photoId = pending.get("photos").get(0).get("id").asString();

        mvc.perform(submission(invite, List.of(Map.of("catId", cat.getId(), "revision",
                        pending.get("revision").asLong(), "fields", Map.of(), "retainedPhotoIds", List.of()))))
                .andExpect(status().isNoContent());
        mvc.perform(get(REQUEST).header(HttpHeaders.AUTHORIZATION, invite.authorization()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.cats[0].requestedFields", hasItem("litterBrand")))
                .andExpect(jsonPath("$.cats[0].proposedFields").isEmpty())
                .andExpect(jsonPath("$.cats[0].photos").isEmpty());
        mvc.perform(get(REVIEW + "/{id}", row.get("id").asString()).with(admin()))
                .andExpect(status().isNotFound());
        mvc.perform(get("/api/intake/photos/{id}", photoId).header(HttpHeaders.AUTHORIZATION, invite.authorization()))
                .andExpect(status().isNotFound());
        assertThat(cats.findById(cat.getId()).orElseThrow().getLitterBrand()).isNull();

        mvc.perform(submission(invite, List.of(Map.of("catId", cat.getId(), "fields",
                        Map.of("litterBrand", "Clay")))))
                .andExpect(status().isNoContent());
        assertThat(rowFor(reviewList(), owner.getId(), cat.getName()).get("id")).isNotEqualTo(row.get("id"));
    }

    @Test
    void legacyLinksKeepTheirSelectedScopeAndConsumedLinksStayClosedWithTheirPendingPhotos() throws Exception {
        Owner owner = owner();
        Cat selected = cat(owner, "Selected");
        cat(owner, "Unselected");
        var token = Base64.getUrlEncoder().withoutPadding().encodeToString(new SecureRandom().generateSeed(32));
        var tokenHash = HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(token.getBytes(StandardCharsets.US_ASCII)));
        var legacy = invitations.saveAndFlush(new CatIntakeInvitation(owner, tokenHash, false,
                json.writeValueAsString(Map.of(selected.getId(), Map.of("name", "Selected"))), NOW.plusSeconds(3_600)));
        mvc.perform(get(REQUEST).header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
                .andExpect(status().isOk()).andExpect(jsonPath("$.cats.length()").value(1))
                .andExpect(jsonPath("$.cats[0].catId").value(selected.getId().toString()));

        legacy.close(NOW, "{}");
        var review = reviews.saveAndFlush(new CatIntakeReview(invitations.saveAndFlush(legacy), selected.getId(),
                "Selected", "{\"coat\":\"Short\"}", "{\"coat\":\"Long\"}", NOW));
        var photo = intakePhotos.saveAndFlush(new CatIntakePhoto(review, JPEG));
        mvc.perform(get(REQUEST).header(HttpHeaders.AUTHORIZATION, "Bearer " + token)).andExpect(status().isNotFound());
        mvc.perform(get("/api/intake/photos/{id}", photo.getId()).header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
                .andExpect(status().isNotFound());
        mvc.perform(get(REVIEW + "/{id}/photos/{photoId}", review.getId(), photo.getId()).with(admin()))
                .andExpect(status().isOk()).andExpect(content().bytes(JPEG));
        var detail = detail(review.getId().toString());
        assertThat(detail.path("unansweredRequestedFields").isArray()).isTrue();
        assertThat(detail.path("unansweredRequestedFields").isEmpty()).isTrue();
        approve(detail, Map.of("coat", "Long"), List.of(), detail.get("catUpdatedAt").asString(), 204);
        assertThat(cats.findById(selected.getId()).orElseThrow().getCoat()).isEqualTo("Long");
    }

    @Test
    void intakePublishesOnlyTheCorrectedAndSelectedCatalogField() throws Exception {
        var owner = owner();
        var existing = cat(owner, "Catalog review");
        var invite = issue(owner, false);
        var proposed = Map.of("breed", "  European  SHORTHAIR  ", "color", "Unreviewed color");
        mvc.perform(submission(invite, List.of(Map.of("catId", existing.getId(), "fields", proposed))))
                .andExpect(status().isNoContent());
        mvc.perform(get(REQUEST).header(HttpHeaders.AUTHORIZATION, invite.authorization()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.catalogOptions.breed[?(@.name == 'European SHORTHAIR')]").isEmpty());

        var review = detail(rowFor(reviewList(), owner.getId(), existing.getName()).get("id").asString());
        approve(review, Map.of("breed", "European Shorthair"), List.of(),
                review.get("catUpdatedAt").asString(), 204);
        var updated = cats.findById(existing.getId()).orElseThrow();
        assertThat(updated.getBreed()).isEqualTo("European Shorthair");
        assertThat(updated.getColor()).isNull();
        var otherInvite = issue(owner(), true);
        mvc.perform(get(REQUEST).header(HttpHeaders.AUTHORIZATION, otherInvite.authorization()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.catalogOptions.breed[*].name", hasItem("European Shorthair")))
                .andExpect(jsonPath("$.catalogOptions.color").doesNotExist());
    }

    @Test
    void enforcesFixedCoatAndAcceptsMatchingColorAsFreeText() throws Exception {
        jdbc.update("""
                insert into cat_profile_options (id, category, name, normalized_key)
                values (X'00112233445566778899aabbccddeeff', 'color', 'Gris', X'67726973')
                """);
        Owner owner = owner();
        var invite = issue(owner, true);
        UUID draftId = UUID.randomUUID();
        var registration = newRegistration("New coat", Map.of("coat", "Semilargo", "color", "Gris"));
        mvc.perform(submission(invite, List.of(Map.of("draftId", draftId, "fields", registration))))
                .andExpect(status().isBadRequest());
        registration.put("coat", "Sin pelo");
        mvc.perform(submission(invite, List.of(Map.of("draftId", draftId, "fields", registration))))
                .andExpect(status().isNoContent());
        approve(rowFor(reviewList(), owner.getId(), "New coat"), registration, List.of(), null, 204);
        var saved = cats.findAll().stream().filter(cat -> cat.getName().equals("New coat")).findFirst().orElseThrow();
        assertThat(saved.getColor()).isEqualTo("Gris");
        assertThat(saved.getColorOptionId()).isNull();
        assertThat(saved.getCoat()).isEqualTo("Sin pelo");
    }

    @Test
    void partialApprovalOfOwnLitterKeepsExistingFoodAndDoesNotPublishTheOmittedBrand() throws Exception {
        var owner = owner();
        var existing = cat(owner, "Litter review");
        existing.setFoodBrand("Purina Pro Plan");
        existing.setLitterBrand(null);
        cats.saveAndFlush(existing);
        var invite = issue(owner, false);
        var proposed = Map.of("foodBrand", "Hola", "litterBrand", "Trae sus propias piedritas");
        mvc.perform(submission(invite, List.of(Map.of("catId", existing.getId(), "fields", proposed))))
                .andExpect(status().isNoContent());

        var review = detail(rowFor(reviewList(), owner.getId(), existing.getName()).get("id").asString());
        approve(review, Map.of("litterBrand", "Trae sus propias piedritas"), List.of(),
                review.get("catUpdatedAt").asString(), 204);

        var updated = cats.findById(existing.getId()).orElseThrow();
        assertThat(updated.getFoodBrand()).isEqualTo("Purina Pro Plan");
        assertThat(updated.getLitterBrand()).isEqualTo("Trae sus propias piedritas");
        var otherInvite = issue(owner(), true);
        mvc.perform(get(REQUEST).header(HttpHeaders.AUTHORIZATION, otherInvite.authorization()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.catalogOptions.foodBrand[?(@.name == 'Hola')]").isEmpty());
    }

    @Test
    void requiresASelectionForMatchingCatalogTextAndRejectsContradictoryIds() throws Exception {
        Owner publisher = owner();
        var firstInvite = issue(publisher, true);
        var first = newRegistration("Publisher", Map.of("foodBrand", "Royal Nutrition API", "breed", "Forest cat API"));
        mvc.perform(submission(firstInvite, List.of(Map.of("draftId", UUID.randomUUID(), "fields", first))))
                .andExpect(status().isNoContent());
        approve(rowFor(reviewList(), publisher.getId(), "Publisher"), first, List.of(), null, 204);

        Owner recipient = owner();
        var invite = issue(recipient, true);
        var form = recipientForm(invite);
        String brandId = catalogId(form, "foodBrand", "Royal Nutrition API");
        String breedId = catalogId(form, "breed", "Forest cat API");
        var fields = newRegistration("Recipient", Map.of("foodBrand", "R", "breed", "Forest cat API",
                "coat", "Largo", "color", "Recipient color"));
        UUID draftId = UUID.randomUUID();
        mvc.perform(submission(invite, List.of(Map.of("draftId", draftId, "fields", fields,
                        "optionIds", Map.of("breed", breedId)))))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("CAT_INTAKE_CATALOG_CHANGED"))
                .andExpect(jsonPath("$.field").value("foodBrand"));
        fields.put("foodBrand", "Royal Nutrition API");
        mvc.perform(submission(invite, List.of(Map.of("draftId", draftId, "fields", fields,
                        "optionIds", Map.of("breed", breedId)))))
                .andExpect(status().isConflict());
        fields.put("foodBrand", "Different brand");
        mvc.perform(submission(invite, List.of(Map.of("draftId", draftId, "fields", fields,
                        "optionIds", Map.of("foodBrand", brandId, "breed", breedId)))))
                .andExpect(status().isBadRequest());
        fields.put("foodBrand", "Royal Nutrition API");
        mvc.perform(submission(invite, List.of(Map.of("draftId", draftId, "fields", fields,
                        "optionIds", Map.of("foodBrand", brandId, "breed", brandId)))))
                .andExpect(status().isBadRequest());
        mvc.perform(submission(invite, List.of(Map.of("draftId", draftId, "fields", fields,
                        "optionIds", Map.of("foodBrand", UUID.randomUUID(), "breed", breedId)))))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.field").value("foodBrand"));
        assertThat(recipientForm(invite).get("cats")).isEmpty();
    }

    @Test
    void publishesFoodVarietiesOnlyOnApprovalAndScopesTheirIdentityToTheBrand() throws Exception {
        Owner publisher = owner();
        var firstInvite = issue(publisher, true);
        var first = newRegistration("Variety publisher", Map.of("foodBrand", "My Scope Brand", "foodDetail", "Gastro Kitten"));
        mvc.perform(submission(firstInvite, List.of(Map.of("draftId", UUID.randomUUID(), "fields", first))))
                .andExpect(status().isNoContent());
        assertThat(recipientForm(firstInvite).get("foodVarieties")).isNotNull();
        mvc.perform(get(REQUEST).header(HttpHeaders.AUTHORIZATION, firstInvite.authorization()))
                .andExpect(jsonPath("$.foodVarieties[?(@.name == 'Gastro Kitten')]").isEmpty());
        approve(rowFor(reviewList(), publisher.getId(), "Variety publisher"), first, List.of(), null, 204);

        Owner recipient = owner();
        var invite = issue(recipient, true);
        var form = recipientForm(invite);
        String brandId = catalogId(form, "foodBrand", "My Scope Brand");
        String varietyId = form.get("foodVarieties").valueStream()
                .filter(variety -> variety.get("name").asString().equals("Gastro Kitten"))
                .filter(variety -> variety.get("brandId").asString().equals(brandId))
                .findFirst().orElseThrow().get("id").asString();
        var fields = newRegistration("Variety recipient", Map.of("foodBrand", "Other Scope Brand", "foodDetail", "Gastro Kitten",
                "breed", "Variety recipient breed", "coat", "Largo", "color", "Variety recipient color"));
        UUID draftId = UUID.randomUUID();
        mvc.perform(submission(invite, List.of(Map.of("draftId", draftId, "fields", fields,
                        "optionIds", Map.of("foodDetail", varietyId)))))
                .andExpect(status().isBadRequest());
        fields.put("foodBrand", "my   scope BRAND");
        fields.put("foodDetail", "Gastro");
        mvc.perform(submission(invite, List.of(Map.of("draftId", draftId, "fields", fields,
                        "optionIds", Map.of("foodBrand", brandId)))))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.field").value("foodDetail"));
        fields.put("foodDetail", "gastro   KITTEN");
        mvc.perform(submission(invite, List.of(Map.of("draftId", draftId, "fields", fields,
                        "optionIds", Map.of("foodBrand", brandId, "foodDetail", varietyId)))))
                .andExpect(status().isNoContent());
        mvc.perform(get(REQUEST).header(HttpHeaders.AUTHORIZATION, invite.authorization()))
                .andExpect(jsonPath("$.cats[0].optionIds.foodBrand").value(brandId))
                .andExpect(jsonPath("$.cats[0].optionIds.foodDetail").value(varietyId))
                .andExpect(jsonPath("$.cats[0].proposedFields.foodBrand").value("My Scope Brand"))
                .andExpect(jsonPath("$.cats[0].proposedFields.foodDetail").value("Gastro Kitten"));
        approve(rowFor(reviewList(), recipient.getId(), "Variety recipient"), fields, List.of(), null, 204);
    }

    @Test
    void rejectsPartialApprovalOfAnotherBrandsVarietyAndKeepsThePreviousDietOnBrandChange() throws Exception {
        Owner owner = owner();
        var register = issue(owner, true);
        var registration = newRegistration("Cat with diet",
                Map.of("foodBrand", "Original Diet Brand", "foodDetail", "Familiar Puppy-Free Diet"));
        mvc.perform(submission(register, List.of(Map.of("draftId", UUID.randomUUID(), "fields", registration))))
                .andExpect(status().isNoContent());
        approve(rowFor(reviewList(), owner.getId(), "Cat with diet"), registration, List.of(), null, 204);
        Cat cat = cats.findByOwner_Id(owner.getId(), org.springframework.data.domain.Pageable.unpaged()).getContent().getFirst();
        assertThat(cat.getFoodVarietyId()).isNotNull();
        cat.setLastRabiesDate(LocalDate.of(2026, 8, 12));
        cat.setLastTripleFelineDate(LocalDate.of(2026, 8, 12));
        cats.saveAndFlush(cat);

        var invite = issue(owner, false);
        var fields = Map.of("foodBrand", "Other Diet Brand", "foodDetail", "Other Brand Diet");
        mvc.perform(submission(invite, List.of(Map.of("catId", cat.getId(), "fields", fields))))
                .andExpect(status().isNoContent());
        var proposal = detail(rowFor(reviewList(), owner.getId(), cat.getName()).get("id").asString());
        assertThat(proposal.get("proposedFoodDetailBrand").asString()).isEqualTo("Other Diet Brand");
        String timestamp = proposal.get("catUpdatedAt").asString();
        approve(proposal, Map.of("foodDetail", fields.get("foodDetail")), List.of(), timestamp, 400);
        assertThat(cats.findById(cat.getId()).orElseThrow().getFoodVarietyId()).isEqualTo(cat.getFoodVarietyId());

        approve(proposal, Map.of("foodBrand", fields.get("foodBrand")), List.of(), timestamp, 204);
        Cat updated = cats.findById(cat.getId()).orElseThrow();
        assertThat(updated.getFoodBrand()).isEqualTo("Other Diet Brand");
        assertThat(updated.getFoodDetail()).isEqualTo("Familiar Puppy-Free Diet");
        assertThat(updated.getFoodVarietyId()).isNull();
        mvc.perform(get(REQUEST).header(HttpHeaders.AUTHORIZATION, issue(owner(), true).authorization()))
                .andExpect(jsonPath("$.foodVarieties[?(@.name == 'Other Brand Diet')]").isEmpty());
    }

    @Test
    void acceptsAnExplicitVarietyCorrectionForTheRetainedBrand() throws Exception {
        Owner owner = owner();
        var register = issue(owner, true);
        var registration = newRegistration("Cat with retained diet",
                Map.of("foodBrand", "Retainable Diet Brand", "foodDetail", "Adult Care"));
        mvc.perform(submission(register, List.of(Map.of("draftId", UUID.randomUUID(), "fields", registration))))
                .andExpect(status().isNoContent());
        approve(rowFor(reviewList(), owner.getId(), "Cat with retained diet"), registration, List.of(), null, 204);
        Cat cat = cats.findByOwner_Id(owner.getId(), org.springframework.data.domain.Pageable.unpaged()).getContent().getFirst();
        UUID retainedVarietyId = cat.getFoodVarietyId();
        assertThat(retainedVarietyId).isNotNull();
        cat.setLastRabiesDate(LocalDate.of(2026, 8, 12));
        cat.setLastTripleFelineDate(LocalDate.of(2026, 8, 12));
        cats.saveAndFlush(cat);

        var invite = issue(owner, false);
        var proposed = Map.of("foodBrand", "Alternative Diet Brand", "foodDetail", "Kitten Care");
        mvc.perform(submission(invite, List.of(Map.of("catId", cat.getId(), "fields", proposed))))
                .andExpect(status().isNoContent());
        var review = detail(rowFor(reviewList(), owner.getId(), cat.getName()).get("id").asString());
        assertThat(review.get("proposedFoodDetailBrand").asString()).isEqualTo("Alternative Diet Brand");

        var approval = new HashMap<String, Object>(Map.of(
                "fields", Map.of("foodDetail", "Adult Care", "foodBrand", "Alternative Diet Brand"),
                "foodVarietyId", retainedVarietyId, "expectedCatUpdatedAt", review.get("catUpdatedAt").asString(),
                "expectedReviewRevision", review.get("revision").asLong()));
        mvc.perform(post(REVIEW + "/{id}/approve", review.get("id").asString()).with(admin())
                        .contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(approval)))
                .andExpect(status().isBadRequest());

        approval.put("fields", Map.of("foodDetail", "Adult Care"));
        mvc.perform(post(REVIEW + "/{id}/approve", review.get("id").asString()).with(admin())
                        .contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(approval)))
                .andExpect(status().isNoContent());
        Cat approved = cats.findById(cat.getId()).orElseThrow();
        assertThat(approved.getFoodBrand()).isEqualTo("Retainable Diet Brand");
        assertThat(approved.getFoodVarietyId()).isEqualTo(retainedVarietyId);
    }

    @Test
    void simultaneousApprovalsShareOneNormalizedVarietyForTheSameBrand() throws Exception {
        Owner publisher = owner();
        var publish = issue(publisher, true);
        var registration = newRegistration("Publisher", Map.of("foodBrand", "One Variety Brand"));
        mvc.perform(submission(publish, List.of(Map.of("draftId", UUID.randomUUID(), "fields", registration))))
                .andExpect(status().isNoContent());
        approve(rowFor(reviewList(), publisher.getId(), "Publisher"), registration, List.of(), null, 204);

        Cat first = cat(owner(), "First concurrent cat");
        first.setFoodBrand(registration.get("foodBrand"));
        cats.saveAndFlush(first);
        Cat second = cat(owner(), "Second concurrent cat");
        second.setFoodBrand(registration.get("foodBrand"));
        cats.saveAndFlush(second);
        var firstFields = Map.of("foodDetail", "Digestive Balance");
        var secondFields = Map.of("foodDetail", "digestive   balance");
        mvc.perform(submission(issue(first.getOwner(), false), List.of(Map.of("catId", first.getId(), "fields", firstFields))))
                .andExpect(status().isNoContent());
        mvc.perform(submission(issue(second.getOwner(), false), List.of(Map.of("catId", second.getId(), "fields", secondFields))))
                .andExpect(status().isNoContent());
        var pending = reviewList();
        var firstReview = detail(rowFor(pending, first.getOwner().getId(), first.getName()).get("id").asString());
        var secondReview = detail(rowFor(pending, second.getOwner().getId(), second.getName()).get("id").asString());

        var start = new CountDownLatch(1);
        try (var executor = Executors.newFixedThreadPool(2)) {
            var firstApproval = executor.submit(() -> {
                start.await();
                approve(firstReview, firstFields, List.of(), firstReview.get("catUpdatedAt").asString(), 204);
                return null;
            });
            var secondApproval = executor.submit(() -> {
                start.await();
                approve(secondReview, secondFields, List.of(), secondReview.get("catUpdatedAt").asString(), 204);
                return null;
            });
            start.countDown();
            firstApproval.get(10, TimeUnit.SECONDS);
            secondApproval.get(10, TimeUnit.SECONDS);
        }

        Cat firstApproved = cats.findById(first.getId()).orElseThrow();
        Cat secondApproved = cats.findById(second.getId()).orElseThrow();
        assertThat(firstApproved.getFoodVarietyId()).isNotNull().isEqualTo(secondApproved.getFoodVarietyId());
        assertThat(firstApproved.getFoodDetail()).isEqualTo(secondApproved.getFoodDetail());
        var form = recipientForm(issue(owner(), true));
        String brandId = catalogId(form, "foodBrand", registration.get("foodBrand"));
        assertThat(form.get("foodVarieties").valueStream()
                .filter(variety -> variety.get("brandId").asString().equals(brandId))).hasSize(2);
    }

    @Test
    void preservesAnEarlierProposalAndItsRequestedScopeDuringAnUnrelatedCorrection() throws Exception {
        Owner owner = owner();
        Cat existing = cat(owner, "Legacy diet");
        existing.setFoodBrand(null);
        cats.saveAndFlush(existing);
        var invite = issue(owner, false);
        mvc.perform(get(REQUEST).header(HttpHeaders.AUTHORIZATION, invite.authorization()))
                .andExpect(jsonPath("$.cats[0].requestedFields[0]").value("foodBrand"))
                .andExpect(jsonPath("$.cats[0].requestedFields[1]").value("foodDetail"));
        var invitation = invitations.findById(UUID.fromString(invite.id())).orElseThrow();
        jdbc.update("update cat_intake_invitations set requested_fields_snapshot = ? where id = ?",
                json.writeValueAsString(Map.of(existing.getId(), List.of("foodBrand"))), uuidBytes(invitation.getId()));
        UUID draftId = UUID.randomUUID();
        var historical = reviews.saveAndFlush(new CatIntakeReview(invitation, existing.getId(), draftId, existing.getName(),
                "{}", "{\"foodBrand\":\"R\",\"foodDetail\":\"Historical Diet\"}", NOW));

        Owner publisher = owner();
        var publish = issue(publisher, true);
        var registration = newRegistration("Publisher", Map.of("foodBrand", "Royal Nutrition Historic"));
        mvc.perform(submission(publish, List.of(Map.of("draftId", UUID.randomUUID(), "fields", registration))))
                .andExpect(status().isNoContent());
        approve(rowFor(reviewList(), publisher.getId(), "Publisher"), registration, List.of(), null, 204);

        mvc.perform(get(REQUEST).header(HttpHeaders.AUTHORIZATION, invite.authorization()))
                .andExpect(jsonPath("$.cats[0].requestedFields.length()").value(1))
                .andExpect(jsonPath("$.cats[0].proposedFields.foodBrand").value("R"));
        mvc.perform(submission(invite, List.of(Map.of("catId", existing.getId(), "draftId", draftId,
                        "revision", historical.getRevision(), "fields", Map.of(
                        "foodBrand", "R", "foodDetail", "Historical Diet", "coat", "Largo")))))
                .andExpect(status().isNoContent());
        var updated = detail(historical.getId().toString());
        assertThat(updated.get("proposedFoodDetailBrand").isNull()).isTrue();
        approve(updated, Map.of("foodDetail", "Historical Diet"), List.of(), updated.get("catUpdatedAt").asString(), 204);
        Cat approved = cats.findById(existing.getId()).orElseThrow();
        assertThat(approved.getFoodDetail()).isEqualTo("Historical Diet");
        assertThat(approved.getFoodVarietyId()).isNull();
    }

    @Test
    void onlyOffersFoodBrandsAfterApprovalAndMatchesTheCompleteNormalizedName() throws Exception {
        Owner owner = owner();
        var invite = issue(owner, true);
        var first = newRegistration("First", Map.of("foodBrand", "Northern Lights Food"));
        mvc.perform(submission(invite, List.of(Map.of("draftId", UUID.randomUUID(), "fields", first))))
                .andExpect(status().isNoContent());
        mvc.perform(get(REQUEST).header(HttpHeaders.AUTHORIZATION, invite.authorization()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.brands[?(@.name == 'Northern Lights Food')]").isEmpty());
        approve(rowFor(reviewList(), owner.getId(), "First"), first, List.of(), null, 204);

        var secondInvite = issue(owner(), true);
        mvc.perform(get(REQUEST).header(HttpHeaders.AUTHORIZATION, secondInvite.authorization()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.brands[*].name", hasItem("Northern Lights Food")))
                .andExpect(jsonPath("$.catalogOptions.foodBrand[*].name", hasItem("Northern Lights Food")));
        var second = newRegistration("Second", Map.of("foodBrand", "  northern   LIGHTS food  "));
        var third = newRegistration("Third", Map.of("foodBrand", "Nortern Lights Food"));
        var form = recipientForm(secondInvite);
        var sharedSelections = Map.of("breed", catalogId(form, "breed", first.get("breed")));
        var secondSelections = new HashMap<>(sharedSelections);
        secondSelections.put("foodBrand", catalogId(form, "foodBrand", first.get("foodBrand")));
        secondSelections.put("foodDetail", form.get("foodVarieties").get(0).get("id").asString());
        mvc.perform(submission(secondInvite, List.of(
                        Map.of("draftId", UUID.randomUUID(), "fields", second, "optionIds", secondSelections),
                        Map.of("draftId", UUID.randomUUID(), "fields", third, "optionIds", sharedSelections))))
                .andExpect(status().isNoContent());
        mvc.perform(get(REQUEST).header(HttpHeaders.AUTHORIZATION, secondInvite.authorization()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.cats[*].proposedFields.foodBrand", containsInAnyOrder(
                        "Northern Lights Food", "Nortern Lights Food")))
                .andExpect(jsonPath("$.brands[?(@.name == 'Nortern Lights Food')]").isEmpty());
    }

    @Test
    void scopesRecipientAndStagesTwoCatsBeforeApprovingThemIndividually() throws Exception {
        Owner owner = owner();
        Cat existing = cat(owner, "Existing");
        Cat unrelated = cat(owner(), "Other");
        var invite = issue(owner, true);

        mvc.perform(get(REQUEST)).andExpect(status().isNotFound());
        mvc.perform(get(REQUEST).header(HttpHeaders.AUTHORIZATION, invite.authorization()))
                .andExpect(status().isOk())
                .andExpect(header().string(HttpHeaders.CACHE_CONTROL, "no-store"))
                .andExpect(jsonPath("$.ownerId").doesNotExist())
                .andExpect(jsonPath("$.cats.length()").value(1))
                .andExpect(jsonPath("$.cats[0].catId").value(existing.getId().toString()))
                .andExpect(jsonPath("$.cats[0].fields.name").value("Existing"))
                .andExpect(jsonPath("$.cats[0].fields.notes").doesNotExist())
                .andExpect(jsonPath("$.cats[0].fields.ownerId").doesNotExist());

        mvc.perform(submission(invite, List.of(Map.of("catId", unrelated.getId(),
                        "fields", Map.of("color", "Other"), "photoKeys", List.of()))))
                .andExpect(status().isBadRequest());
        mvc.perform(submission(invite, List.of(Map.of("catId", existing.getId(),
                        "fields", Map.of("notes", "Not editable"), "photoKeys", List.of()))))
                .andExpect(status().isBadRequest());
        var entries = List.of(
                Map.of("catId", existing.getId(), "fields",
                        Map.of("name", "Existing", "coat", "Sin pelo", "foodBrand", "   "), "photoKeys", List.of()),
                Map.of("draftId", UUID.randomUUID(), "fields", newRegistration("New", Map.of("lastRabiesDate", "2025-02-03")),
                        "photoKeys", List.of("proof")));
        when(normalizer.normalize(any())).thenThrow(new CatPhotoException(CatPhotoErrorCode.CAT_PHOTO_UNSUPPORTED_FORMAT));
        mvc.perform(submission(invite, entries, new MockMultipartFile("proof", "fake.jpg", "image/jpeg", new byte[] {1})))
                .andExpect(status().isBadRequest());
        doReturn(new NormalizedCatPhoto(JPEG, 10, 10, "a".repeat(64))).when(normalizer).normalize(any());

        mvc.perform(submission(invite, entries, new MockMultipartFile("proof", "record.jpg", "image/jpeg", new byte[] {1})))
                .andExpect(status().isNoContent());
        mvc.perform(get(REQUEST).header(HttpHeaders.AUTHORIZATION, invite.authorization()))
                .andExpect(status().isOk()).andExpect(jsonPath("$.cats.length()").value(2));
        assertThat(cats.findByOwner_Id(owner.getId(), org.springframework.data.domain.Pageable.unpaged())).hasSize(1);
        assertThat(cats.findById(existing.getId()).orElseThrow().getCoat()).isEqualTo("Corto");

        JsonNode rows = reviewList();
        JsonNode existingRow = rowFor(rows, owner.getId(), "Existing");
        JsonNode newRow = rowFor(rows, owner.getId(), "New");
        JsonNode existingReview = detail(existingRow.get("id").asString());
        assertThat(existingReview.get("proposed").get("coat").asString()).isEqualTo("Sin pelo");
        assertThat(existingReview.get("proposed").has("name")).isFalse();
        assertThat(existingReview.get("proposed").has("foodBrand")).isFalse();

        mvc.perform(internalCatEdit(existing, "Largo", existingReview.get("catUpdatedAt").asString()))
                .andExpect(status().isOk());
        approve(existingRow, Map.of("coat", "Sin pelo"), List.of(), existingReview.get("catUpdatedAt").asString(), 409);
        JsonNode conflict = detail(existingRow.get("id").asString());
        assertThat(conflict.get("current").get("coat").asString()).isEqualTo("Largo");
        assertThat(conflict.get("conflictFields").get(0).asString()).isEqualTo("coat");
        approve(existingRow, Map.of("coat", "Sin pelo"), List.of(), conflict.get("catUpdatedAt").asString(), 204);
        mvc.perform(get(REQUEST).header(HttpHeaders.AUTHORIZATION, invite.authorization()))
                .andExpect(status().isOk()).andExpect(jsonPath("$.cats.length()").value(1))
                .andExpect(jsonPath("$.cats[0].proposedFields.name").value("New"));
        var newDraft = entries.get(1).get("draftId");

        Cat approvedExisting = cats.findById(existing.getId()).orElseThrow();
        assertThat(approvedExisting.getCoat()).isEqualTo("Sin pelo");
        assertThat(approvedExisting.getFoodBrand()).isEqualTo("Existing brand");
        assertThat(approvedExisting.getNotes()).isEqualTo("Internal");

        JsonNode newReview = detail(newRow.get("id").asString());
        String proof = newReview.get("photos").get(0).get("id").asString();
        var correction = Map.of("draftId", newDraft, "revision", newReview.get("revision").asInt(),
                "retainedPhotoIds", List.of(proof), "fields", newRegistration("New name", Map.of("lastRabiesDate", "2025-02-03")));
        mvc.perform(submission(invite, List.of(correction))).andExpect(status().isNoContent());
        assertThat(rowFor(reviewList(), owner.getId(), "New name").get("id")).isEqualTo(newRow.get("id"));
        mvc.perform(get(REVIEW + "/{id}/photos/{photoId}", newRow.get("id").asString(), proof))
                .andExpect(status().isUnauthorized());
        mvc.perform(get(REVIEW + "/{id}/photos/{photoId}", newRow.get("id").asString(), proof).with(admin()))
                .andExpect(status().isOk()).andExpect(content().bytes(JPEG));
        approve(detail(newRow.get("id").asString()), Map.of("name", "New name", "sex", "FEMALE", "birthDate", "2021-08-21"),
                List.of(proof), null, 204);
        mvc.perform(get(REQUEST).header(HttpHeaders.AUTHORIZATION, invite.authorization())).andExpect(status().isNotFound());

        Cat approvedNew = cats.findByOwner_Id(owner.getId(), org.springframework.data.domain.Pageable.unpaged())
                .stream().filter(cat -> "New name".equals(cat.getName())).findFirst().orElseThrow();
        assertThat(approvedNew.getLastRabiesDate()).isNull();
        var savedPhotos = photos.findGallery(approvedNew.getId());
        assertThat(savedPhotos).hasSize(1);
        assertThat(photos.findContent(approvedNew.getId(), savedPhotos.getFirst().id())).contains(JPEG);
    }

    @Test
    void approvalRejectsAnOlderInternalDraftAndFreshUpdatesReturnTheStoredTimestamp() throws Exception {
        Owner owner = owner();
        Cat existing = cat(owner, "Existing");
        profilePhotos.saveAndFlush(CatPhoto.builder().catId(existing.getId()).content(JPEG)
                .width(10).height(10).byteSize(JPEG.length).sha256("a".repeat(64)).build());
        var invite = issue(owner, false);
        mvc.perform(submission(invite, List.of(Map.of("catId", existing.getId(),
                        "fields", Map.of("coat", "Largo"), "photoKeys", List.of()))))
                .andExpect(status().isNoContent());
        JsonNode row = rowFor(reviewList(), owner.getId(), "Existing");
        String originalTimestamp = detail(row.get("id").asString()).get("catUpdatedAt").asString();
        approve(row, Map.of("coat", "Largo"), List.of(), originalTimestamp, 204);

        mvc.perform(internalCatEdit(existing, "Outdated", originalTimestamp).param("removePhoto", "true"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("CAT_EDIT_STALE"));
        mvc.perform(get("/api/cats/{id}/detail", existing.getId()).with(admin()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.cat.coat").value("Largo"))
                .andExpect(jsonPath("$.cat.hasPhoto").value(true));

        String reloaded = mvc.perform(get("/api/cats/{id}", existing.getId()).with(admin()))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        String refreshedTimestamp = json.readTree(reloaded).get("updatedAt").asString();
        assertThat(refreshedTimestamp).isNotEqualTo(originalTimestamp);
        String edited = mvc.perform(internalCatEdit(existing, "Sin pelo", refreshedTimestamp))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.coat").value("Sin pelo"))
                .andReturn().getResponse().getContentAsString();
        String savedTimestamp = json.readTree(edited).get("updatedAt").asString();
        mvc.perform(get("/api/cats/{id}/detail", existing.getId()).with(admin()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.cat.updatedAt").value(savedTimestamp));
        String photoRemoved = mvc.perform(internalCatEdit(existing, "Sin pelo", savedTimestamp)
                        .param("removePhoto", "true"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.hasPhoto").value(false))
                .andReturn().getResponse().getContentAsString();
        assertThat(json.readTree(photoRemoved).get("updatedAt").asString()).isNotEqualTo(savedTimestamp);
        mvc.perform(internalCatEdit(existing, "Older than photo removal", savedTimestamp))
                .andExpect(status().isConflict());
    }

    @Test
    void limitsManagementToAdminsAndInvalidatesSupersededRevokedAndExpiredLinks() throws Exception {
        Owner owner = owner();
        var staff = users.saveAndFlush(UserAccount.builder().username("intake-staff-" + UUID.randomUUID().toString().substring(0, 8))
                .passwordHash(passwordEncoder.encode("intake-staff-password")).role(UserRole.STAFF).enabled(true).build());
        String body = json.writeValueAsString(Map.of("ownerId", owner.getId(), "allowNewCats", true));
        mvc.perform(post(INVITATIONS).with(httpBasic(staff.getUsername(), "intake-staff-password"))
                .contentType(MediaType.APPLICATION_JSON).content(body)).andExpect(status().isForbidden());
        mvc.perform(get(REVIEW).with(httpBasic(staff.getUsername(), "intake-staff-password")))
                .andExpect(status().isForbidden());
        mvc.perform(post(REVIEW + "/{id}/dismiss", UUID.randomUUID())
                        .with(httpBasic(staff.getUsername(), "intake-staff-password"))
                        .contentType(MediaType.APPLICATION_JSON).content("{\"expectedReviewRevision\":1}"))
                .andExpect(status().isForbidden());
        var first = issue(owner, true);
        var second = issue(owner, true);
        mvc.perform(get(REQUEST).header(HttpHeaders.AUTHORIZATION, first.authorization())).andExpect(status().isNotFound());
        mvc.perform(get(INVITATIONS + "/active").param("ownerId", owner.getId().toString()).with(admin()))
                .andExpect(status().isOk()).andExpect(jsonPath("$.id").value(second.id()))
                .andExpect(jsonPath("$.url").doesNotExist());
        mvc.perform(delete(INVITATIONS + "/{id}", second.id()).with(admin())).andExpect(status().isNoContent());
        mvc.perform(get(REQUEST).header(HttpHeaders.AUTHORIZATION, second.authorization())).andExpect(status().isNotFound());
        var third = issue(owner, true);
        when(clock.instant()).thenReturn(NOW.plus(7, ChronoUnit.DAYS));
        mvc.perform(get(REQUEST).header(HttpHeaders.AUTHORIZATION, third.authorization())).andExpect(status().isNotFound());
        mvc.perform(get(INVITATIONS + "/active").param("ownerId", owner.getId().toString()).with(admin()))
                .andExpect(status().isNoContent());
    }

    @Test
    void allowsOnlyTheConfiguredRecipientOrigin() throws Exception {
        Owner owner = owner();
        var invite = issue(owner, true);
        String allowed = "http://localhost:4202";
        String unrelated = "https://other.example";
        var entries = List.of(Map.of("draftId", UUID.randomUUID(), "fields", newRegistration("From the form", Map.of()),
                "photoKeys", List.of()));

        mvc.perform(options(SUBMISSIONS).header(HttpHeaders.ORIGIN, allowed)
                        .header(HttpHeaders.ACCESS_CONTROL_REQUEST_METHOD, "POST")
                        .header(HttpHeaders.ACCESS_CONTROL_REQUEST_HEADERS, "Authorization, Content-Type"))
                .andExpect(status().isOk())
                .andExpect(header().string(HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN, allowed))
                .andExpect(header().doesNotExist(HttpHeaders.ACCESS_CONTROL_ALLOW_CREDENTIALS));
        mvc.perform(get(REQUEST).header(HttpHeaders.AUTHORIZATION, invite.authorization())
                        .header(HttpHeaders.ORIGIN, allowed))
                .andExpect(status().isOk())
                .andExpect(header().string(HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN, allowed));
        mvc.perform(submission(invite, entries).header(HttpHeaders.ORIGIN, unrelated))
                .andExpect(status().isForbidden());
        mvc.perform(get(REVIEW).with(admin()).header(HttpHeaders.ORIGIN, allowed))
                .andExpect(status().isForbidden());
        mvc.perform(submission(invite, entries).header(HttpHeaders.ORIGIN, allowed))
                .andExpect(status().isNoContent())
                .andExpect(header().string(HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN, allowed));
    }

    @Test
    void rejectsACatThatChangedTutorsBeforeSubmissionOrApproval() throws Exception {
        Owner original = owner();
        Owner other = owner();
        Cat movedBeforeSubmission = cat(original, "First");
        Cat movedBeforeApproval = cat(original, "Second");
        var firstLink = issue(original, false);
        movedBeforeSubmission.setOwner(other);
        cats.saveAndFlush(movedBeforeSubmission);
        var firstEntry = Map.of("catId", movedBeforeSubmission.getId(), "fields", Map.of("coat", "Largo"));
        mvc.perform(get(REQUEST).header(HttpHeaders.AUTHORIZATION, firstLink.authorization()))
                .andExpect(status().isOk()).andExpect(jsonPath("$.cats.length()").value(1))
                .andExpect(jsonPath("$.cats[0].catId").value(movedBeforeApproval.getId().toString()));
        mvc.perform(submission(firstLink, List.of(firstEntry))).andExpect(status().isBadRequest());

        var secondLink = issue(original, false);
        var secondEntry = Map.of("catId", movedBeforeApproval.getId(), "fields", Map.of("coat", "Largo"));
        mvc.perform(submission(secondLink, List.of(secondEntry))).andExpect(status().isNoContent());
        var row = rowFor(reviewList(), original.getId(), "Second");
        var detail = detail(row.get("id").asString());
        movedBeforeApproval.setOwner(other);
        cats.saveAndFlush(movedBeforeApproval);
        approve(row, Map.of("coat", "Largo"), List.of(), detail.get("catUpdatedAt").asString(), 409);
        assertThat(cats.findById(movedBeforeApproval.getId()).orElseThrow().getCoat()).isEqualTo("Corto");
        assertThat(reviewList().valueStream().map(pending -> pending.get("id").asString()))
                .doesNotContain(row.get("id").asString());
    }

    @Test
    void simultaneousFirstSubmissionsForTheSameNewDraftCreateOneProposal() throws Exception {
        Owner owner = owner();
        var invite = issue(owner, true);
        var entries = List.of(Map.of("draftId", UUID.randomUUID(), "fields", newRegistration("Single", Map.of()),
                "photoKeys", List.of()));
        CountDownLatch start = new CountDownLatch(1);
        try (var pool = Executors.newFixedThreadPool(2)) {
            var first = pool.submit(() -> { start.await(); return mvc.perform(submission(invite, entries)).andReturn().getResponse().getStatus(); });
            var second = pool.submit(() -> { start.await(); return mvc.perform(submission(invite, entries)).andReturn().getResponse().getStatus(); });
            start.countDown();
            assertThat(List.of(first.get(15, TimeUnit.SECONDS), second.get(15, TimeUnit.SECONDS)))
                    .containsExactlyInAnyOrder(204, 409);
        }
        assertThat(reviewList().valueStream().filter(row -> row.get("ownerId").asString().equals(owner.getId().toString())).count())
                .isEqualTo(1);
    }

    @Test
    void householdSharesCareInstructionsAndKeepsBothPrivateNotesPrivate() throws Exception {
        Owner owner = owner();
        owner.setNotes("Private tutor note");
        owners.saveAndFlush(owner);
        Cat cat = cat(owner, "With care instructions");
        cat.setNotes("Private cat note");
        var timestamp = cats.findById(cat.getId()).orElseThrow().getUpdatedAt().toString();
        mvc.perform(internalCatEdit(cat, "Corto", timestamp, Map.of("careInstructions", "  Give medication with food  ")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.careInstructions").value("Give medication with food"));
        // Create the private note through the same internal update, then issue the household snapshot.
        var invite = issue(owner, false);
        assertPrivateNotesHidden(invite, "Give medication with food")
                .andExpect(jsonPath("$.cats[0].proposedFields").isEmpty());
        for (String privateKey : List.of("notes", "ownerNotes")) {
            mvc.perform(submission(invite, List.of(Map.of("catId", cat.getId(),
                            "fields", Map.of(privateKey, "Attempted replacement")))))
                    .andExpect(status().isBadRequest());
        }
        mvc.perform(submission(invite, List.of(Map.of("catId", cat.getId(),
                        "fields", Map.of("careInstructions", "Offer medication separately")))))
                .andExpect(status().isNoContent());
        assertPrivateNotesHidden(invite, "Give medication with food")
                .andExpect(jsonPath("$.cats[0].proposedFields.careInstructions").value("Offer medication separately"));

        var row = rowFor(reviewList(), owner.getId(), cat.getName());
        var review = detail(row.get("id").asString());
        approve(review, Map.of("careInstructions", "Offer medication separately"), List.of(),
                review.get("catUpdatedAt").asString(), 204);
        Cat approved = cats.findById(cat.getId()).orElseThrow();
        assertThat(approved.getNotes()).isEqualTo("Private cat note");
        mvc.perform(get("/api/cats/{id}", cat.getId()).with(admin())).andExpect(status().isOk())
                .andExpect(jsonPath("$.careInstructions").value("Offer medication separately"));
        assertThat(owners.findById(owner.getId()).orElseThrow().getNotes()).isEqualTo("Private tutor note");
    }

    @Test
    void invalidNewRegistrationRejectsWholeHouseholdAndYearOnlyRegistrationCanBeApproved() throws Exception {
        Owner owner = owner();
        Cat existing = cat(owner, "Existing");
        var invite = issue(owner, true);
        UUID draft = UUID.randomUUID();
        var existingUpdate = Map.of("catId", existing.getId(), "fields", Map.of("coat", "Largo"));
        var registration = newRegistration("Year only", Map.of());
        registration.remove("litterBrand");
        mvc.perform(submission(invite, List.of(existingUpdate, Map.of("draftId", draft, "fields", registration))))
                .andExpect(status().isBadRequest());
        assertThat(reviewList().valueStream().filter(row -> owner.getId().toString().equals(row.get("ownerId").asString())))
                .isEmpty();

        registration.put("birthDate", " ");
        registration.put("birthYear", "2021");
        registration.put("litterBrand", "Tutor litter");
        registration.put("lastRabiesDate", "2025-02-03");
        mvc.perform(submission(invite, List.of(Map.of("draftId", draft, "fields", registration))))
                .andExpect(status().isBadRequest());
        registration.remove("lastRabiesDate");
        mvc.perform(submission(invite, List.of(Map.of("draftId", draft, "fields", registration))))
                .andExpect(status().isNoContent());

        var review = detail(rowFor(reviewList(), owner.getId(), "Year only").get("id").asString());
        assertThat(review.get("proposed").has("birthDate")).isFalse();
        assertThat(review.get("proposed").get("birthYear").asString()).isEqualTo("2021");
        approve(review, Map.of("name", "Year only", "birthYear", "2021", "sex", "FEMALE"), List.of(), null, 204);
        Cat registered = cats.findByOwner_Id(owner.getId(), org.springframework.data.domain.Pageable.unpaged()).stream()
                .filter(item -> "Year only".equals(item.getName())).findFirst().orElseThrow();
        assertThat(registered.getBirthDate()).isNull();
        mvc.perform(get("/api/cats/{id}", registered.getId()).with(admin())).andExpect(status().isOk())
                .andExpect(jsonPath("$.birthYear").value(2021));
        assertThat(registered.getLastRabiesDate()).isNull();
    }

    @Test
    void preservesTheApprovalMinimumForRegistrationsAlreadySubmitted() throws Exception {
        Owner owner = owner();
        var invite = issue(owner, true);
        var invitation = invitations.findById(UUID.fromString(invite.id())).orElseThrow();
        var originalProposal = Map.of("name", "Previously submitted", "sex", "FEMALE", "birthDate", "2020-01-01");
        var pending = reviews.saveAndFlush(new CatIntakeReview(invitation, null,
                "Previously submitted", "{}", json.writeValueAsString(originalProposal), NOW));

        var review = detail(pending.getId().toString());
        approve(review, originalProposal, List.of(), null, 204);
        var registered = cats.findByOwner_Id(owner.getId(), org.springframework.data.domain.Pageable.unpaged())
                .stream().findFirst().orElseThrow();
        assertThat(registered.getBirthDate()).isEqualTo(LocalDate.of(2020, 1, 1));
        assertThat(registered.getBirthYear()).isNull();
    }

    @Test
    void switchesBirthPrecisionAsOneFieldAndPreservesItOnUnrelatedEdits() throws Exception {
        Owner owner = owner();
        Cat cat = cat(owner, "Birth precision");
        var invite = issue(owner, false);
        mvc.perform(get(REQUEST).header(HttpHeaders.AUTHORIZATION, invite.authorization()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.cats[0].fields.birthDate").value("2020-01-01"))
                .andExpect(jsonPath("$.cats[0].fields.birthYear").doesNotExist());
        mvc.perform(submission(invite, List.of(Map.of("catId", cat.getId(),
                        "fields", Map.of("birthYear", "2020", "birthDate", "2020-01-01")))))
                .andExpect(status().isBadRequest());
        mvc.perform(submission(invite, List.of(Map.of("catId", cat.getId(), "fields", Map.of("birthYear", "2020")))))
                .andExpect(status().isNoContent());
        String reviewId = rowFor(reviewList(), owner.getId(), cat.getName()).get("id").asString();
        var initial = detail(reviewId);
        assertThat(initial.get("conflictFields").size()).isZero();
        mvc.perform(internalCatEdit(cat, cat.getCoat(), initial.get("catUpdatedAt").asString(),
                        Map.of("birthDate", "2020-03-02")))
                .andExpect(status().isOk());
        var changed = detail(reviewId);
        assertThat(changed.get("conflictFields").valueStream().map(JsonNode::asString)).containsExactly("birthYear");
        approve(changed, Map.of("birthYear", "2020"), List.of(), changed.get("catUpdatedAt").asString(), 204);

        Cat yearOnly = cats.findById(cat.getId()).orElseThrow();
        assertThat(yearOnly.getBirthDate()).isNull();
        mvc.perform(internalCatEdit(yearOnly, "Largo", yearOnly.getUpdatedAt().toString(), Map.of()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.birthYear").value(2020));
        var laterInvite = issue(owner, false);
        mvc.perform(get(REQUEST).header(HttpHeaders.AUTHORIZATION, laterInvite.authorization()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.cats[0].fields.birthDate").doesNotExist())
                .andExpect(jsonPath("$.cats[0].fields.birthYear").value("2020"));
        mvc.perform(submission(laterInvite, List.of(Map.of("catId", cat.getId(),
                        "fields", Map.of("birthDate", " ", "birthYear", " ", "coat", "Sin pelo")))))
                .andExpect(status().isNoContent());
        var coatReview = detail(rowFor(reviewList(), owner.getId(), cat.getName()).get("id").asString());
        approve(coatReview, Map.of("coat", "Sin pelo"), List.of(), coatReview.get("catUpdatedAt").asString(), 204);
        mvc.perform(get("/api/cats/{id}", cat.getId()).with(admin())).andExpect(status().isOk())
                .andExpect(jsonPath("$.birthYear").value(2020));
    }

    private org.springframework.test.web.servlet.ResultActions assertPrivateNotesHidden(Invite invite, String publicCare)
            throws Exception {
        return mvc.perform(get(REQUEST).header(HttpHeaders.AUTHORIZATION, invite.authorization()))
                .andExpect(status().isOk())
                .andExpect(content().string(org.hamcrest.Matchers.not(org.hamcrest.Matchers.containsString("Private cat note"))))
                .andExpect(content().string(org.hamcrest.Matchers.not(org.hamcrest.Matchers.containsString("Private tutor note"))))
                .andExpect(jsonPath("$.cats[0].fields.notes").doesNotExist())
                .andExpect(jsonPath("$.cats[0].fields.ownerNotes").doesNotExist())
                .andExpect(jsonPath("$.cats[0].proposedFields.notes").doesNotExist())
                .andExpect(jsonPath("$.cats[0].proposedFields.ownerNotes").doesNotExist())
                .andExpect(jsonPath("$.cats[0].fields.careInstructions").value(publicCare));
    }

    private Map<String, String> newRegistration(String name, Map<String, String> changes) {
        var registration = new HashMap<>(Map.of("name", name, "sex", "FEMALE", "birthDate", "2021-08-21",
                "breed", "Domestic", "coat", "Corto", "color", "Black", "personality", "Calm",
                "foodBrand", "Tutor food", "foodDetail", "Dry", "litterBrand", "Tutor litter"));
        registration.putAll(changes);
        return registration;
    }

    private JsonNode recipientForm(Invite invite) throws Exception {
        return json.readTree(mvc.perform(get(REQUEST).header(HttpHeaders.AUTHORIZATION, invite.authorization()))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString());
    }

    private static String catalogId(JsonNode form, String field, String name) {
        return form.get("catalogOptions").get(field).valueStream()
                .filter(option -> option.get("name").asString().equals(name))
                .findFirst().orElseThrow().get("id").asString();
    }

    private static byte[] uuidBytes(UUID id) {
        return java.nio.ByteBuffer.allocate(16).putLong(id.getMostSignificantBits()).putLong(id.getLeastSignificantBits()).array();
    }

    private Owner owner() {
        return owners.saveAndFlush(Owner.builder().fullName("Intake Owner").primaryPhone("555")
                .createdBy(users.findByUsername("test-admin").orElseThrow()).build());
    }

    private Cat cat(Owner owner, String name) {
        return cats.saveAndFlush(Cat.builder().owner(owner).createdBy(owner.getCreatedBy()).name(name)
                .birthDate(LocalDate.of(2020, 1, 1)).sex(Sex.MALE).coat("Corto").foodBrand("Existing brand")
                .litterBrand("Tutor litter").lastRabiesDate(LocalDate.of(2026, 8, 12)).lastTripleFelineDate(LocalDate.of(2026, 8, 12))
                .notes("Internal").build());
    }

    private Invite issue(Owner owner, boolean allowNew) throws Exception {
        String result = mvc.perform(post(INVITATIONS).with(admin()).contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of("ownerId", owner.getId(), "allowNewCats", allowNew))))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
        var response = json.readTree(result);
        URI url = URI.create(response.get("url").asString());
        assertThat(url.getQuery()).isNull();
        assertThat(url.getFragment()).startsWith("token=");
        return new Invite(response.get("id").asString(), "Bearer " + url.getFragment().substring(6));
    }

    private MockMultipartHttpServletRequestBuilder submission(Invite invite, List<? extends Map<String, ?>> entries,
                                                              MockMultipartFile... images) {
        var builder = multipart(SUBMISSIONS).file(new MockMultipartFile("submission", "submission.json",
                "application/json", json.writeValueAsBytes(Map.of("cats", entries))));
        for (var image : images) builder.file(image);
        builder.header(HttpHeaders.AUTHORIZATION, invite.authorization());
        return builder;
    }

    private JsonNode reviewList() throws Exception {
        return json.readTree(mvc.perform(get(REVIEW).with(admin())).andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString());
    }

    private JsonNode rowFor(JsonNode rows, UUID ownerId, String name) {
        return rows.valueStream().filter(row -> ownerId.toString().equals(row.get("ownerId").asString())
                && name.equals(row.get("catName").asString())).findFirst().orElseThrow();
    }

    private JsonNode detail(String id) throws Exception {
        return json.readTree(mvc.perform(get(REVIEW + "/{id}", id).with(admin())).andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString());
    }

    private MockMultipartHttpServletRequestBuilder internalCatEdit(Cat cat, String coat, String expectedUpdatedAt) {
        return internalCatEdit(cat, coat, expectedUpdatedAt, Map.of());
    }

    private MockMultipartHttpServletRequestBuilder internalCatEdit(Cat cat, String coat, String expectedUpdatedAt,
                                                                    Map<String, String> changes) {
        var body = new HashMap<String, Object>(Map.of(
                "name", cat.getName(), "sex", cat.getSex(),
                "ownerId", cat.getOwner().getId(), "coat", coat, "foodBrand", cat.getFoodBrand(),
                "notes", cat.getNotes(), "expectedUpdatedAt", expectedUpdatedAt));
        if (cat.getBirthDate() != null) body.put("birthDate", cat.getBirthDate());
        if (cat.getLastRabiesDate() != null) body.put("lastRabiesDate", cat.getLastRabiesDate());
        if (cat.getLastTripleFelineDate() != null) body.put("lastTripleFelineDate", cat.getLastTripleFelineDate());
        body.putAll(changes);
        return multipart(HttpMethod.PUT, "/api/cats/{id}", cat.getId())
                .file(new MockMultipartFile("cat", "cat.json", MediaType.APPLICATION_JSON_VALUE,
                        json.writeValueAsBytes(body))).with(admin());
    }

    private void approve(JsonNode row, Map<String, String> fields, List<String> photoIds, String updatedAt, int status)
            throws Exception {
        var body = new java.util.HashMap<String, Object>();
        body.put("fields", fields);
        body.put("photoIds", photoIds);
        body.put("expectedCatUpdatedAt", updatedAt);
        body.put("expectedReviewRevision", row.has("revision") ? row.get("revision").asLong() : 1L);
        mvc.perform(post(REVIEW + "/{id}/approve", row.get("id").asString()).with(admin())
                        .contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(body)))
                .andExpect(status().is(status));
    }

    private org.springframework.test.web.servlet.request.RequestPostProcessor admin() {
        return httpBasic("test-admin", "test-password");
    }

    private void dismiss(JsonNode row, int status) throws Exception {
        var body = new java.util.HashMap<String, Object>();
        body.put("expectedCatUpdatedAt", row.get("catUpdatedAt").isNull() ? null : row.get("catUpdatedAt").asString());
        body.put("expectedReviewRevision", row.get("revision").asLong());
        mvc.perform(post(REVIEW + "/{id}/dismiss", row.get("id").asString()).with(admin())
                        .contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(body)))
                .andExpect(status().is(status));
    }

    private record Invite(String id, String authorization) {}
}
