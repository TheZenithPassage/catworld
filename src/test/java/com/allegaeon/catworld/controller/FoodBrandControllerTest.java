package com.allegaeon.catworld.controller;

import com.allegaeon.catworld.model.Cat;
import com.allegaeon.catworld.model.Owner;
import com.allegaeon.catworld.model.Sex;
import com.allegaeon.catworld.model.UserAccount;
import com.allegaeon.catworld.model.UserRole;
import com.allegaeon.catworld.repository.CatRepository;
import com.allegaeon.catworld.repository.OwnerRepository;
import com.allegaeon.catworld.repository.UserAccountRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.springframework.test.web.servlet.request.MockMultipartHttpServletRequestBuilder;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.httpBasic;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:catworld_food_brands;MODE=MySQL",
        "CATWORLD_INTAKE_URL=http://localhost:4202/"
})
@AutoConfigureMockMvc
@ActiveProfiles("test")
class FoodBrandControllerTest {
    private static final String CATALOG = "/api/food-brands";
    private static final String PROFILE_OPTIONS = "/api/cat-profile-options";
    private static final String PASSWORD = "catalog-test-password";

    @Autowired MockMvc mvc;
    @Autowired ObjectMapper json;
    @Autowired CatRepository cats;
    @Autowired OwnerRepository owners;
    @Autowired UserAccountRepository users;
    @Autowired PasswordEncoder encoder;

    private UserAccount admin;
    private UserAccount staff;
    private Owner owner;

    @DynamicPropertySource
    static void nativeDatabase(DynamicPropertyRegistry registry) {
        String url = System.getenv("CATWORLD_CATALOG_MYSQL_URL");
        if (url == null || url.isBlank()) return;
        registry.add("spring.datasource.url", () -> url);
        registry.add("spring.datasource.driver-class-name", () -> "com.mysql.cj.jdbc.Driver");
        registry.add("spring.datasource.username", () -> System.getenv("CATWORLD_CATALOG_MYSQL_USERNAME"));
        registry.add("spring.datasource.password", () -> System.getenv("CATWORLD_CATALOG_MYSQL_PASSWORD"));
        registry.add("spring.flyway.enabled", () -> true);
        registry.add("spring.jpa.hibernate.ddl-auto", () -> "validate");
    }

    @BeforeEach
    void setUp() {
        admin = user(UserRole.ADMIN);
        staff = user(UserRole.STAFF);
        owner = owners.saveAndFlush(Owner.builder().fullName("Catalog Owner").primaryPhone("555-0100")
                .createdBy(admin).build());
    }

    @Test
    void administersBrandScopedVarietiesWithoutReactivatingHiddenNames() throws Exception {
        String suffix = UUID.randomUUID().toString();
        var first = publish(admin, Map.of("field", "foodBrand", "name", "First " + suffix)).get("id").asText();
        var second = publish(admin, Map.of("field", "foodBrand", "name", "Second " + suffix)).get("id").asText();
        String name = "Kitten " + suffix;
        var input = Map.of("field", "foodDetail", "name", name, "brandId", first);
        var firstVariety = publish(admin, input).get("id").asText();
        var secondVariety = publish(admin, Map.of("field", "foodDetail", "name", name, "brandId", second))
                .get("id").asText();
        assertThat(firstVariety).isNotEqualTo(secondVariety);
        var linked = create(staff, Map.of("foodBrandId", first, "foodVarietyId", firstVariety));

        var anotherVariety = publish(admin, Map.of("field", "foodDetail", "name", "Adult " + suffix, "brandId", first))
                .get("id").asText();
        mvc.perform(catalogChange(admin, "foodDetail", anotherVariety, Map.of("name", "  kitten  " + suffix)))
                .andExpect(status().isConflict());
        mvc.perform(catalogChange(admin, "foodBrand", first, Map.of("active", false))).andExpect(status().isOk());
        mvc.perform(get(CATALOG + "/varieties").with(httpBasic(staff.getUsername(), PASSWORD)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.id == '" + firstVariety + "')]").isEmpty())
                .andExpect(jsonPath("$[?(@.id == '" + secondVariety + "')]").isNotEmpty());
        mvc.perform(publication(admin, Map.of("field", "foodBrand", "name", " first  " + suffix)))
                .andExpect(status().isConflict());
        mvc.perform(createRequest(staff, Map.of("foodBrandId", first))).andExpect(status().isBadRequest());
        var edited = update(linked, Map.of("foodBrandId", first, "foodVarietyId", firstVariety, "color", "Gray"));
        assertThat(edited.get("foodBrandId").asText()).isEqualTo(first);
        assertThat(edited.get("catalogOptionIds").get("foodDetail").asText()).isEqualTo(firstVariety);
        assertThat(edited.get("foodDetail").asText()).isEqualTo(name);
        mvc.perform(get(PROFILE_OPTIONS + "/manage").with(httpBasic(staff.getUsername(), PASSWORD)))
                .andExpect(status().isForbidden());
        mvc.perform(catalogChange(staff, "foodBrand", first, Map.of("active", true))).andExpect(status().isForbidden());
        mvc.perform(get(PROFILE_OPTIONS + "/manage").header(HttpHeaders.ORIGIN, "http://localhost:4202")
                .with(httpBasic(admin.getUsername(), PASSWORD))).andExpect(status().isForbidden());
        mvc.perform(get(PROFILE_OPTIONS + "/manage").with(httpBasic(admin.getUsername(), PASSWORD)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.id == '" + first + "' && @.active == false)]").isNotEmpty());
        mvc.perform(catalogChange(admin, "foodDetail", firstVariety, Map.of("active", false)))
                .andExpect(status().isOk());
        mvc.perform(catalogChange(admin, "foodBrand", first, Map.of("active", true))).andExpect(status().isOk());
        mvc.perform(get(CATALOG + "/varieties").with(httpBasic(staff.getUsername(), PASSWORD)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.id == '" + firstVariety + "')]").isEmpty())
                .andExpect(jsonPath("$[?(@.id == '" + anotherVariety + "')]").isNotEmpty());
        mvc.perform(publication(admin, input)).andExpect(status().isConflict());
        mvc.perform(catalogChange(admin, "foodDetail", firstVariety, Map.of("active", true)))
                .andExpect(status().isOk()).andExpect(jsonPath("$.id").value(firstVariety));
    }

    private MockHttpServletRequestBuilder catalogChange(UserAccount actor, String field, String id, Map<String, ?> change) {
        return patch(
                        PROFILE_OPTIONS + "/manage/{field}/{id}", field, id)
                .with(httpBasic(actor.getUsername(), PASSWORD)).contentType(MediaType.APPLICATION_JSON)
                .content(json.writeValueAsBytes(change));
    }

    @Test
    void catalogRequiresAdministrationOriginAndAccount() throws Exception {
        mvc.perform(get(CATALOG)).andExpect(status().isUnauthorized());
        mvc.perform(get(CATALOG).header(HttpHeaders.ORIGIN, "http://localhost:4202")
                .with(httpBasic(admin.getUsername(), PASSWORD))).andExpect(status().isForbidden());
        mvc.perform(get(CATALOG).with(httpBasic(staff.getUsername(), PASSWORD)))
                .andExpect(status().isOk()).andExpect(jsonPath("$").isArray());
    }

    @Test
    void staffCanReadScopedVarietiesAndOnlyAdministratorsCanPublishThem() throws Exception {
        var brand = publish(admin, Map.of("field", "foodBrand", "name", "Variety brand " + UUID.randomUUID()));
        var other = publish(admin, Map.of("field", "foodBrand", "name", "Other brand " + UUID.randomUUID()));
        var varietyInput = Map.of("field", "foodDetail", "name", "Kitten", "brandId", brand.get("id").asText());
        mvc.perform(publication(staff, varietyInput)).andExpect(status().isForbidden());
        var variety = publish(admin, varietyInput);
        assertThat(publish(admin, varietyInput)).isEqualTo(variety);

        var staffVarieties = json.readTree(mvc.perform(get(CATALOG + "/varieties")
                        .with(httpBasic(staff.getUsername(), PASSWORD))).andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString());
        assertThat(staffVarieties.valueStream().filter(option -> option.get("id").equals(variety.get("id")))
                .map(option -> option.get("brandId")).toList()).containsExactly(brand.get("id"));
        var chosen = create(staff, Map.of("foodBrandId", brand.get("id").asText(),
                "foodVarietyId", variety.get("id").asText()));
        assertThat(chosen.get("foodDetail").asText()).isEqualTo("Kitten");
        assertThat(chosen.get("catalogOptionIds").get("foodDetail")).isEqualTo(variety.get("id"));
        mvc.perform(createRequest(staff, Map.of("foodBrandId", other.get("id").asText(),
                "foodVarietyId", variety.get("id").asText()))).andExpect(status().isBadRequest());
    }

    private JsonNode publish(UserAccount user, Map<String, ?> body) throws Exception {
        return json.readTree(mvc.perform(publication(user, body)).andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString());
    }

    private MockHttpServletRequestBuilder publication(
            UserAccount user, Map<String, ?> body) {
        return post(PROFILE_OPTIONS).with(httpBasic(user.getUsername(), PASSWORD))
                .contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(body));
    }

    @Test
    void profileCatalogSeparatesCategoriesAndRequiresAdministratorToPublishOptions() throws Exception {
        String suffix = UUID.randomUUID().toString();
        String name = "Crema Ártica " + suffix;
        mvc.perform(get(PROFILE_OPTIONS)).andExpect(status().isUnauthorized());
        mvc.perform(get(PROFILE_OPTIONS).header(HttpHeaders.ORIGIN, "http://localhost:4202")
                .with(httpBasic(admin.getUsername(), PASSWORD))).andExpect(status().isForbidden());
        mvc.perform(get(PROFILE_OPTIONS).with(httpBasic(staff.getUsername(), PASSWORD)))
                .andExpect(status().isOk());

        mvc.perform(publication(admin, Map.of("field", "coat", "name", name)))
                .andExpect(status().isBadRequest());
        mvc.perform(publication(admin, Map.of("field", "color", "name", name)))
                .andExpect(status().isBadRequest());
        mvc.perform(publication(staff, Map.of("field", "breed", "name", name)))
                .andExpect(status().isForbidden());

        var breed = publish(admin, Map.of("field", "breed", "name", "  Crema  Ártica\t" + suffix + "  "));
        var local = create(staff, Map.of("breed", name, "coat", "Corto", "color", name));
        assertThat(local.get("breed").asText()).isEqualTo(name);
        assertThat(local.get("catalogOptionIds").get("breed")).isEqualTo(breed.get("id"));
        var matched = create(staff, Map.of("catalogOptionIds", Map.of("breed", breed.get("id").asText())));
        assertThat(matched.get("breed").asText()).isEqualTo(name);
        assertThat(matched.get("catalogOptionIds").get("breed")).isEqualTo(breed.get("id"));
        mvc.perform(createRequest(staff, Map.of("catalogOptionIds",
                        Map.of("lastInternalDewormerName", breed.get("id").asText()))))
                .andExpect(status().isBadRequest());
        assertThat(local.get("catalogOptionIds").has("coat")).isFalse();
        assertThat(local.get("catalogOptionIds").has("color")).isFalse();

        var catalog = json.readTree(mvc.perform(get(PROFILE_OPTIONS).with(httpBasic(staff.getUsername(), PASSWORD)))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsByteArray());
        assertThat(catalog.get("breed").valueStream()
                .filter(option -> option.get("name").asText().equals(name))
                .map(option -> option.get("id")).toList()).containsExactly(breed.get("id"));
        assertThat(catalog.get("lastInternalDewormerName").isArray()).isTrue();
        assertThat(catalog.get("lastExternalDewormerName").isArray()).isTrue();
        assertThat(catalog.get("foodBrand").isArray()).isTrue();
    }

    @Test
    void unchangedHistoricalValuesRemainLocalAndChangingAnApprovedValueClearsItsId() throws Exception {
        String legacy = "  Historical treatment " + UUID.randomUUID() + "  ";
        publish(admin, Map.of("field", "lastExternalDewormerName", "name", "Existing catalog treatment"));
        Cat cat = cats.saveAndFlush(Cat.builder().name("Historical cat").birthDate(LocalDate.of(2020, 3, 2))
                .sex(Sex.MALE).lastExternalDewormerName(legacy).coat("Curly").owner(owner).createdBy(admin).build());
        publish(admin, Map.of("field", "lastExternalDewormerName", "name", legacy));
        var existing = json.readTree(mvc.perform(get("/api/cats/{id}", cat.getId())
                        .with(httpBasic(admin.getUsername(), PASSWORD)))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString());
        var updated = update(existing, Map.of("lastExternalDewormerName", legacy, "coat", "Curly"));
        assertThat(updated.get("lastExternalDewormerName").asText()).isEqualTo(legacy);
        assertThat(updated.get("catalogOptionIds").has("lastExternalDewormerName")).isFalse();
        assertThat(updated.get("coat").asText()).isEqualTo("Curly");
        assertThat(updated.get("catalogOptionIds").has("coat")).isFalse();

        var changed = update(updated, Map.of("lastExternalDewormerName", legacy, "coat", "Largo"));
        assertThat(changed.get("coat").asText()).isEqualTo("Largo");
        assertThat(changed.get("catalogOptionIds").has("coat")).isFalse();
        mvc.perform(get(PROFILE_OPTIONS).with(httpBasic(staff.getUsername(), PASSWORD)))
                .andExpect(status().isOk()).andExpect(jsonPath("$.lastExternalDewormerName.length()").value(2));
    }

    @Test
    void confirmsOnlyNewLocalValuesAndResolvesKnownCatalogText() throws Exception {
        String suffix = UUID.randomUUID().toString();
        String brand = "Royal Çat " + suffix;
        String brandId = publish(admin, Map.of("field", "foodBrand", "name", brand)).get("id").asText();
        String varietyId = publish(admin, Map.of("field", "foodDetail", "name", "Sensitive Digestion",
                "brandId", brandId)).get("id").asText();
        String otherBrand = publish(admin, Map.of("field", "foodBrand", "name", "Other " + suffix)).get("id").asText();
        publish(admin, Map.of("field", "foodDetail", "name", "Different Brand Only", "brandId", otherBrand));

        var text = Map.of("breed", "Local breed " + suffix, "foodDetail", "Different Brand Only");
        var values = new LinkedHashMap<String, Object>(text);
        values.put("foodBrand", "royal\u00a0çat  " + suffix.toUpperCase(java.util.Locale.ROOT));
        values.put("approveCatalogOptions", List.of("breed"));
        mvc.perform(createRequest(admin, values)).andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("CAT_CATALOG_TEXT_CONFIRMATION_REQUIRED"))
                .andExpect(jsonPath("$.fields.breed").value(text.get("breed")))
                .andExpect(jsonPath("$.fields.foodDetail").value(text.get("foodDetail")))
                .andExpect(jsonPath("$.fields.foodBrand").doesNotExist());
        values.put("confirmedCatalogText", Map.of("breed", "A different breed", "foodDetail", text.get("foodDetail")));
        mvc.perform(createRequest(admin, values)).andExpect(status().isConflict());
        values.put("confirmedCatalogText", text);
        JsonNode approved = create(admin, values);
        assertThat(approved.get("foodBrandId").asText()).isEqualTo(brandId);
        assertThat(approved.get("catalogOptionIds").has("foodDetail")).isFalse();
        assertThat(approved.get("catalogOptionIds").has("breed")).isFalse();
        assertThat(approved.get("foodDetail").asText()).isEqualTo(text.get("foodDetail"));

        JsonNode known = create(staff, Map.of("foodBrandId", brandId, "foodDetail", " SENSITIVE   digestion "));
        assertThat(known.get("catalogOptionIds").get("foodDetail").asText()).isEqualTo(varietyId);
        assertThat(known.get("foodDetail").asText()).isEqualTo("Sensitive Digestion");

        var updated = update(approved, Map.of("foodBrand", brand, "foodDetail", text.get("foodDetail"),
                "breed", text.get("breed"), "color", "Gray"));
        assertThat(updated.get("foodBrandId")).isEqualTo(approved.get("foodBrandId"));
        assertThat(updated.get("foodDetail")).isEqualTo(approved.get("foodDetail"));
        assertThat(updated.get("breed")).isEqualTo(approved.get("breed"));
        assertThat(updated.get("catalogOptionIds").has("breed")).isFalse();
    }

    @Test
    void retypingAnOldLabelUsesTheCurrentCatalogOptionAfterRename() throws Exception {
        var original = publish(admin, Map.of("field", "breed", "name", "Original name"));
        String originalId = original.get("id").asText();
        var cat = create(staff, Map.of("catalogOptionIds", Map.of("breed", originalId)));
        mvc.perform(catalogChange(admin, "breed", originalId, Map.of("name", "Current name")))
                .andExpect(status().isOk());
        var replacement = publish(admin, Map.of("field", "breed", "name", "Original name"));

        var unchanged = update(cat, Map.of("breed", "Current name", "color", "Gray"));
        assertThat(unchanged.get("catalogOptionIds").get("breed")).isEqualTo(original.get("id"));
        assertThat(unchanged.get("breed").asText()).isEqualTo("Current name");

        var edited = update(unchanged, Map.of("breed", " ORIGINAL  name "));
        assertThat(edited.get("catalogOptionIds").get("breed")).isEqualTo(replacement.get("id"));
        assertThat(edited.get("breed").asText()).isEqualTo("Original name");
    }

    @Test
    void editConfirmsOnlyChangedLocalValues() throws Exception {
        var cat = create(staff, Map.of());
        var values = Map.of("litterPreference", "OWN", "litterDetail", "Own mixed litter", "color", "Gray");
        mvc.perform(updateRequest(cat, values)).andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("CAT_CATALOG_TEXT_CONFIRMATION_REQUIRED"))
                .andExpect(jsonPath("$.fields.litterDetail").value("Own mixed litter"))
                .andExpect(jsonPath("$.fields.color").doesNotExist());
        assertThat(cats.findById(UUID.fromString(cat.get("id").asText())).orElseThrow().getColor()).isNull();

        var confirmed = new LinkedHashMap<String, Object>(values);
        confirmed.put("confirmedCatalogText", Map.of("litterDetail", "Own mixed litter"));
        var updated = update(cat, confirmed);
        assertThat(updated.get("litterDetail").asText()).isEqualTo("Own mixed litter");
        assertThat(updated.get("catalogOptionIds").has("litterDetail")).isFalse();
    }

    @Test
    void unrelatedUpdatePreservesHistoricalFoodAndLitter() throws Exception {
        String legacy = "  Historic mixture from the vet " + UUID.randomUUID() + "  ";
        Cat cat = cats.saveAndFlush(Cat.builder().name("Historical cat").birthDate(LocalDate.of(2020, 3, 2))
                .sex(Sex.MALE).foodBrand(legacy).litterBrand("Our old litter mixture").owner(owner)
                .createdBy(admin).build());
        JsonNode existing = json.readTree(mvc.perform(get("/api/cats/{id}", cat.getId())
                        .with(httpBasic(admin.getUsername(), PASSWORD)))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString());

        JsonNode updated = update(existing, Map.of("color", "White"));
        assertThat(updated.get("foodBrand").asText()).isEqualTo(legacy);
        assertThat(updated.get("litterBrand").asText()).isEqualTo("Our old litter mixture");
        assertThat(updated.get("foodBrandId").isNull()).isTrue();
        assertThat(catalogNames(admin)).doesNotContain(legacy.strip());
    }

    @Test
    void concurrentExplicitPublicationReusesTheSameOption() throws Exception {
        String option = "Nutri Cat " + UUID.randomUUID();
        var start = new CountDownLatch(1);
        try (var pool = Executors.newFixedThreadPool(2)) {
            var first = pool.submit(() -> {
                start.await();
                return publish(admin, Map.of("field", "foodBrand", "name", option));
            });
            var second = pool.submit(() -> {
                start.await();
                return publish(admin, Map.of("field", "foodBrand", "name", option.toUpperCase(java.util.Locale.ROOT)));
            });
            start.countDown();
            assertThat(first.get(15, TimeUnit.SECONDS)).isEqualTo(second.get(15, TimeUnit.SECONDS));
            assertThat(catalogNames(admin)).containsOnlyOnce(first.get().get("name").asText());
        }
    }

    private UserAccount user(UserRole role) {
        return users.saveAndFlush(UserAccount.builder().username("catalog-" + UUID.randomUUID())
                .passwordHash(encoder.encode(PASSWORD)).role(role).enabled(true).build());
    }

    private JsonNode create(UserAccount user, Map<String, ?> values) throws Exception {
        return json.readTree(mvc.perform(createRequest(user, values)).andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString());
    }

    private MockMultipartHttpServletRequestBuilder createRequest(UserAccount user, Map<String, ?> values) {
        return multipart("/api/cats").file(profile(values)).with(httpBasic(user.getUsername(), PASSWORD));
    }

    private JsonNode update(JsonNode cat, Map<String, ?> values) throws Exception {
        return json.readTree(mvc.perform(updateRequest(cat, values))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString());
    }

    private MockMultipartHttpServletRequestBuilder updateRequest(JsonNode cat, Map<String, ?> values) {
        var update = new LinkedHashMap<String, Object>(values);
        update.put("expectedUpdatedAt", cat.get("updatedAt").asText());
        var request = multipart(HttpMethod.PUT, "/api/cats/{id}", cat.get("id").asText()).file(profile(update));
        request.with(httpBasic(admin.getUsername(), PASSWORD));
        return request;
    }

    private MockMultipartFile profile(Map<String, ?> values) {
        var fields = new LinkedHashMap<String, Object>();
        fields.put("name", "Catalog cat");
        fields.put("birthDate", "2020-03-02");
        fields.put("sex", "MALE");
        fields.put("ownerId", owner.getId());
        fields.putAll(values);
        return new MockMultipartFile("cat", "cat.json", MediaType.APPLICATION_JSON_VALUE, json.writeValueAsBytes(fields));
    }

    private List<String> catalogNames(UserAccount user) throws Exception {
        JsonNode response = json.readTree(mvc.perform(get(CATALOG).with(httpBasic(user.getUsername(), PASSWORD)))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString());
        return response.valueStream().map(entry -> entry.get("name").asText()).toList();
    }
}
