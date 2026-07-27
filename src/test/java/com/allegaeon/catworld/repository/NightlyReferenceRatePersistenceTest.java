package com.allegaeon.catworld.repository;

import com.allegaeon.catworld.exception.ConflictException;
import com.allegaeon.catworld.model.NightlyReferenceRateCategory;
import com.allegaeon.catworld.model.UserAccount;
import com.allegaeon.catworld.model.UserRole;
import com.allegaeon.catworld.security.CurrentUserAccountService;
import com.allegaeon.catworld.service.NightlyReferenceRateService;
import com.allegaeon.catworld.service.UserAccountService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

import java.math.BigDecimal;
import java.nio.ByteBuffer;
import java.sql.Timestamp;
import java.time.Clock;
import java.time.Instant;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.when;

@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:rate_persistence_context;DB_CLOSE_DELAY=-1;MODE=MySQL",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.datasource.username=sa",
        "spring.datasource.password=",
        "spring.jpa.database-platform=org.hibernate.dialect.H2Dialect",
        "spring.jpa.hibernate.ddl-auto=none",
        "spring.flyway.enabled=false",
        "catworld.security.username=persistence-admin",
        "catworld.security.password=persistence-password",
        "catworld.security.cors-allowed-origins=http://localhost:4200"
})
@ActiveProfiles("persistence")
@ContextConfiguration(initializers = NightlyReferenceRateMigrationTest.LatestSchemaInitializer.class)
class NightlyReferenceRatePersistenceTest {

    private static final Instant CHANGED_AT = Instant.parse("2026-07-27T12:00:00Z");

    @Autowired
    private NightlyReferenceRateService nightlyReferenceRateService;

    @Autowired
    private UserAccountService userAccountService;

    @Autowired
    private NightlyReferenceRateRepository nightlyReferenceRateRepository;

    @Autowired
    private NightlyReferenceRateChangeRepository nightlyReferenceRateChangeRepository;

    @Autowired
    private UserAccountRepository userAccountRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @MockitoBean
    private CurrentUserAccountService currentUserAccountService;

    @MockitoBean
    private Clock clock;

    @BeforeEach
    void resetFeatureData() {
        jdbcTemplate.update("delete from nightly_reference_rate_changes");
        jdbcTemplate.update("update nightly_reference_rates set nightly_rate = null");
        userAccountRepository.deleteAll();
        when(clock.instant()).thenReturn(CHANGED_AT);
    }

    @Test
    void committedTransitionChainKeepsImmutableSnapshotsAndDurableActor() {
        UserAccount actor = saveAccount("rate-admin");
        when(currentUserAccountService.getCurrentUserAccount()).thenReturn(actor);

        nightlyReferenceRateService.configureRate(1, new BigDecimal("12.5000"));
        nightlyReferenceRateService.configureRate(1, new BigDecimal("13.7500"));
        nightlyReferenceRateService.clearRate(1);

        assertNull(nightlyReferenceRateRepository
                .findById(NightlyReferenceRateCategory.ONE_CAT)
                .orElseThrow()
                .getNightlyRate());
        assertEquals(3, nightlyReferenceRateChangeRepository.count());
        assertEquals(
                1,
                countTransition(actor.getId(), null, new BigDecimal("12.5000"))
        );
        assertEquals(
                1,
                countTransition(actor.getId(), new BigDecimal("12.5000"), new BigDecimal("13.7500"))
        );
        assertEquals(
                1,
                countTransition(actor.getId(), new BigDecimal("13.7500"), null)
        );
        assertEquals(
                3,
                jdbcTemplate.queryForObject(
                        "select count(*) from nightly_reference_rate_changes where changed_at = ?",
                        Integer.class,
                        Timestamp.from(CHANGED_AT)
                )
        );
    }

    @Test
    void databaseRejectsInvalidCurrentAndAuditStates() {
        UserAccount actor = saveAccount("constraint-admin");

        assertThrows(
                DataIntegrityViolationException.class,
                () -> jdbcTemplate.update(
                        """
                        insert into nightly_reference_rates
                            (category, nightly_rate, created_at, updated_at)
                        values ('FOUR_CATS', null, ?, ?)
                        """,
                        Timestamp.from(CHANGED_AT),
                        Timestamp.from(CHANGED_AT)
                )
        );
        assertThrows(
                DataIntegrityViolationException.class,
                () -> jdbcTemplate.update(
                        """
                        update nightly_reference_rates
                        set nightly_rate = -1
                        where category = 'ONE_CAT'
                        """
                )
        );
        assertThrows(
                DataIntegrityViolationException.class,
                () -> jdbcTemplate.update(
                        """
                        insert into nightly_reference_rate_changes
                            (id, category, previous_nightly_rate, new_nightly_rate,
                             changed_by_id, changed_at)
                        values (?, 'FOUR_CATS', null, 1, ?, ?)
                        """,
                        uuidBytes(UUID.randomUUID()),
                        uuidBytes(actor.getId()),
                        Timestamp.from(CHANGED_AT)
                )
        );
        assertThrows(
                DataIntegrityViolationException.class,
                () -> jdbcTemplate.update(
                        """
                        insert into nightly_reference_rate_changes
                            (id, category, previous_nightly_rate, new_nightly_rate,
                             changed_by_id, changed_at)
                        values (?, 'ONE_CAT', 0, 1, ?, ?)
                        """,
                        uuidBytes(UUID.randomUUID()),
                        uuidBytes(actor.getId()),
                        Timestamp.from(CHANGED_AT)
                )
        );
        assertThrows(
                DataIntegrityViolationException.class,
                () -> jdbcTemplate.update(
                        """
                        insert into nightly_reference_rate_changes
                            (id, category, previous_nightly_rate, new_nightly_rate,
                             changed_by_id, changed_at)
                        values (?, 'ONE_CAT', 1, -1, ?, ?)
                        """,
                        uuidBytes(UUID.randomUUID()),
                        uuidBytes(actor.getId()),
                        Timestamp.from(CHANGED_AT)
                )
        );
        assertThrows(
                DataIntegrityViolationException.class,
                () -> jdbcTemplate.update(
                        """
                        insert into nightly_reference_rate_changes
                            (id, category, previous_nightly_rate, new_nightly_rate,
                             changed_by_id, changed_at)
                        values (?, 'ONE_CAT', null, null, ?, ?)
                        """,
                        uuidBytes(UUID.randomUUID()),
                        uuidBytes(actor.getId()),
                        Timestamp.from(CHANGED_AT)
                )
        );
    }

    @Test
    void failedAuditInsertRollsBackCurrentValue() {
        UUID missingActorId = UUID.fromString("00000000-0000-0000-0000-000000000099");
        UserAccount missingActor = UserAccount.builder()
                .id(missingActorId)
                .username("missing-admin")
                .passwordHash("hash")
                .role(UserRole.ADMIN)
                .enabled(true)
                .build();
        when(currentUserAccountService.getCurrentUserAccount()).thenReturn(missingActor);

        assertThrows(
                RuntimeException.class,
                () -> nightlyReferenceRateService.configureRate(2, new BigDecimal("20.0000"))
        );

        assertNull(nightlyReferenceRateRepository
                .findById(NightlyReferenceRateCategory.TWO_CATS)
                .orElseThrow()
                .getNightlyRate());
        assertEquals(0, nightlyReferenceRateChangeRepository.count());
    }

    @Test
    void referencedRateChangeActorCannotBeDeleted() {
        UserAccount actor = saveAccount("attributed-admin");
        UserAccount otherAdmin = saveAccount("other-admin");
        when(currentUserAccountService.getCurrentUserAccount()).thenReturn(actor);
        nightlyReferenceRateService.configureRate(3, new BigDecimal("30.0000"));

        when(currentUserAccountService.getCurrentUserAccount()).thenReturn(otherAdmin);

        assertThrows(ConflictException.class, () -> userAccountService.deleteUser(actor.getId()));
        assertTrue(userAccountRepository.existsById(actor.getId()));
        assertEquals(1, nightlyReferenceRateChangeRepository.count());
    }

    private UserAccount saveAccount(String username) {
        return userAccountRepository.saveAndFlush(UserAccount.builder()
                .username(username)
                .passwordHash(passwordEncoder.encode("password"))
                .role(UserRole.ADMIN)
                .enabled(true)
                .build());
    }

    private int countTransition(UUID actorId, BigDecimal previousRate, BigDecimal newRate) {
        String previousPredicate = previousRate == null
                ? "previous_nightly_rate is null"
                : "previous_nightly_rate = ?";
        String newPredicate = newRate == null
                ? "new_nightly_rate is null"
                : "new_nightly_rate = ?";
        String sql = """
                select count(*)
                from nightly_reference_rate_changes
                where category = 'ONE_CAT'
                  and changed_by_id = ?
                  and %s
                  and %s
                """.formatted(previousPredicate, newPredicate);

        if (previousRate == null && newRate == null) {
            throw new IllegalArgumentException("A transition must change state");
        }
        if (previousRate == null) {
            return jdbcTemplate.queryForObject(
                    sql,
                    Integer.class,
                    uuidBytes(actorId),
                    newRate
            );
        }
        if (newRate == null) {
            return jdbcTemplate.queryForObject(
                    sql,
                    Integer.class,
                    uuidBytes(actorId),
                    previousRate
            );
        }
        return jdbcTemplate.queryForObject(
                sql,
                Integer.class,
                uuidBytes(actorId),
                previousRate,
                newRate
        );
    }

    private byte[] uuidBytes(UUID id) {
        return ByteBuffer.allocate(16)
                .putLong(id.getMostSignificantBits())
                .putLong(id.getLeastSignificantBits())
                .array();
    }
}
