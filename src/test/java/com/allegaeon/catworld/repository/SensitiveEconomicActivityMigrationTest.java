package com.allegaeon.catworld.repository;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.ContextConfiguration;

import java.util.List;
import java.util.ArrayList;
import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.SQLException;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:sensitive_activity_migration;DB_CLOSE_DELAY=-1;MODE=MySQL",
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
class SensitiveEconomicActivityMigrationTest {

    @Autowired JdbcTemplate jdbc;
    @Autowired DataSource dataSource;

    @Test
    void v8HasExactDurableContextAndRemovalSchemaWithoutOperationalForeignKeys() {
        assertEquals(1, countTable("SENSITIVE_STAY_CONTEXTS"));
        assertEquals(1, countTable("SENSITIVE_STAY_CONTEXT_CATS"));
        assertEquals(1, countTable("STAY_PAYMENT_REMOVALS"));
        assertDecimal("STAY_PAYMENT_REMOVALS", "AMOUNT", 19, 0);
        assertEquals(0, jdbc.queryForObject(
                "select count(*) from sensitive_stay_contexts", Integer.class));

        List<String> contextReferences = referencedTables(
                "SENSITIVE_STAY_CONTEXTS");
        assertTrue(contextReferences.isEmpty());
        List<String> catReferences = referencedTables(
                "SENSITIVE_STAY_CONTEXT_CATS");
        assertEquals(List.of("SENSITIVE_STAY_CONTEXTS"), catReferences);
        List<String> removalReferences = referencedTables(
                "STAY_PAYMENT_REMOVALS");
        assertEquals(List.of(
                "SENSITIVE_STAY_CONTEXTS", "USER_ACCOUNTS", "USER_ACCOUNTS"
        ), removalReferences.stream().sorted().toList());

        assertEquals(1, columnCount(
                "STAY_PRICING_DECISIONS", "SENSITIVE_CONTEXT_ID"));
        assertEquals(1, columnCount(
                "STAY_AGREED_AMOUNT_CORRECTIONS", "SENSITIVE_CONTEXT_ID"));
        assertEquals(1, columnCount(
                "STAY_PAYMENT_EDITS", "REGISTERED_AT"));
        assertEquals(1, columnCount(
                "STAY_PAYMENT_ANNULMENTS", "AMOUNT"));
    }

    @Test
    void v8DefinesFilterAndActivityOrderingIndexes() {
        for (String index : List.of(
                "IDX_SENSITIVE_STAY_CONTEXTS_STAY_ID",
                "IDX_SENSITIVE_STAY_CONTEXTS_OWNER_ID",
                "IDX_SENSITIVE_CONTEXT_CATS_CAT_ID",
                "IDX_STAY_PAYMENT_REMOVALS_REMOVED_AT",
                "IDX_NIGHTLY_RATE_CHANGES_ACTIVITY",
                "IDX_STAY_PRICING_DECISIONS_ACTIVITY",
                "IDX_STAY_CORRECTIONS_ACTIVITY",
                "IDX_STAY_PAYMENT_EDITS_ACTIVITY",
                "IDX_STAY_PAYMENT_ANNULMENTS_ACTIVITY")) {
            assertEquals(1, jdbc.queryForObject(
                    "select count(distinct index_name) from information_schema.index_columns where index_name = ?",
                    Integer.class, index));
        }
    }

    private int countTable(String table) {
        return jdbc.queryForObject(
                "select count(*) from information_schema.tables where table_name = ?",
                Integer.class, table);
    }

    private int columnCount(String table, String column) {
        return jdbc.queryForObject(
                "select count(*) from information_schema.columns where table_name = ? and column_name = ?",
                Integer.class, table, column);
    }

    private List<String> referencedTables(String table) {
        List<String> tables = new ArrayList<>();
        try (Connection connection = dataSource.getConnection();
             ResultSet keys = connection.getMetaData().getImportedKeys(
                     connection.getCatalog(), connection.getSchema(), table)) {
            while (keys.next()) {
                tables.add(keys.getString("PKTABLE_NAME"));
            }
        } catch (SQLException exception) {
            throw new AssertionError(exception);
        }
        return tables;
    }

    private void assertDecimal(
            String table, String column, int precision, int scale) {
        assertEquals(precision, jdbc.queryForObject(
                "select numeric_precision from information_schema.columns where table_name = ? and column_name = ?",
                Integer.class, table, column));
        assertEquals(scale, jdbc.queryForObject(
                "select numeric_scale from information_schema.columns where table_name = ? and column_name = ?",
                Integer.class, table, column));
    }
}
