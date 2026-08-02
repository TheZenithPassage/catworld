package com.allegaeon.catworld.repository;

import org.flywaydb.core.Flyway;
import org.flywaydb.core.api.MigrationVersion;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.SingleConnectionDataSource;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.ContextConfiguration;

import javax.sql.DataSource;
import java.nio.ByteBuffer;
import java.sql.Timestamp;
import java.time.Instant;
import java.time.LocalDateTime;
import java.math.BigDecimal;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;

@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:stay_pricing_migration_context;DB_CLOSE_DELAY=-1;MODE=MySQL",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.datasource.username=sa",
        "spring.datasource.password=",
        "spring.jpa.database-platform=org.hibernate.dialect.MySQLDialect",
        "spring.jpa.hibernate.ddl-auto=validate",
        "spring.flyway.enabled=false",
        "catworld.security.username=migration-admin",
        "catworld.security.password=migration-password",
        "catworld.security.cors-allowed-origins=http://localhost:4200"
})
@ActiveProfiles("migration")
@ContextConfiguration(
        initializers = NightlyReferenceRateMigrationTest.LatestSchemaInitializer.class
)
class StayPricingMigrationTest {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Test
    void latestSchemaHasExactLegacyCompatiblePricingAndAuditColumns() {
        assertDecimalColumn("STAYS", "RETAINED_NIGHTLY_RATE", 19, 0);
        assertDecimalColumn("STAYS", "AGREED_AMOUNT", 19, 0);
        assertDecimalColumn(
                "STAY_PRICING_DECISIONS",
                "RETAINED_NIGHTLY_RATE",
                19,
                0
        );
        assertDecimalColumn(
                "STAY_PRICING_DECISIONS",
                "PREVIOUS_AGREED_AMOUNT",
                19,
                0
        );
        assertDecimalColumn(
                "STAY_PRICING_DECISIONS",
                "NEW_AGREED_AMOUNT",
                19,
                0
        );
        assertDecimalColumn(
                "STAY_AGREED_AMOUNT_CORRECTIONS",
                "PREVIOUS_AGREED_AMOUNT",
                19,
                0
        );
        assertDecimalColumn(
                "STAY_AGREED_AMOUNT_CORRECTIONS",
                "NEW_AGREED_AMOUNT",
                19,
                0
        );

        assertEquals(
                2,
                jdbcTemplate.queryForObject(
                        """
                        select count(*)
                        from information_schema.table_constraints
                        where table_name = 'STAY_PRICING_DECISIONS'
                          and constraint_type = 'FOREIGN KEY'
                        """,
                        Integer.class
                )
        );
        assertEquals(
                0,
                jdbcTemplate.queryForObject(
                        """
                        select count(*)
                        from information_schema.referential_constraints
                        where constraint_name = 'FK_STAY_PRICING_DECISIONS_STAY'
                        """,
                        Integer.class
                )
        );
        assertEquals(
                2,
                jdbcTemplate.queryForObject(
                        """
                        select count(*)
                        from information_schema.table_constraints
                        where table_name = 'STAY_AGREED_AMOUNT_CORRECTIONS'
                          and constraint_type = 'FOREIGN KEY'
                        """,
                        Integer.class
                )
        );
        assertEquals(
                0,
                jdbcTemplate.queryForObject(
                        """
                        select count(*)
                        from information_schema.referential_constraints
                        where constraint_name = 'FK_STAY_CORRECTIONS_STAY'
                        """,
                        Integer.class
                )
        );
    }

    @Test
    void migrationFromVersionFourPreservesLegacyStayWithoutPricingBackfill() {
        SingleConnectionDataSource dataSource = new SingleConnectionDataSource(
                "jdbc:h2:mem:stay_pricing_v4_upgrade;DB_CLOSE_DELAY=-1;MODE=MySQL",
                "sa",
                "",
                true
        );
        NightlyReferenceRateMigrationTest.initializeVersionThreeSchema(dataSource);
        Flyway.configure()
                .dataSource(dataSource)
                .baselineOnMigrate(true)
                .baselineVersion(MigrationVersion.fromVersion("3"))
                .target(MigrationVersion.fromVersion("4"))
                .load()
                .migrate();

        JdbcTemplate v4 = new JdbcTemplate(dataSource);
        UUID actorId = UUID.randomUUID();
        UUID ownerId = UUID.randomUUID();
        UUID stayId = UUID.randomUUID();
        Timestamp createdAt = Timestamp.from(Instant.parse("2026-07-28T12:00:00Z"));
        v4.update(
                """
                insert into user_accounts
                    (id, username, password_hash, role, enabled, created_at, updated_at)
                values (?, ?, ?, ?, ?, ?, ?)
                """,
                uuidBytes(actorId),
                "legacy-pricing-admin",
                "hash",
                "ADMIN",
                true,
                createdAt,
                createdAt
        );
        v4.update(
                """
                insert into owners
                    (id, full_name, primary_phone, created_at, updated_at, created_by_id)
                values (?, ?, ?, ?, ?, ?)
                """,
                uuidBytes(ownerId),
                "Legacy Pricing Owner",
                "555-0199",
                createdAt,
                createdAt,
                uuidBytes(actorId)
        );
        v4.update(
                """
                insert into stays
                    (id, start_at, end_at, notes, owner_id, created_at, updated_at, created_by_id)
                values (?, ?, ?, ?, ?, ?, ?, ?)
                """,
                uuidBytes(stayId),
                LocalDateTime.of(2026, 8, 1, 12, 0),
                LocalDateTime.of(2026, 8, 3, 12, 0),
                "legacy pricing stay",
                uuidBytes(ownerId),
                createdAt,
                createdAt,
                uuidBytes(actorId)
        );

        Flyway.configure().dataSource(dataSource).load().migrate();

        assertNull(v4.queryForObject(
                "select retained_nightly_rate from stays where id = ?",
                java.math.BigDecimal.class,
                uuidBytes(stayId)
        ));
        assertNull(v4.queryForObject(
                "select agreed_amount from stays where id = ?",
                java.math.BigDecimal.class,
                uuidBytes(stayId)
        ));
        assertEquals(
                0,
                v4.queryForObject(
                        "select count(*) from stay_pricing_decisions",
                        Integer.class
                )
        );
        assertEquals(
                0,
                v4.queryForObject(
                        "select count(*) from stay_agreed_amount_corrections",
                        Integer.class
                )
        );
    }

    @Test
    void migrationFromVersionFiveCreatesNoLegacyCorrectionEvents() {
        SingleConnectionDataSource dataSource = new SingleConnectionDataSource(
                "jdbc:h2:mem:stay_correction_v5_upgrade;DB_CLOSE_DELAY=-1;MODE=MySQL",
                "sa",
                "",
                true
        );
        NightlyReferenceRateMigrationTest.initializeVersionThreeSchema(dataSource);
        Flyway.configure()
                .dataSource(dataSource)
                .baselineOnMigrate(true)
                .baselineVersion(MigrationVersion.fromVersion("3"))
                .target(MigrationVersion.fromVersion("5"))
                .load()
                .migrate();

        JdbcTemplate v5 = new JdbcTemplate(dataSource);
        UUID actorId = UUID.randomUUID();
        UUID ownerId = UUID.randomUUID();
        UUID stayId = UUID.randomUUID();
        Timestamp createdAt = Timestamp.from(Instant.parse("2026-07-28T12:00:00Z"));
        v5.update(
                """
                insert into user_accounts
                    (id, username, password_hash, role, enabled, created_at, updated_at)
                values (?, ?, ?, ?, ?, ?, ?)
                """,
                uuidBytes(actorId),
                "v5-correction-admin",
                "hash",
                "ADMIN",
                true,
                createdAt,
                createdAt
        );
        v5.update(
                """
                insert into owners
                    (id, full_name, primary_phone, created_at, updated_at, created_by_id)
                values (?, ?, ?, ?, ?, ?)
                """,
                uuidBytes(ownerId),
                "V5 Correction Owner",
                "555-0187",
                createdAt,
                createdAt,
                uuidBytes(actorId)
        );
        v5.update(
                """
                insert into stays
                    (id, start_at, end_at, notes, owner_id, created_at, updated_at,
                     created_by_id, retained_nightly_rate, agreed_amount)
                values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                uuidBytes(stayId),
                LocalDateTime.of(2026, 8, 1, 12, 0),
                LocalDateTime.of(2026, 8, 3, 12, 0),
                "v5 priced stay",
                uuidBytes(ownerId),
                createdAt,
                createdAt,
                uuidBytes(actorId),
                new BigDecimal("10"),
                new BigDecimal("20")
        );

        Flyway.configure().dataSource(dataSource).load().migrate();

        assertEquals(
                new BigDecimal("20"),
                v5.queryForObject(
                        "select agreed_amount from stays where id = ?",
                        BigDecimal.class,
                        uuidBytes(stayId)
                )
        );
        assertEquals(
                0,
                v5.queryForObject(
                        "select count(*) from stay_agreed_amount_corrections",
                        Integer.class
                )
        );
    }

    @Test
    void databaseChecksRejectInvalidCurrentAndDecisionAmounts() {
        UUID actorId = UUID.randomUUID();
        UUID ownerId = UUID.randomUUID();
        UUID stayId = UUID.randomUUID();
        Timestamp createdAt = Timestamp.from(Instant.parse("2026-07-28T12:00:00Z"));
        jdbcTemplate.update(
                """
                insert into user_accounts
                    (id, username, password_hash, role, enabled, created_at, updated_at)
                values (?, ?, ?, ?, ?, ?, ?)
                """,
                uuidBytes(actorId),
                "pricing-check-admin",
                "hash",
                "ADMIN",
                true,
                createdAt,
                createdAt
        );
        jdbcTemplate.update(
                """
                insert into owners
                    (id, full_name, primary_phone, created_at, updated_at, created_by_id)
                values (?, ?, ?, ?, ?, ?)
                """,
                uuidBytes(ownerId),
                "Pricing Check Owner",
                "555-0188",
                createdAt,
                createdAt,
                uuidBytes(actorId)
        );
        jdbcTemplate.update(
                """
                insert into stays
                    (id, start_at, end_at, notes, owner_id, created_at, updated_at, created_by_id)
                values (?, ?, ?, ?, ?, ?, ?, ?)
                """,
                uuidBytes(stayId),
                LocalDateTime.of(2026, 8, 1, 12, 0),
                LocalDateTime.of(2026, 8, 3, 12, 0),
                "pricing checks",
                uuidBytes(ownerId),
                createdAt,
                createdAt,
                uuidBytes(actorId)
        );

        assertThrows(
                DataIntegrityViolationException.class,
                () -> jdbcTemplate.update(
                        "update stays set retained_nightly_rate = 0 where id = ?",
                        uuidBytes(stayId)
                )
        );

        assertThrows(
                DataIntegrityViolationException.class,
                () -> jdbcTemplate.update(
                        """
                        insert into stay_agreed_amount_corrections
                            (id, stay_id, previous_agreed_amount,
                             new_agreed_amount, decided_by_id, decided_at, reason)
                        values (?, ?, 20, 20, ?, ?, 'No numerical change')
                        """,
                        uuidBytes(UUID.randomUUID()),
                        uuidBytes(stayId),
                        uuidBytes(actorId),
                        Timestamp.from(Instant.parse("2026-07-28T12:00:00Z"))
                )
        );
        assertThrows(
                DataIntegrityViolationException.class,
                () -> jdbcTemplate.update(
                        """
                        insert into stay_agreed_amount_corrections
                            (id, stay_id, previous_agreed_amount,
                             new_agreed_amount, decided_by_id, decided_at, reason)
                        values (?, ?, null, 25, ?, ?, '   ')
                        """,
                        uuidBytes(UUID.randomUUID()),
                        uuidBytes(stayId),
                        uuidBytes(actorId),
                        Timestamp.from(Instant.parse("2026-07-28T12:00:00Z"))
                )
        );
        assertThrows(
                DataIntegrityViolationException.class,
                () -> jdbcTemplate.update(
                        """
                        insert into stay_pricing_decisions
                            (id, stay_id, retained_nightly_rate,
                             previous_number_of_nights, new_number_of_nights,
                             previous_agreed_amount, new_agreed_amount,
                             decided_by_id, decided_at, reason)
                        values (?, ?, null, null, 0, null, -1, ?, ?, null)
                        """,
                        uuidBytes(UUID.randomUUID()),
                        uuidBytes(stayId),
                        uuidBytes(actorId),
                        Timestamp.from(Instant.parse("2026-07-28T12:00:00Z"))
                )
        );
    }

    private void assertDecimalColumn(
            String table,
            String column,
            int precision,
            int scale) {
        assertEquals(
                precision,
                jdbcTemplate.queryForObject(
                        """
                        select numeric_precision
                        from information_schema.columns
                        where table_name = ? and column_name = ?
                        """,
                        Integer.class,
                        table,
                        column
                )
        );
        assertEquals(
                scale,
                jdbcTemplate.queryForObject(
                        """
                        select numeric_scale
                        from information_schema.columns
                        where table_name = ? and column_name = ?
                        """,
                        Integer.class,
                        table,
                        column
                )
        );
    }

    private byte[] uuidBytes(UUID id) {
        return ByteBuffer.allocate(16)
                .putLong(id.getMostSignificantBits())
                .putLong(id.getLeastSignificantBits())
                .array();
    }
}
