package com.allegaeon.catworld.controller;

import com.allegaeon.catworld.model.Cat;
import com.allegaeon.catworld.model.Owner;
import com.allegaeon.catworld.model.Sex;
import com.allegaeon.catworld.model.Stay;
import com.allegaeon.catworld.model.StayCat;
import com.allegaeon.catworld.model.StayCatId;
import com.allegaeon.catworld.model.UserAccount;
import com.allegaeon.catworld.model.UserRole;
import com.allegaeon.catworld.repository.CatRepository;
import com.allegaeon.catworld.repository.OwnerRepository;
import com.allegaeon.catworld.repository.StayCatRepository;
import com.allegaeon.catworld.repository.StayRepository;
import com.allegaeon.catworld.repository.UserAccountRepository;
import com.jayway.jsonpath.JsonPath;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.RequestPostProcessor;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class CareControllerIntegrationTest {

    private static final String TODAY = "2026-08-05";
    private static final String YESTERDAY = "2026-08-04";
    private static final Instant RECORDED_AT = Instant.parse("2026-08-06T01:30:00Z");
    private static final String ROUTINES = "/api/care/routines";
    private static final String RECORDS = "/api/care/records";

    @DynamicPropertySource
    static void database(DynamicPropertyRegistry registry) {
        String mysql = System.getenv("CATWORLD_CARE_TEST_MYSQL_URL");
        if (mysql == null || mysql.isBlank()) {
            registry.add("spring.datasource.url", () -> "jdbc:h2:mem:care_test;DB_CLOSE_DELAY=-1;MODE=MySQL");
            return;
        }

        registry.add("spring.datasource.url", () -> mysql);
        registry.add("spring.datasource.driver-class-name", () -> "com.mysql.cj.jdbc.Driver");
        registry.add("spring.datasource.username", () -> System.getenv("CATWORLD_CARE_TEST_MYSQL_USERNAME"));
        registry.add("spring.datasource.password", () -> System.getenv("CATWORLD_CARE_TEST_MYSQL_PASSWORD"));
        registry.add("spring.jpa.hibernate.ddl-auto", () -> "validate");
        registry.add("spring.flyway.enabled", () -> true);
    }

    @TestConfiguration(proxyBeanMethods = false)
    static class BusinessClock {
        @Bean
        @Primary
        Clock fixedBusinessClock() {
            return Clock.fixed(RECORDED_AT, ZoneId.of("America/Argentina/Buenos_Aires"));
        }
    }

    @Autowired private MockMvc mvc;
    @Autowired private UserAccountRepository accounts;
    @Autowired private OwnerRepository owners;
    @Autowired private CatRepository cats;
    @Autowired private StayRepository stays;
    @Autowired private StayCatRepository stayCats;
    @Autowired private JdbcTemplate jdbc;

    private UserAccount admin;
    private UserAccount staff;
    private Cat cat;
    private Owner owner;
    private Stay stay;

    @BeforeEach
    void setUp() {
        admin = createAccount(UserRole.ADMIN);
        staff = createAccount(UserRole.STAFF);
        owner = owners.save(Owner.builder().fullName("Example Owner")
                .primaryPhone("000000").createdBy(admin).build());
        cat = createCat("Mora");
        stay = createStay("2026-08-05T23:55:00", "2026-08-06T15:00:00", null);
        addToStay(cat);
    }

    @Test
    void concurrentDailyMarksReturnOneRecordAndAnAnnulledSlotCanBeMarkedAgain() throws Exception {
        String routineId = createRoutine("Water", "DAILY");
        CountDownLatch ready = new CountDownLatch(2);
        CountDownLatch start = new CountDownLatch(1);
        String firstId;
        try (var workers = Executors.newFixedThreadPool(2)) {
            var first = workers.submit(() -> {
                ready.countDown();
                if (!start.await(10, TimeUnit.SECONDS)) throw new AssertionError("Start signal timed out");
                return id(record(staff, TODAY, cat, "\"routineId\":\"" + routineId + "\""));
            });
            var second = workers.submit(() -> {
                ready.countDown();
                if (!start.await(10, TimeUnit.SECONDS)) throw new AssertionError("Start signal timed out");
                return id(record(admin, TODAY, cat, "\"routineId\":\"" + routineId + "\""));
            });
            try {
                if (!ready.await(10, TimeUnit.SECONDS)) throw new AssertionError("Workers did not become ready");
            } finally {
                start.countDown();
            }
            firstId = first.get(20, TimeUnit.SECONDS);
            assertEquals(firstId, second.get(20, TimeUnit.SECONDS));
        }

        history(staff).andExpect(status().isOk()).andExpect(jsonPath("$.records.length()").value(1));
        annul(admin, firstId).andExpect(status().isOk());
        String replacement = id(record(staff, TODAY, cat, "\"routineId\":\"" + routineId + "\""));
        assertNotEquals(firstId, replacement);
        mvc.perform(get("/api/care/day").with(actor(staff))).andExpect(status().isOk())
                .andExpect(jsonPath("$.cats[?(@.stayId == '%s')].records[*].id", stay.getId()).value(replacement));
        history(staff).andExpect(jsonPath("$.records.length()").value(2));
    }

    @Test
    void shiftMarksRequireAndDeduplicateEachSelectedShift() throws Exception {
        String routineId = createRoutine("Room check", "SHIFT");
        String routine = "\"routineId\":\"" + routineId + "\"";
        record(staff, TODAY, cat, routine).andExpect(status().isBadRequest());

        for (String shift : new String[]{"MORNING", "AFTERNOON", "EVENING"}) {
            String payload = routine + ",\"shift\":\"" + shift + "\"";
            String first = id(record(staff, TODAY, cat, payload)
                    .andExpect(jsonPath("$.shift").value(shift)));
            assertEquals(first, id(record(staff, TODAY, cat, payload)));
        }

        history(staff).andExpect(status().isOk()).andExpect(jsonPath("$.records.length()").value(3));
    }

    @Test
    void eventActionsAndNotesUseLocalBusinessDateAndRetainAttribution() throws Exception {
        String routineId = createRoutine("Feeding", "EVENT");
        String routine = "\"routineId\":\"" + routineId + "\"";
        String first = id(record(staff, TODAY, cat, routine));
        assertNotEquals(first, id(record(staff, TODAY, cat, routine)));
        record(staff, TODAY, cat, routine + ",\"shift\":\"MORNING\"").andExpect(status().isBadRequest());
        record(staff, TODAY, cat, routine + ",\"note\":\"extra\"").andExpect(status().isBadRequest());
        record(staff, TODAY, cat, "\"note\":\"  Ate the whole portion  \"").andExpect(status().isOk())
                .andExpect(jsonPath("$.businessDate").value(TODAY))
                .andExpect(jsonPath("$.recordedAt").value(RECORDED_AT.toString()))
                .andExpect(jsonPath("$.note").value("Ate the whole portion"))
                .andExpect(jsonPath("$.authorId").value(staff.getId().toString()))
                .andExpect(jsonPath("$.authorUsername").value(staff.getUsername()));

        mvc.perform(get("/api/care/day").with(actor(staff))).andExpect(status().isOk())
                .andExpect(jsonPath("$.date").value(TODAY))
                .andExpect(jsonPath("$.businessToday").value(TODAY))
                .andExpect(jsonPath("$.cats[?(@.stayId == '%s')].catName", stay.getId()).value("Mora"))
                .andExpect(jsonPath("$.cats[?(@.stayId == '%s')].foodBrand", stay.getId()).value("Example kibble"))
                .andExpect(jsonPath("$.cats[?(@.stayId == '%s')].litterBrand", stay.getId()).value("Example pellets"))
                .andExpect(jsonPath("$.cats[?(@.stayId == '%s')].records[*].id", stay.getId()).value(org.hamcrest.Matchers.hasSize(3)));
    }

    @Test
    void onlyAdminCanConfigureRoutinesAndTheHistoryKeepsTheirOriginalNameAndMode() throws Exception {
        String body = "{\"name\":\"Comb\",\"mode\":\"DAILY\"}";
        mvc.perform(post(ROUTINES).with(actor(staff)).contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isForbidden());
        String routineId = createRoutine("Brush", "DAILY");
        String path = ROUTINES + "/" + routineId;
        String routine = "\"routineId\":\"" + routineId + "\"";
        record(staff, TODAY, cat, routine).andExpect(status().isOk());

        mvc.perform(put(path).with(actor(staff)).contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isForbidden());
        mvc.perform(delete(path).with(actor(staff))).andExpect(status().isForbidden());

        mvc.perform(put(path).with(actor(admin)).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Comb\",\"mode\":\"EVENT\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Comb"))
                .andExpect(jsonPath("$.mode").value("EVENT"));
        record(staff, TODAY, cat, routine + ",\"expectedMode\":\"DAILY\"").andExpect(status().isConflict());
        mvc.perform(delete(path).with(actor(admin))).andExpect(status().isNoContent());

        record(staff, TODAY, cat, routine).andExpect(status().isConflict());
        history(staff).andExpect(status().isOk())
                .andExpect(jsonPath("$.records[0].routineName").value("Brush"))
                .andExpect(jsonPath("$.records[0].mode").value("DAILY"));
        mvc.perform(get(ROUTINES).with(actor(admin))).andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.id == '%s')].active", routineId).value(false));
        mvc.perform(get(ROUTINES).with(actor(staff))).andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.id == '%s')]", routineId).isEmpty());
    }

    @Test
    void annulmentChecksOwnershipAndCareDoesNotBlockOperationalDeletion() throws Exception {
        UserAccount anotherStaff = createAccount(UserRole.STAFF);
        String recordId = id(record(staff, TODAY, cat, "\"note\":\"Observed resting\""));
        annul(anotherStaff, recordId).andExpect(status().isForbidden());
        annul(staff, recordId).andExpect(status().isOk())
                .andExpect(jsonPath("$.annulledById").value(staff.getId().toString()));
        String replacement = id(record(staff, TODAY, cat, "\"note\":\"Observed drinking\""));
        annul(admin, replacement).andExpect(status().isOk())
                .andExpect(jsonPath("$.annulledById").value(admin.getId().toString()));

        addToStay(createCat("Luna"));
        stayCats.deleteById(new StayCatId(stay.getId(), cat.getId()));
        cats.deleteById(cat.getId());
        accounts.deleteById(staff.getId());

        history(admin).andExpect(status().isOk())
                .andExpect(jsonPath("$.records.length()").value(2))
                .andExpect(jsonPath("$.records[0].catName").value("Mora"))
                .andExpect(jsonPath("$.records[0].authorUsername").value(staff.getUsername()));

        mvc.perform(delete("/api/stays/" + stay.getId()).with(actor(admin)))
                .andExpect(status().isNoContent());
        history(admin).andExpect(status().isNotFound());
        annul(admin, replacement).andExpect(status().isNotFound());
    }

    @Test
    void recordRequiresCurrentBusinessDateAndAStayCatOnThatDate() throws Exception {
        Cat outsideStay = createCat("Outside");
        record(staff, TODAY, outsideStay, "\"note\":\"Care\"").andExpect(status().isBadRequest());
        record(staff, YESTERDAY, cat, "\"note\":\"Care\"").andExpect(status().isConflict());
        mvc.perform(get("/api/care/day").param("date", YESTERDAY).with(actor(staff))).andExpect(status().isOk())
                .andExpect(jsonPath("$.cats[?(@.stayId == '%s')]", stay.getId()).isEmpty());

        String recordId = id(record(staff, TODAY, cat, "\"note\":\"Care\""));
        Stay cancelled = stays.findById(stay.getId()).orElseThrow();
        cancelled.setCancelledAt(LocalDateTime.parse("2026-08-05T21:30:00"));
        stays.saveAndFlush(cancelled);
        record(staff, TODAY, cat, "\"note\":\"Care\"").andExpect(status().isConflict());
        mvc.perform(get("/api/care/day").with(actor(staff))).andExpect(status().isOk())
                .andExpect(jsonPath("$.cats[?(@.stayId == '%s')]", stay.getId()).isEmpty());
        history(staff).andExpect(status().isOk()).andExpect(jsonPath("$.records[0].id").value(recordId));

        stay = createStay("2026-08-03T16:00:00", "2026-08-04T23:59:00", null);
        addToStay(cat);
        record(staff, TODAY, cat, "\"note\":\"Care\"").andExpect(status().isConflict());
        mvc.perform(get("/api/care/day").param("date", YESTERDAY).with(actor(staff))).andExpect(status().isOk())
                .andExpect(jsonPath("$.cats[?(@.stayId == '%s')].catName", stay.getId()).value("Mora"));
    }

    @Test
    void aStayEndingAtMidnightDoesNotCoverTheNewBusinessDay() throws Exception {
        stay = createStay("2026-08-04T20:00:00", "2026-08-05T00:00:00", null);
        addToStay(cat);
        mvc.perform(get("/api/care/day").with(actor(staff))).andExpect(status().isOk())
                .andExpect(jsonPath("$.cats[?(@.stayId == '%s')]", stay.getId()).isEmpty());
        record(staff, TODAY, cat, "\"note\":\"Care\"").andExpect(status().isConflict());
    }

    @Test
    @EnabledIfEnvironmentVariable(named = "CATWORLD_CARE_TEST_MYSQL_URL", matches = ".+")
    void flywaySeedsLocalizedRoutinesAndProtectsActiveSlotsInMySql() throws Exception {
        mvc.perform(get(ROUTINES).with(actor(staff))).andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.seedKey == 'FOOD')].mode").value("EVENT"))
                .andExpect(jsonPath("$[?(@.seedKey == 'WATER')].mode").value("DAILY"))
                .andExpect(jsonPath("$[?(@.seedKey == 'LITTER')].mode").value("DAILY"));

        String routine = "\"routineId\":\"cafe0000-0000-4000-8000-000000000002\"";
        String recordId = id(record(staff, TODAY, cat, routine)
                .andExpect(jsonPath("$.routineSeedKey").value("WATER")));
        assertEquals("2026-08-06 01:30:00.000000", jdbc.queryForObject(
                "select cast(recorded_at as char) from care_records where id = uuid_to_bin(?)",
                String.class, recordId));
        history(staff).andExpect(status().isOk()).andExpect(jsonPath("$.records[0].recordedAt").value(RECORDED_AT.toString()));
        assertThrows(DataIntegrityViolationException.class, () -> jdbc.update("""
                insert into care_records (
                    id, stay_id, cat_id, cat_name, business_date, recorded_at, routine_id, routine_name,
                    routine_seed_key, mode, active_slot, author_id, author_username
                )
                select uuid_to_bin(uuid()), stay_id, cat_id, cat_name, business_date, recorded_at, routine_id, routine_name,
                       routine_seed_key, mode, active_slot, author_id, author_username
                from care_records where id = uuid_to_bin(?)
                """, recordId));
    }

    @Test
    void careRequiresAnApplicationRole() throws Exception {
        mvc.perform(get("/api/care/day")).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/care/day").with(user("other").roles("OTHER"))).andExpect(status().isForbidden());
        mvc.perform(get("/api/care/stays/" + stay.getId() + "/records")).andExpect(status().isUnauthorized());
    }

    private String createRoutine(String name, String mode) throws Exception {
        return mvc.perform(post(ROUTINES).with(actor(admin)).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"" + name + "\",\"mode\":\"" + mode + "\"}"))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString()
                .transform(body -> JsonPath.read(body, "$.id"));
    }

    private String id(ResultActions result) throws Exception {
        return JsonPath.read(result.andExpect(status().isOk()).andReturn().getResponse().getContentAsString(), "$.id");
    }

    private ResultActions history(UserAccount actor) throws Exception {
        return mvc.perform(get("/api/care/stays/" + stay.getId() + "/records").with(actor(actor)));
    }

    private ResultActions record(UserAccount actor, String date, Cat cat, String details) throws Exception {
        return mvc.perform(post(RECORDS).with(actor(actor)).contentType(MediaType.APPLICATION_JSON)
                .content("""
                        {"stayId":"%s","catId":"%s","businessDate":"%s",%s}
                        """.formatted(stay.getId(), cat.getId(), date, details)));
    }

    private ResultActions annul(UserAccount actor, String recordId) throws Exception {
        return mvc.perform(post(RECORDS + "/" + recordId + "/annul").with(actor(actor)));
    }

    private RequestPostProcessor actor(UserAccount account) {
        return user(account.getUsername()).roles(account.getRole().name());
    }

    private UserAccount createAccount(UserRole role) {
        return accounts.save(UserAccount.builder().username("care-" + UUID.randomUUID())
                .passwordHash("{noop}unused-test-password").role(role).build());
    }

    private Cat createCat(String name) {
        return cats.save(Cat.builder().name(name).owner(owner).createdBy(admin).sex(Sex.FEMALE)
                .birthDate(LocalDate.parse("2021-01-01")).foodBrand("Example kibble")
                .litterBrand("Example pellets").build());
    }

    private Stay createStay(String start, String end, LocalDateTime cancelledAt) {
        return stays.save(Stay.builder().startAt(LocalDateTime.parse(start)).endAt(LocalDateTime.parse(end))
                .cancelledAt(cancelledAt).owner(owner).createdBy(admin).build());
    }

    private void addToStay(Cat cat) {
        stayCats.save(StayCat.builder().stay(stay).cat(cat).build());
    }
}
