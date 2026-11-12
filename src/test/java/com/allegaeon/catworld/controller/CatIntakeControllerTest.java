package com.allegaeon.catworld.controller;

import com.allegaeon.catworld.exception.CatPhotoErrorCode;
import com.allegaeon.catworld.exception.CatPhotoException;
import com.allegaeon.catworld.model.Cat;
import com.allegaeon.catworld.model.Owner;
import com.allegaeon.catworld.model.Sex;
import com.allegaeon.catworld.model.UserAccount;
import com.allegaeon.catworld.model.UserRole;
import com.allegaeon.catworld.repository.CatInformationalPhotoRepository;
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
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockMultipartHttpServletRequestBuilder;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

import java.net.URI;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;

import static org.assertj.core.api.Assertions.assertThat;
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
    @Autowired PasswordEncoder passwordEncoder;
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
        when(clock.instant()).thenReturn(NOW);
    }

    @Test
    void scopesRecipientAndStagesTwoCatsBeforeApprovingThemIndividually() throws Exception {
        Owner owner = owner();
        Cat existing = cat(owner, "Existing");
        Cat unrelated = cat(owner(), "Other");
        var invite = issue(owner, List.of(existing.getId()), true);

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
                        Map.of("name", "Existing", "coat", "Soft", "foodBrand", "   "), "photoKeys", List.of()),
                Map.of("fields", Map.of("name", "New", "sex", "FEMALE", "birthDate", "2021-08-21",
                        "lastRabiesDate", "2025-02-03"), "photoKeys", List.of("proof")));
        when(normalizer.normalize(any())).thenThrow(new CatPhotoException(CatPhotoErrorCode.CAT_PHOTO_UNSUPPORTED_FORMAT));
        mvc.perform(submission(invite, entries, new MockMultipartFile("proof", "fake.jpg", "image/jpeg", new byte[] {1})))
                .andExpect(status().isBadRequest());
        doReturn(new NormalizedCatPhoto(JPEG, 10, 10, "a".repeat(64))).when(normalizer).normalize(any());

        mvc.perform(submission(invite, entries, new MockMultipartFile("proof", "record.jpg", "image/jpeg", new byte[] {1})))
                .andExpect(status().isNoContent());
        mvc.perform(submission(invite, entries)).andExpect(status().isNotFound());
        mvc.perform(get(REQUEST).header(HttpHeaders.AUTHORIZATION, invite.authorization()))
                .andExpect(status().isNotFound());
        assertThat(cats.findByOwner_Id(owner.getId(), org.springframework.data.domain.Pageable.unpaged())).hasSize(1);
        assertThat(cats.findById(existing.getId()).orElseThrow().getCoat()).isEqualTo("Short");

        JsonNode rows = reviewList();
        JsonNode existingRow = rowFor(rows, owner.getId(), "Existing");
        JsonNode newRow = rowFor(rows, owner.getId(), "New");
        JsonNode existingReview = detail(existingRow.get("id").asString());
        assertThat(existingReview.get("proposed").get("coat").asString()).isEqualTo("Soft");
        assertThat(existingReview.get("proposed").has("name")).isFalse();
        assertThat(existingReview.get("proposed").has("foodBrand")).isFalse();

        Cat updated = cats.findById(existing.getId()).orElseThrow();
        updated.setCoat("Curly");
        cats.saveAndFlush(updated);
        approve(existingRow, Map.of("coat", "Soft"), List.of(), existingReview.get("catUpdatedAt").asString(), 409);
        JsonNode conflict = detail(existingRow.get("id").asString());
        assertThat(conflict.get("current").get("coat").asString()).isEqualTo("Curly");
        assertThat(conflict.get("conflictFields").get(0).asString()).isEqualTo("coat");
        approve(existingRow, Map.of("coat", "Soft"), List.of(), conflict.get("catUpdatedAt").asString(), 204);

        Cat approvedExisting = cats.findById(existing.getId()).orElseThrow();
        assertThat(approvedExisting.getCoat()).isEqualTo("Soft");
        assertThat(approvedExisting.getFoodBrand()).isEqualTo("Existing brand");
        assertThat(approvedExisting.getNotes()).isEqualTo("Internal");

        JsonNode newReview = detail(newRow.get("id").asString());
        String proof = newReview.get("photos").get(0).get("id").asString();
        mvc.perform(get(REVIEW + "/{id}/photos/{photoId}", newRow.get("id").asString(), proof))
                .andExpect(status().isUnauthorized());
        mvc.perform(get(REVIEW + "/{id}/photos/{photoId}", newRow.get("id").asString(), proof).with(admin()))
                .andExpect(status().isOk()).andExpect(content().bytes(JPEG));
        approve(newRow, Map.of("name", "New", "sex", "FEMALE", "birthDate", "2021-08-21"), List.of(proof), null, 204);

        Cat approvedNew = cats.findByOwner_Id(owner.getId(), org.springframework.data.domain.Pageable.unpaged())
                .stream().filter(cat -> "New".equals(cat.getName())).findFirst().orElseThrow();
        assertThat(approvedNew.getLastRabiesDate()).isNull();
        var savedPhotos = photos.findGallery(approvedNew.getId());
        assertThat(savedPhotos).hasSize(1);
        assertThat(photos.findContent(approvedNew.getId(), savedPhotos.getFirst().id())).contains(JPEG);
    }

    @Test
    void limitsManagementToAdminsAndInvalidatesSupersededRevokedAndExpiredLinks() throws Exception {
        Owner owner = owner();
        var staff = users.saveAndFlush(UserAccount.builder().username("intake-staff-" + UUID.randomUUID().toString().substring(0, 8))
                .passwordHash(passwordEncoder.encode("intake-staff-password")).role(UserRole.STAFF).enabled(true).build());
        String body = json.writeValueAsString(Map.of("ownerId", owner.getId(), "catIds", List.of(), "allowNewCats", true));
        mvc.perform(post(INVITATIONS).with(httpBasic(staff.getUsername(), "intake-staff-password"))
                .contentType(MediaType.APPLICATION_JSON).content(body)).andExpect(status().isForbidden());
        mvc.perform(get(REVIEW).with(httpBasic(staff.getUsername(), "intake-staff-password")))
                .andExpect(status().isForbidden());
        var first = issue(owner, List.of(), true);
        var second = issue(owner, List.of(), true);
        mvc.perform(get(REQUEST).header(HttpHeaders.AUTHORIZATION, first.authorization())).andExpect(status().isNotFound());
        mvc.perform(get(INVITATIONS + "/active").param("ownerId", owner.getId().toString()).with(admin()))
                .andExpect(status().isOk()).andExpect(jsonPath("$.id").value(second.id()))
                .andExpect(jsonPath("$.url").doesNotExist());
        mvc.perform(delete(INVITATIONS + "/{id}", second.id()).with(admin())).andExpect(status().isNoContent());
        mvc.perform(get(REQUEST).header(HttpHeaders.AUTHORIZATION, second.authorization())).andExpect(status().isNotFound());
        var third = issue(owner, List.of(), true);
        when(clock.instant()).thenReturn(NOW.plus(7, ChronoUnit.DAYS));
        mvc.perform(get(REQUEST).header(HttpHeaders.AUTHORIZATION, third.authorization())).andExpect(status().isNotFound());
        mvc.perform(get(INVITATIONS + "/active").param("ownerId", owner.getId().toString()).with(admin()))
                .andExpect(status().isNoContent());
    }

    @Test
    void allowsOnlyTheConfiguredRecipientOrigin() throws Exception {
        Owner owner = owner();
        var invite = issue(owner, List.of(), true);
        String allowed = "http://localhost:4202";
        String unrelated = "https://other.example";
        var entries = List.of(Map.of("fields", Map.of("name", "From the form", "sex", "MALE",
                "birthDate", "2020-01-01"), "photoKeys", List.of()));

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
        var firstLink = issue(original, List.of(movedBeforeSubmission.getId()), false);
        movedBeforeSubmission.setOwner(other);
        cats.saveAndFlush(movedBeforeSubmission);
        var firstEntry = Map.of("catId", movedBeforeSubmission.getId(), "fields", Map.of("coat", "Curly"));
        mvc.perform(get(REQUEST).header(HttpHeaders.AUTHORIZATION, firstLink.authorization()))
                .andExpect(status().isNotFound());
        mvc.perform(submission(firstLink, List.of(firstEntry))).andExpect(status().isNotFound());

        var secondLink = issue(original, List.of(movedBeforeApproval.getId()), false);
        var secondEntry = Map.of("catId", movedBeforeApproval.getId(), "fields", Map.of("coat", "Curly"));
        mvc.perform(submission(secondLink, List.of(secondEntry))).andExpect(status().isNoContent());
        var row = rowFor(reviewList(), original.getId(), "Second");
        var detail = detail(row.get("id").asString());
        movedBeforeApproval.setOwner(other);
        cats.saveAndFlush(movedBeforeApproval);
        approve(row, Map.of("coat", "Curly"), List.of(), detail.get("catUpdatedAt").asString(), 409);
        assertThat(cats.findById(movedBeforeApproval.getId()).orElseThrow().getCoat()).isEqualTo("Short");
    }

    @Test
    void atomicallyConsumesOneLinkUnderSimultaneousSubmissions() throws Exception {
        Owner owner = owner();
        var invite = issue(owner, List.of(), true);
        var entries = List.of(Map.of("fields", Map.of("name", "Single", "sex", "MALE", "birthDate", "2020-01-01"),
                "photoKeys", List.of()));
        CountDownLatch start = new CountDownLatch(1);
        try (var pool = Executors.newFixedThreadPool(2)) {
            var first = pool.submit(() -> { start.await(); return mvc.perform(submission(invite, entries)).andReturn().getResponse().getStatus(); });
            var second = pool.submit(() -> { start.await(); return mvc.perform(submission(invite, entries)).andReturn().getResponse().getStatus(); });
            start.countDown();
            assertThat(List.of(first.get(15, TimeUnit.SECONDS), second.get(15, TimeUnit.SECONDS)))
                    .containsExactlyInAnyOrder(204, 404);
        }
        assertThat(reviewList().valueStream().filter(row -> row.get("ownerId").asString().equals(owner.getId().toString())).count())
                .isEqualTo(1);
    }

    private Owner owner() {
        return owners.saveAndFlush(Owner.builder().fullName("Intake Owner").primaryPhone("555")
                .createdBy(users.findByUsername("test-admin").orElseThrow()).build());
    }

    private Cat cat(Owner owner, String name) {
        return cats.saveAndFlush(Cat.builder().owner(owner).createdBy(owner.getCreatedBy()).name(name)
                .birthDate(LocalDate.of(2020, 1, 1)).sex(Sex.MALE).coat("Short").foodBrand("Existing brand")
                .notes("Internal").build());
    }

    private Invite issue(Owner owner, List<UUID> catIds, boolean allowNew) throws Exception {
        String result = mvc.perform(post(INVITATIONS).with(admin()).contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of("ownerId", owner.getId(), "catIds", catIds, "allowNewCats", allowNew))))
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

    private void approve(JsonNode row, Map<String, String> fields, List<String> photoIds, String updatedAt, int status)
            throws Exception {
        var body = new java.util.HashMap<String, Object>();
        body.put("fields", fields);
        body.put("photoIds", photoIds);
        body.put("expectedCatUpdatedAt", updatedAt);
        mvc.perform(post(REVIEW + "/{id}/approve", row.get("id").asString()).with(admin())
                        .contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(body)))
                .andExpect(status().is(status));
    }

    private org.springframework.test.web.servlet.request.RequestPostProcessor admin() {
        return httpBasic("test-admin", "test-password");
    }

    private record Invite(String id, String authorization) {}
}
