package com.allegaeon.catworld.controller;

import com.allegaeon.catworld.model.Cat;
import com.allegaeon.catworld.model.Owner;
import com.allegaeon.catworld.model.Sex;
import com.allegaeon.catworld.model.Stay;
import com.allegaeon.catworld.model.StayCat;
import com.allegaeon.catworld.model.StayStatus;
import com.allegaeon.catworld.model.UserAccount;
import com.allegaeon.catworld.model.UserRole;
import com.allegaeon.catworld.repository.CatRepository;
import com.allegaeon.catworld.repository.OwnerRepository;
import com.allegaeon.catworld.repository.StayCatRepository;
import com.allegaeon.catworld.repository.StayRepository;
import com.allegaeon.catworld.repository.UserAccountRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.RequestPostProcessor;
import tools.jackson.databind.json.JsonMapper;

import java.math.BigDecimal;
import java.nio.ByteBuffer;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;

import static org.hamcrest.Matchers.contains;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.httpBasic;
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
class OperationsTaskControllerTest {

    private static final String TASKS = "/api/operations/tasks";
    private static final String LINKS = TASKS + "/link-options";
    private static final String ADMIN = "test-admin";
    private static final String STAFF = "tasks-staff";
    private static final String STAFF_PASSWORD = "tasks-password";
    private static final Instant BEFORE_MIDNIGHT = Instant.parse("2026-11-13T02:59:59Z");
    private static final Instant MIDNIGHT = Instant.parse("2026-11-13T03:00:00Z");

    @Autowired
    private MockMvc mvc;
    @Autowired
    private JdbcTemplate jdbc;
    @Autowired
    private JsonMapper json;
    @Autowired
    private UserAccountRepository users;
    @Autowired
    private OwnerRepository owners;
    @Autowired
    private CatRepository cats;
    @Autowired
    private StayRepository stays;
    @Autowired
    private StayCatRepository stayCats;
    @Autowired
    private PasswordEncoder passwords;
    @MockitoBean
    private Clock clock;

    @DynamicPropertySource
    static void isolatedDataSource(DynamicPropertyRegistry properties) {
        String mysqlUrl = System.getenv("CATWORLD_NATIVE_MYSQL_URL");
        if (mysqlUrl != null && !mysqlUrl.isBlank()) {
            properties.add("spring.datasource.url", () -> mysqlUrl);
            properties.add("spring.datasource.driver-class-name", () -> "com.mysql.cj.jdbc.Driver");
            properties.add("spring.datasource.username", () -> System.getenv("CATWORLD_NATIVE_MYSQL_USERNAME"));
            properties.add("spring.datasource.password", () -> System.getenv("CATWORLD_NATIVE_MYSQL_PASSWORD"));
            properties.add("spring.jpa.hibernate.ddl-auto", () -> "validate");
            properties.add("spring.flyway.enabled", () -> true);
        } else {
            properties.add("spring.datasource.url", () -> "jdbc:h2:mem:operations_tasks;DB_CLOSE_DELAY=-1;MODE=MySQL");
        }
    }

    @BeforeEach
    void setup() {
        when(clock.getZone()).thenReturn(ZoneId.of("America/Argentina/Buenos_Aires"));
        when(clock.instant()).thenReturn(BEFORE_MIDNIGHT);
        if (users.findByUsername(STAFF).isEmpty()) {
            users.save(UserAccount.builder()
                    .username(STAFF)
                    .passwordHash(passwords.encode(STAFF_PASSWORD))
                    .role(UserRole.STAFF)
                    .build());
        }
    }

    @Test
    void classifiesUsingTheBusinessDayAcrossMidnight() throws Exception {
        String overdue = create("  Inspect the carrier  ", "2026-11-11", null);
        String today = create("Prepare bedding", "2026-11-12", null);
        String upcoming = create("Check water bowls", "2026-11-13", null);
        String undated = create("Order tags", null, null);

        assertBucket(overdue, "OVERDUE");
        assertBucket(today, "TODAY");
        assertBucket(upcoming, "UPCOMING");
        assertBucket(undated, "UNDATED");

        when(clock.instant()).thenReturn(MIDNIGHT);

        assertBucket(today, "OVERDUE");
        assertBucket(upcoming, "TODAY");
        assertBucket(undated, "UNDATED");
    }

    @Test
    void requiresBriefTextAndAnExistingStayWhenLinked() throws Exception {
        for (String description : new String[]{"  \t ", "x".repeat(501)}) {
            mvc.perform(post(TASKS).with(staff())
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(json.createObjectNode().put("description", description).toString()))
                    .andExpect(status().isBadRequest());
        }
        mvc.perform(post(TASKS).with(staff())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.createObjectNode().put("description", "Check supplies")
                                .put("stayId", UUID.randomUUID().toString()).toString()))
                .andExpect(status().isNotFound());
    }

    @Test
    void resolveAndReopenPersistAttributionAndDoNotReplayStaleActions() throws Exception {
        String id = create("Restock towels", "2026-11-12", null);
        changeResolution(id, true, 0, admin())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.bucket").value("RESOLVED"))
                .andExpect(jsonPath("$.revision").value(1))
                .andExpect(jsonPath("$.lastTransition.username").value(ADMIN))
                .andExpect(jsonPath("$.lastTransition.at").value(BEFORE_MIDNIGHT.toString()));

        when(clock.instant()).thenReturn(MIDNIGHT);
        changeResolution(id, true, 0, staff())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.revision").value(1))
                .andExpect(jsonPath("$.lastTransition.username").value(ADMIN))
                .andExpect(jsonPath("$.lastTransition.at").value(BEFORE_MIDNIGHT.toString()));
        changeResolution(id, false, 1, staff())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.bucket").value("OVERDUE"))
                .andExpect(jsonPath("$.revision").value(2))
                .andExpect(jsonPath("$.lastTransition.username").value(STAFF))
                .andExpect(jsonPath("$.lastTransition.at").value(MIDNIGHT.toString()));
        changeResolution(id, false, 1, staff())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.revision").value(2));
        changeResolution(id, true, 0, admin()).andExpect(status().isConflict());

        assertEquals(List.of(ADMIN, STAFF), jdbc.queryForList("""
                select actor_username from operations_task_transitions where task_id = ? order by revision
                """, String.class, taskKey(id)));
        assertBucket(id, "OVERDUE");
    }

    @Test
    void concurrentResolveRequestsProduceOneTransition() throws Exception {
        String id = create("Refill the litter storage", null, null);
        CountDownLatch start = new CountDownLatch(1);

        try (var executor = Executors.newFixedThreadPool(2)) {
            var first = executor.submit(() -> {
                start.await();
                return changeResolution(id, true, 0, admin())
                        .andReturn().getResponse().getStatus();
            });
            var second = executor.submit(() -> {
                start.await();
                return changeResolution(id, true, 0, staff())
                        .andReturn().getResponse().getStatus();
            });
            start.countDown();

            assertEquals(200, first.get(10, TimeUnit.SECONDS));
            assertEquals(200, second.get(10, TimeUnit.SECONDS));
        }

        assertEquals(1, transitionCount(id));
        assertBucket(id, "RESOLVED");
    }

    @Test
    void onlyAdminAndStaffCanReadAndChangeTasks() throws Exception {
        var outsider = user("outsider").roles("VIEWER");
        mvc.perform(get(TASKS)).andExpect(status().isUnauthorized());
        mvc.perform(post(TASKS)).andExpect(status().isUnauthorized());
        mvc.perform(get(TASKS).with(outsider)).andExpect(status().isForbidden());
        mvc.perform(get(LINKS).param("q", "example")).andExpect(status().isUnauthorized());
        mvc.perform(get(LINKS).param("q", "example").with(outsider)).andExpect(status().isForbidden());
        mvc.perform(post(TASKS).with(outsider)).andExpect(status().isForbidden());
        changeResolution(UUID.randomUUID().toString(), true, 0, outsider).andExpect(status().isForbidden());
        mvc.perform(get(TASKS).with(admin())).andExpect(status().isOk());

        mvc.perform(post(TASKS).with(admin())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"description": "Count clean carriers"}
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.created.username").value(ADMIN))
                .andExpect(jsonPath("$.bucket").value("UNDATED"));
    }

    @Test
    void deletingLinkedStayLeavesTheTaskAndItsHistory() throws Exception {
        var creator = users.findByUsername(ADMIN).orElseThrow();
        var owner = owners.save(Owner.builder()
                .fullName("Example Owner")
                .primaryPhone("5550100")
                .createdBy(creator)
                .build());
        var stay = stays.save(Stay.builder()
                .owner(owner)
                .createdBy(creator)
                .startAt(LocalDateTime.parse("2026-11-15T12:00:00"))
                .endAt(LocalDateTime.parse("2026-11-16T12:00:00"))
                .agreedAmount(BigDecimal.valueOf(1200))
                .build());
        String id = create("Set out the carrier", "2026-11-15", stay.getId());

        mvc.perform(get(TASKS).with(staff()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.id == '%s')].stayId".formatted(id)).value(stay.getId().toString()))
                .andExpect(jsonPath("$..agreedAmount").isEmpty())
                .andExpect(jsonPath("$..payments").isEmpty());

        changeResolution(id, true, 0, staff()).andExpect(status().isOk());
        mvc.perform(delete("/api/stays/{id}", stay.getId()).with(admin()))
                .andExpect(status().isNoContent());
        mvc.perform(get(TASKS).with(staff()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.id == '%s')].bucket".formatted(id)).value("RESOLVED"))
                .andExpect(jsonPath("$[?(@.id == '%s' && @.stayId == null)].id".formatted(id)).value(id));
        assertEquals(1, transitionCount(id));
    }

    @Test
    void savesOneOptionalLinkAndKeepsTasksWhenACatOrOwnerIsDeleted() throws Exception {
        Owner owner = owner("Single-link owner");
        Cat cat = cat("Single-link cat", owner);
        for (String field : List.of("ownerId", "catId")) {
            createLinkedTask(field, UUID.randomUUID()).andExpect(status().isNotFound());
        }
        mvc.perform(post(TASKS).with(staff()).contentType(MediaType.APPLICATION_JSON)
                        .content(json.createObjectNode().put("description", "Check supplies")
                                .put("ownerId", owner.getId().toString()).put("catId", cat.getId().toString()).toString()))
                .andExpect(status().isBadRequest());

        String ownerTask = json.readTree(createLinkedTask("ownerId", owner.getId())
                .andExpect(status().isCreated()).andExpect(jsonPath("$.ownerId").value(owner.getId().toString()))
                .andReturn().getResponse().getContentAsString()).get("id").asString();
        String catTask = json.readTree(createLinkedTask("catId", cat.getId())
                .andExpect(status().isCreated()).andExpect(jsonPath("$.catId").value(cat.getId().toString()))
                .andReturn().getResponse().getContentAsString()).get("id").asString();
        changeResolution(catTask, true, 0, staff())
                .andExpect(status().isOk()).andExpect(jsonPath("$.catId").value(cat.getId().toString()));

        mvc.perform(delete("/api/cats/{id}", cat.getId()).with(admin())).andExpect(status().isNoContent());
        mvc.perform(delete("/api/owners/{id}", owner.getId()).with(admin())).andExpect(status().isNoContent());
        mvc.perform(get(TASKS).with(staff())).andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.id == '%s' && @.ownerId == null)].id".formatted(ownerTask)).value(ownerTask))
                .andExpect(jsonPath("$[?(@.id == '%s' && @.catId == null)].bucket".formatted(catTask)).value("RESOLVED"));
        assertEquals(1, transitionCount(catTask));
    }

    @Test
    void searchesNamesAndRanksAndPagesOnlyMatchingStays() throws Exception {
        Owner ana = owner("Ana Lookup Torres");
        Owner other = owner("Berta Lookup");
        Cat menta = cat("Menta Lookup", ana);
        Cat homonym = cat("Menta Lookup", other);
        Cat pipo = cat("Pipo Lookup", ana);
        Stay active = stay(menta, "2026-11-09", "2026-11-10", StayStatus.CHECKED_IN, null);
        Stay today = stay(menta, "2026-11-12", "2026-11-14", StayStatus.RESERVED, null);
        Stay next = stay(menta, "2026-11-15", "2026-11-16", StayStatus.RESERVED, null);
        Stay later = stay(homonym, "2026-12-01", "2026-12-02", StayStatus.RESERVED, null);
        Stay overdue = stay(homonym, "2026-11-11", "2026-11-14", StayStatus.RESERVED, null);
        Stay cancelled = stay(menta, "2026-12-03", "2026-12-04", StayStatus.RESERVED, "2026-11-10");
        Stay lastFinished = stay(menta, "2026-11-01", "2026-11-02", StayStatus.CHECKED_OUT, null);
        Stay older = stay(menta, "2026-10-01", "2026-10-02", StayStatus.CHECKED_OUT, null);
        Stay pipoStay = stay(pipo, "2026-11-03", "2026-11-04", StayStatus.CHECKED_OUT, null);

        mvc.perform(get(LINKS).with(staff()).param("q", "  menta lookup "))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.ownersFirst").value(false))
                .andExpect(jsonPath("$.owners.items[*].fullName", contains(ana.getFullName(), other.getFullName())))
                .andExpect(jsonPath("$.cats.items[*].ownerName", contains(ana.getFullName(), other.getFullName())))
                .andExpect(jsonPath("$.stays.items[*].id", contains(stayIds(active, today, next, later, overdue))))
                .andExpect(jsonPath("$.stays.items[*].status", contains("CHECKED_IN", "RESERVED", "RESERVED", "RESERVED", "RESERVED")))
                .andExpect(jsonPath("$.stays.hasMore").value(true));
        mvc.perform(get(LINKS).with(staff()).param("q", "menta lookup").param("group", "STAY").param("page", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.stays.items[*].id", contains(stayIds(cancelled, lastFinished, older))))
                .andExpect(jsonPath("$.stays.hasMore").value(false));
        mvc.perform(get(LINKS).with(staff()).param("q", "ana lookup torres"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.ownersFirst").value(true))
                .andExpect(jsonPath("$.cats.items[*].name", contains(menta.getName(), pipo.getName())))
                .andExpect(jsonPath("$.stays.items[*].id", contains(stayIds(active, today, next, cancelled, pipoStay))));
    }

    private String[] stayIds(Stay... stays) {
        return List.of(stays).stream().map(stay -> stay.getId().toString()).toArray(String[]::new);
    }

    private ResultActions createLinkedTask(String field, UUID targetId) throws Exception {
        return mvc.perform(post(TASKS).with(staff()).contentType(MediaType.APPLICATION_JSON)
                .content(json.createObjectNode().put("description", "Check supplies").put(field, targetId.toString()).toString()));
    }

    private Owner owner(String name) {
        return owners.save(Owner.builder().fullName(name).primaryPhone("5550100")
                .createdBy(users.findByUsername(ADMIN).orElseThrow()).build());
    }

    private Cat cat(String name, Owner owner) {
        return cats.save(Cat.builder().name(name).owner(owner).birthDate(LocalDate.of(2020, 1, 1)).sex(Sex.FEMALE)
                .createdBy(owner.getCreatedBy()).build());
    }

    private Stay stay(Cat cat, String start, String end, StayStatus status, String cancelled) {
        Stay stay = stays.save(Stay.builder().owner(cat.getOwner()).createdBy(cat.getCreatedBy())
                .startAt(LocalDate.parse(start).atStartOfDay()).endAt(LocalDate.parse(end).atStartOfDay())
                .movementStatus(status)
                .cancelledAt(cancelled == null ? null : LocalDate.parse(cancelled).atStartOfDay())
                .agreedAmount(BigDecimal.valueOf(1200)).build());
        stayCats.save(StayCat.builder().stay(stay).cat(cat).build());
        return stay;
    }

    private String create(String description, String dueDate, UUID stayId) throws Exception {
        var body = json.createObjectNode().put("description", description);
        if (dueDate != null) body.put("dueDate", dueDate);
        if (stayId != null) body.put("stayId", stayId.toString());

        String response = mvc.perform(post(TASKS).with(staff())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body.toString()))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.description").value(description.strip()))
                .andExpect(jsonPath("$.revision").value(0))
                .andExpect(jsonPath("$.created.username").value(STAFF))
                .andReturn().getResponse().getContentAsString();
        return json.readTree(response).get("id").asString();
    }

    private void assertBucket(String id, String bucket) throws Exception {
        mvc.perform(get(TASKS).with(staff()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.id == '%s')].bucket".formatted(id)).value(bucket));
    }

    private ResultActions changeResolution(String id, boolean resolved, long revision, RequestPostProcessor actor)
            throws Exception {
        return mvc.perform(put(TASKS + "/{id}/resolution", id).with(actor)
                .contentType(MediaType.APPLICATION_JSON)
                .content(json.createObjectNode().put("resolved", resolved).put("revision", revision).toString()));
    }

    private int transitionCount(String id) {
        return jdbc.queryForObject("select count(*) from operations_task_transitions where task_id = ?",
                Integer.class, taskKey(id));
    }

    private byte[] taskKey(String id) {
        UUID uuid = UUID.fromString(id);
        return ByteBuffer.allocate(16).putLong(uuid.getMostSignificantBits()).putLong(uuid.getLeastSignificantBits())
                .array();
    }

    private RequestPostProcessor staff() {
        return httpBasic(STAFF, STAFF_PASSWORD);
    }

    private RequestPostProcessor admin() {
        return httpBasic(ADMIN, "test-password");
    }
}
