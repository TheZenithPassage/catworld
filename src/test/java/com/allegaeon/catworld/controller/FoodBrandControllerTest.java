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
    void catalogRequiresAdministrationOriginAndAccount() throws Exception {
        mvc.perform(get(CATALOG)).andExpect(status().isUnauthorized());
        mvc.perform(get(CATALOG).header(HttpHeaders.ORIGIN, "http://localhost:4202")
                .with(httpBasic(admin.getUsername(), PASSWORD))).andExpect(status().isForbidden());
        mvc.perform(get(CATALOG).with(httpBasic(staff.getUsername(), PASSWORD)))
                .andExpect(status().isOk()).andExpect(jsonPath("$").isArray());
    }

    @Test
    void staffMayUseApprovedOrLocalBrandWithoutPublishingAProposal() throws Exception {
        String suffix = UUID.randomUUID().toString();
        String approvedName = "Royal Çat " + suffix;
        JsonNode approved = create(admin, Map.of("foodBrand", "  Royal  Çat\t" + suffix + "  ",
                "approveFoodBrand", true, "foodDetail", "Sensitive digestion",
                "litterBrand", "Usa las de CatWorld"));
        assertThat(approved.get("foodBrand").asText()).isEqualTo(approvedName);
        assertThat(approved.get("litterBrand").asText()).isEqualTo("Usa las de CatWorld");
        assertThat(approved.get("foodDetail").asText()).isEqualTo("Sensitive digestion");
        assertThat(approved.get("foodBrandId").asText()).isNotBlank();

        JsonNode known = create(staff, Map.of("foodBrand", "royal\u00a0çat " + suffix));
        assertThat(known.get("foodBrand").asText()).isEqualTo(approvedName);
        assertThat(known.get("foodBrandId")).isEqualTo(approved.get("foodBrandId"));
        JsonNode selected = create(staff, Map.of("foodBrandId", approved.get("foodBrandId").asText()));
        assertThat(selected.get("foodBrand").asText()).isEqualTo(approvedName);
        assertThat(selected.get("foodBrandId")).isEqualTo(approved.get("foodBrandId"));

        String localName = "Royal Cat " + suffix;
        JsonNode local = create(staff, Map.of("foodBrand", localName));
        assertThat(local.get("foodBrand").asText()).isEqualTo(localName);
        assertThat(local.get("foodBrandId").isNull()).isTrue();
        mvc.perform(createRequest(staff, Map.of("foodBrand", localName, "approveFoodBrand", true)))
                .andExpect(status().isForbidden());
        assertThat(catalogNames(staff)).contains(approvedName).doesNotContain(localName);

        JsonNode updated = update(approved, Map.of("foodBrand", approvedName, "color", "Gray"));
        assertThat(updated.get("foodDetail")).isEqualTo(approved.get("foodDetail"));
        assertThat(updated.get("foodBrandId")).isEqualTo(approved.get("foodBrandId"));
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
    void concurrentApprovalReusesTheSameCatalogEntry() throws Exception {
        String suffix = UUID.randomUUID().toString();
        String brandA = "Nutri Cat " + suffix;
        String brandB = "NUTRI CAT " + suffix;
        var start = new CountDownLatch(1);
        try (var pool = Executors.newFixedThreadPool(2)) {
            var first = pool.submit(() -> {
                start.await();
                return create(admin, Map.of("foodBrand", brandA, "approveFoodBrand", true));
            });
            var second = pool.submit(() -> {
                start.await();
                return create(admin, Map.of("foodBrand", brandB, "approveFoodBrand", true));
            });
            start.countDown();
            JsonNode firstCat = first.get(15, TimeUnit.SECONDS);
            JsonNode secondCat = second.get(15, TimeUnit.SECONDS);
            assertThat(firstCat.get("foodBrand")).isEqualTo(secondCat.get("foodBrand"));
            assertThat(firstCat.get("foodBrandId").asText()).isNotBlank();
            assertThat(firstCat.get("foodBrandId")).isEqualTo(secondCat.get("foodBrandId"));
            assertThat(catalogNames(admin).stream().filter(name -> name.endsWith(suffix))).hasSize(1);
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
        var update = new LinkedHashMap<String, Object>(values);
        update.put("expectedUpdatedAt", cat.get("updatedAt").asText());
        return json.readTree(mvc.perform(multipart(HttpMethod.PUT, "/api/cats/{id}", cat.get("id").asText())
                        .file(profile(update)).with(httpBasic(admin.getUsername(), PASSWORD)))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString());
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
