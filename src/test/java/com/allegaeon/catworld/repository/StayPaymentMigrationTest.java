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
import java.math.BigDecimal;
import java.nio.ByteBuffer;
import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:stay_payment_migration_context;DB_CLOSE_DELAY=-1;MODE=MySQL",
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
class StayPaymentMigrationTest {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private DataSource dataSource;

    @Test
    void latestSchemaHasExactFocusedPaymentStorageWithoutDerivedColumns() {
        assertDecimalColumn("STAY_PAYMENTS", "AMOUNT", 19, 0);
        assertDecimalColumn("STAY_PAYMENT_EDITS", "PREVIOUS_AMOUNT", 19, 0);
        assertDecimalColumn("STAY_PAYMENT_EDITS", "NEW_AMOUNT", 19, 0);

        assertEquals(2, foreignKeyCount("STAY_PAYMENTS"));
        assertEquals(3, foreignKeyCount("STAY_PAYMENT_EDITS"));
        assertEquals(3, foreignKeyCount("STAY_PAYMENT_ANNULMENTS"));
        assertImportedKey(
                "STAY_PAYMENTS",
                "FK_STAY_PAYMENTS_STAY",
                "STAY_ID",
                "STAYS",
                "ID"
        );
        assertImportedKey(
                "STAY_PAYMENTS",
                "FK_STAY_PAYMENTS_REGISTRANT",
                "REGISTERED_BY_ID",
                "USER_ACCOUNTS",
                "ID"
        );
        assertImportedKey(
                "STAY_PAYMENT_EDITS",
                "FK_STAY_PAYMENT_EDITS_ACTOR",
                "EDITED_BY_ID",
                "USER_ACCOUNTS",
                "ID"
        );
        assertImportedKey(
                "STAY_PAYMENT_ANNULMENTS",
                "FK_STAY_PAYMENT_ANNULMENTS_ACTOR",
                "ANNULLED_BY_ID",
                "USER_ACCOUNTS",
                "ID"
        );
        assertIndex(
                "STAY_PAYMENTS",
                "IDX_STAY_PAYMENTS_STAY_ACTIVE",
                List.of("STAY_ID", "ANNULLED")
        );
        assertIndex(
                "STAY_PAYMENT_EDITS",
                "IDX_STAY_PAYMENT_EDITS_STAY_ID",
                List.of("STAY_ID")
        );
        assertIndex(
                "STAY_PAYMENT_EDITS",
                "IDX_STAY_PAYMENT_EDITS_PAYMENT_ID",
                List.of("PAYMENT_ID")
        );
        assertIndex(
                "STAY_PAYMENT_ANNULMENTS",
                "IDX_STAY_PAYMENT_ANNULMENTS_STAY_ID",
                List.of("STAY_ID")
        );
        assertConstraint("CHK_STAY_PAYMENTS_AMOUNT", "CHECK");
        assertConstraint(
                "CHK_STAY_PAYMENT_EDITS_PREVIOUS_AMOUNT",
                "CHECK"
        );
        assertConstraint("CHK_STAY_PAYMENT_EDITS_NEW_AMOUNT", "CHECK");
        assertConstraint("CHK_STAY_PAYMENT_EDITS_REAL_CHANGE", "CHECK");
        assertConstraint("CHK_STAY_PAYMENT_EDITS_REASON", "CHECK");
        assertConstraint("CHK_STAY_PAYMENT_ANNULMENTS_REASON", "CHECK");
        assertConstraint(
                "UK_STAY_PAYMENT_ANNULMENTS_PAYMENT",
                "UNIQUE"
        );
        assertEquals(
                0,
                jdbcTemplate.queryForObject(
                        """
                        select count(*)
                        from information_schema.columns
                        where column_name in (
                            'TOTAL_PAID',
                            'REMAINING_AMOUNT',
                            'PAYMENT_CONDITION',
                            'OUTSTANDING_COLLECTION_ELIGIBLE'
                        )
                        """,
                        Integer.class
                )
        );
    }

    @Test
    void migrationFromVersionSixPreservesLegacyStayAndCreatesNoPaymentRows() {
        DataSource dataSource = new SingleConnectionDataSource(
                "jdbc:h2:mem:stay_payment_v6_upgrade;DB_CLOSE_DELAY=-1;MODE=MySQL",
                "sa",
                "",
                true
        );
        NightlyReferenceRateMigrationTest.initializeVersionThreeSchema(dataSource);
        Flyway.configure()
                .dataSource(dataSource)
                .baselineOnMigrate(true)
                .baselineVersion(MigrationVersion.fromVersion("3"))
                .target(MigrationVersion.fromVersion("6"))
                .load()
                .migrate();

        JdbcTemplate v6 = new JdbcTemplate(dataSource);
        SeedIds ids = insertStay(v6, "v6-payment-admin");

        Flyway.configure().dataSource(dataSource).load().migrate();

        assertEquals(
                "legacy payment stay",
                v6.queryForObject(
                        "select notes from stays where id = ?",
                        String.class,
                        uuidBytes(ids.stayId())
                )
        );
        assertEquals(0, count(v6, "stay_payments"));
        assertEquals(0, count(v6, "stay_payment_edits"));
        assertEquals(0, count(v6, "stay_payment_annulments"));
    }

    @Test
    void databaseChecksRejectInvalidPaymentAndAuditState() {
        SeedIds ids = insertStay(jdbcTemplate, "payment-check-admin");
        UUID paymentId = UUID.randomUUID();
        Timestamp eventAt = Timestamp.from(Instant.parse("2026-07-30T12:00:00Z"));

        assertThrows(
                DataIntegrityViolationException.class,
                () -> insertPayment(jdbcTemplate, ids, UUID.randomUUID(), 0)
        );

        insertPayment(jdbcTemplate, ids, paymentId, 25);

        assertThrows(
                DataIntegrityViolationException.class,
                () -> jdbcTemplate.update(
                        """
                        insert into stay_payment_edits
                            (id, stay_id, payment_id, previous_amount, new_amount,
                             edited_by_id, edited_at, reason)
                        values (?, ?, ?, 25, 25, ?, ?, 'No change')
                        """,
                        uuidBytes(UUID.randomUUID()),
                        uuidBytes(ids.stayId()),
                        uuidBytes(paymentId),
                        uuidBytes(ids.actorId()),
                        eventAt
                )
        );
        assertThrows(
                DataIntegrityViolationException.class,
                () -> jdbcTemplate.update(
                        """
                        insert into stay_payment_annulments
                            (id, stay_id, payment_id, annulled_by_id, annulled_at, reason)
                        values (?, ?, ?, ?, ?, '   ')
                        """,
                        uuidBytes(UUID.randomUUID()),
                        uuidBytes(ids.stayId()),
                        uuidBytes(paymentId),
                        uuidBytes(ids.actorId()),
                        eventAt
                )
        );
    }

    private SeedIds insertStay(JdbcTemplate target, String username) {
        UUID actorId = UUID.randomUUID();
        UUID ownerId = UUID.randomUUID();
        UUID stayId = UUID.randomUUID();
        Timestamp createdAt = Timestamp.from(Instant.parse("2026-07-30T10:00:00Z"));
        target.update(
                """
                insert into user_accounts
                    (id, username, password_hash, role, enabled, created_at, updated_at)
                values (?, ?, ?, ?, ?, ?, ?)
                """,
                uuidBytes(actorId),
                username,
                "hash",
                "ADMIN",
                true,
                createdAt,
                createdAt
        );
        target.update(
                """
                insert into owners
                    (id, full_name, primary_phone, created_at, updated_at, created_by_id)
                values (?, ?, ?, ?, ?, ?)
                """,
                uuidBytes(ownerId),
                "Payment Owner",
                "555-0323",
                createdAt,
                createdAt,
                uuidBytes(actorId)
        );
        target.update(
                """
                insert into stays
                    (id, start_at, end_at, notes, owner_id, created_at, updated_at,
                     created_by_id, retained_nightly_rate, agreed_amount)
                values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                uuidBytes(stayId),
                LocalDateTime.of(2026, 8, 1, 12, 0),
                LocalDateTime.of(2026, 8, 3, 12, 0),
                "legacy payment stay",
                uuidBytes(ownerId),
                createdAt,
                createdAt,
                uuidBytes(actorId),
                new BigDecimal("50"),
                new BigDecimal("100")
        );
        return new SeedIds(actorId, stayId);
    }

    private void insertPayment(
            JdbcTemplate target,
            SeedIds ids,
            UUID paymentId,
            int amount) {
        Timestamp createdAt = Timestamp.from(Instant.parse("2026-07-30T12:00:00Z"));
        target.update(
                """
                insert into stay_payments
                    (id, stay_id, amount, payment_date, note, annulled,
                     registered_by_id, created_at, updated_at)
                values (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                uuidBytes(paymentId),
                uuidBytes(ids.stayId()),
                amount,
                LocalDate.of(2026, 7, 30),
                null,
                false,
                uuidBytes(ids.actorId()),
                createdAt,
                createdAt
        );
    }

    private int foreignKeyCount(String table) {
        return jdbcTemplate.queryForObject(
                """
                select count(*)
                from information_schema.table_constraints
                where table_name = ? and constraint_type = 'FOREIGN KEY'
                """,
                Integer.class,
                table
        );
    }

    private void assertImportedKey(
            String table,
            String foreignKeyName,
            String foreignKeyColumn,
            String primaryKeyTable,
            String primaryKeyColumn) {
        List<ImportedKey> importedKeys = new ArrayList<>();
        try (
                Connection connection = dataSource.getConnection();
                ResultSet keys = connection.getMetaData().getImportedKeys(
                        null,
                        "PUBLIC",
                        table
                )
        ) {
            while (keys.next()) {
                importedKeys.add(new ImportedKey(
                        keys.getString("FK_NAME"),
                        keys.getString("FKCOLUMN_NAME"),
                        keys.getString("PKTABLE_NAME"),
                        keys.getString("PKCOLUMN_NAME")
                ));
            }
        } catch (SQLException exception) {
            throw new IllegalStateException("Could not inspect imported keys", exception);
        }

        assertEquals(
                1,
                importedKeys.stream()
                        .filter(key -> foreignKeyName.equals(key.name())
                                && foreignKeyColumn.equals(key.foreignKeyColumn())
                                && primaryKeyTable.equals(key.primaryKeyTable())
                                && primaryKeyColumn.equals(key.primaryKeyColumn()))
                        .count()
        );
    }

    private void assertIndex(
            String table,
            String indexName,
            List<String> expectedColumns) {
        List<IndexColumn> columns = new ArrayList<>();
        try (
                Connection connection = dataSource.getConnection();
                ResultSet indexes = connection.getMetaData().getIndexInfo(
                        null,
                        "PUBLIC",
                        table,
                        false,
                        false
                )
        ) {
            while (indexes.next()) {
                if (indexName.equals(indexes.getString("INDEX_NAME"))) {
                    columns.add(new IndexColumn(
                            indexes.getInt("ORDINAL_POSITION"),
                            indexes.getString("COLUMN_NAME")
                    ));
                }
            }
        } catch (SQLException exception) {
            throw new IllegalStateException("Could not inspect indexes", exception);
        }
        columns.sort(Comparator.comparingInt(IndexColumn::position));

        assertEquals(
                expectedColumns,
                columns.stream().map(IndexColumn::column).toList()
        );
    }

    private void assertConstraint(String name, String type) {
        assertEquals(
                1,
                jdbcTemplate.queryForObject(
                        """
                        select count(*)
                        from information_schema.table_constraints
                        where constraint_schema = 'PUBLIC'
                          and constraint_name = ?
                          and constraint_type = ?
                        """,
                        Integer.class,
                        name,
                        type
                )
        );
    }

    private int count(JdbcTemplate target, String table) {
        return target.queryForObject(
                "select count(*) from " + table,
                Integer.class
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

    private static byte[] uuidBytes(UUID id) {
        return ByteBuffer.allocate(16)
                .putLong(id.getMostSignificantBits())
                .putLong(id.getLeastSignificantBits())
                .array();
    }

    private record SeedIds(UUID actorId, UUID stayId) {
    }

    private record ImportedKey(
            String name,
            String foreignKeyColumn,
            String primaryKeyTable,
            String primaryKeyColumn) {
    }

    private record IndexColumn(int position, String column) {
    }
}
