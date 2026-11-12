package com.allegaeon.catworld.repository;

import com.allegaeon.catworld.dto.StayActualMovementRequest;
import com.allegaeon.catworld.exception.ConflictException;
import com.allegaeon.catworld.model.Owner;
import com.allegaeon.catworld.model.Stay;
import com.allegaeon.catworld.model.UserAccount;
import com.allegaeon.catworld.model.UserRole;
import com.allegaeon.catworld.security.CurrentUserAccountService;
import com.allegaeon.catworld.service.StayActualMovementService;
import com.allegaeon.catworld.service.StayService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.support.TransactionTemplate;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;

import static com.allegaeon.catworld.model.StayMovementType.ARRIVAL;
import static com.allegaeon.catworld.model.StayMovementType.DEPARTURE;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertInstanceOf;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.when;

@EnabledIfEnvironmentVariable(named = "CATWORLD_NATIVE_MYSQL_URL", matches = ".+")
@SpringBootTest(properties = {
        "spring.jpa.hibernate.ddl-auto=validate",
        "spring.flyway.enabled=true",
        "catworld.security.username=movement-native-admin",
        "catworld.security.password=movement-native-password"
})
class StayActualMovementMySqlIntegrationTest {

    @DynamicPropertySource
    static void nativeMySqlProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", () -> System.getenv("CATWORLD_NATIVE_MYSQL_URL"));
        registry.add("spring.datasource.username", () -> System.getenv("CATWORLD_NATIVE_MYSQL_USERNAME"));
        registry.add("spring.datasource.password", () -> System.getenv("CATWORLD_NATIVE_MYSQL_PASSWORD"));
    }

    @Autowired StayActualMovementService movements;
    @Autowired StayService stayService;
    @Autowired StayRepository stays;
    @Autowired OwnerRepository owners;
    @Autowired UserAccountRepository users;
    @Autowired JdbcTemplate jdbc;
    @Autowired PlatformTransactionManager transactionManager;
    @MockitoBean CurrentUserAccountService currentUser;

    @Test
    void flywayV21PreservesUtcAndAttributionAndEnforcesUniquenessAndStayCascade() {
        assertEquals(1, jdbc.queryForObject(
                "select count(*) from flyway_schema_history where success = 1 and version = '21'", Integer.class));
        var creator = saveAccount(UserRole.ADMIN);
        var recorder = saveAccount(UserRole.STAFF);
        var stay = saveStay(creator);
        try {
            when(currentUser.getCurrentUserAccount()).thenReturn(recorder);
            var actual = Instant.parse("2025-06-02T02:34:00.123456Z");
            movements.recordMovement(stay.getId(), ARRIVAL, new StayActualMovementRequest(0L, actual));

            assertEquals("2025-06-02 02:34:00.123456", jdbc.queryForObject("""
                    select cast(occurred_at_utc as char) from stay_actual_movements where stay_id = UUID_TO_BIN(?)
                    """, String.class, stay.getId().toString()));
            assertEquals(actual, movements.getMovements(stay.getId()).arrival().occurredAt());
            assertThrows(DataIntegrityViolationException.class, () -> jdbc.update("""
                    insert into stay_actual_movements
                    select * from stay_actual_movements where stay_id = UUID_TO_BIN(?)
                    """, stay.getId().toString()));

            users.deleteById(recorder.getId());
            when(currentUser.getCurrentUserAccount()).thenReturn(creator);
            assertEquals(recorder.getUsername(), movements.getMovements(stay.getId()).arrival().recordedBy());
            stayService.deleteStay(stay.getId());
            assertEquals(0, countMovements(stay));
        } finally {
            deleteFixtures(stay, creator, recorder);
        }
    }

    @Test
    void arrivalCorrectionWaitingBehindCancellationCannotChangeHistory() throws Exception {
        var creator = saveAccount(UserRole.ADMIN);
        var stay = saveStay(creator);
        var original = Instant.parse("2025-06-02T02:34:00Z");
        when(currentUser.getCurrentUserAccount()).thenReturn(creator);
        try {
            movements.recordMovement(stay.getId(), ARRIVAL, new StayActualMovementRequest(0L, original));
            var started = new CountDownLatch(1);
            var cancelTransaction = new TransactionTemplate(transactionManager);
            cancelTransaction.setIsolationLevel(TransactionDefinition.ISOLATION_READ_COMMITTED);
            try (var executor = Executors.newSingleThreadExecutor()) {
                var correction = cancelTransaction.execute(status -> {
                    stayService.cancelStay(stay.getId());
                    var pending = executor.submit(() -> {
                        started.countDown();
                        return movements.recordMovement(stay.getId(), ARRIVAL,
                                new StayActualMovementRequest(1L, original.plusSeconds(60)));
                    });
                    try {
                        assertTrue(started.await(5, TimeUnit.SECONDS));
                    } catch (InterruptedException e) {
                        Thread.currentThread().interrupt();
                        throw new AssertionError(e);
                    }
                    return pending;
                });
                var rejected = assertThrows(ExecutionException.class, () -> correction.get(5, TimeUnit.SECONDS));
                assertInstanceOf(ConflictException.class, rejected.getCause());
            }
            var historical = movements.getMovements(stay.getId());
            assertTrue(historical.cancelled());
            assertEquals(original, historical.arrival().occurredAt());
            assertNull(historical.departure());
            assertThrows(ConflictException.class, () -> movements.recordMovement(stay.getId(), DEPARTURE,
                    new StayActualMovementRequest(0L, original)));
        } finally {
            deleteFixtures(stay, creator);
        }
    }

    private UserAccount saveAccount(UserRole role) {
        return users.saveAndFlush(UserAccount.builder().username("movement-" + UUID.randomUUID())
                .passwordHash("unused").role(role).build());
    }

    private Stay saveStay(UserAccount creator) {
        var owner = owners.saveAndFlush(Owner.builder().fullName("Movement Owner")
                .primaryPhone("5550100").createdBy(creator).build());
        return stays.saveAndFlush(Stay.builder().owner(owner).createdBy(creator)
                .startAt(LocalDateTime.parse("2025-06-01T23:00"))
                .endAt(LocalDateTime.parse("2099-06-03T10:00")).build());
    }

    private int countMovements(Stay stay) {
        return jdbc.queryForObject("select count(*) from stay_actual_movements where stay_id = UUID_TO_BIN(?)",
                Integer.class, stay.getId().toString());
    }

    private void deleteFixtures(Stay stay, UserAccount... actors) {
        stays.deleteById(stay.getId());
        owners.deleteById(stay.getOwner().getId());
        for (UserAccount actor : actors) users.deleteById(actor.getId());
    }
}
