package com.allegaeon.catworld.config;

import com.allegaeon.catworld.CatworldApplication;
import org.flywaydb.core.Flyway;
import org.flywaydb.core.api.FlywayException;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.junit.jupiter.api.io.TempDir;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.DriverManagerDataSource;
import org.springframework.boot.builder.SpringApplicationBuilder;

import javax.sql.DataSource;
import java.io.IOException;
import java.nio.ByteBuffer;
import java.nio.file.Files;
import java.nio.file.Path;
import java.sql.ResultSetMetaData;
import java.util.ArrayList;
import java.util.HexFormat;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@EnabledIfEnvironmentVariable(named = "CATWORLD_MIGRATION_MYSQL_URL", matches = ".+")
class PendingPriceMigrationMySqlIntegrationTest {

    @TempDir Path temporary;
    private JdbcTemplate administrator;
    private JdbcTemplate jdbc;
    private DataSource dataSource;
    private String schema;

    @BeforeEach
    void createIsolatedSchema() {
        String url = System.getenv("CATWORLD_MIGRATION_MYSQL_URL");
        String username = System.getenv("CATWORLD_MIGRATION_MYSQL_USERNAME");
        String password = System.getenv("CATWORLD_MIGRATION_MYSQL_PASSWORD");
        administrator = new JdbcTemplate(new DriverManagerDataSource(url, username, password));
        assertTrue(administrator.queryForObject("select version()", String.class).startsWith("8."));
        schema = "cw453_migration_" + UUID.randomUUID().toString().replace("-", "");
        administrator.execute("create database `" + schema + "`");
        int queryStart = url.indexOf('?');
        String address = queryStart < 0 ? url : url.substring(0, queryStart);
        String options = queryStart < 0 ? "" : url.substring(queryStart);
        String schemaUrl = address.substring(0, address.lastIndexOf('/') + 1) + schema + options;
        dataSource = new DriverManagerDataSource(schemaUrl, username, password);
        jdbc = new JdbcTemplate(dataSource);
    }

    @AfterEach
    void removeIsolatedSchema() {
        if (schema != null) {
            assertTrue(schema.matches("cw453_migration_[a-f0-9]{32}"));
            administrator.execute("drop database `" + schema + "`");
        }
    }

    @ParameterizedTest
    @CsvSource({
            "13, false, false",
            "14, true, false",
            "16, false, true",
            "16, false, false",
            "16, true, false",
            "17, false, true"
    })
    void upgradesPopulatedHistoricalSchemasWithoutChangingTheirData(
            String startingVersion, boolean hasPendingPriceMigration, boolean hasGalleryMigration) throws IOException {
        boolean originalIntake = "17".equals(startingVersion);
        List<String> omittedVersions = new ArrayList<>();
        if (!hasPendingPriceMigration) omittedVersions.add("14");
        if (!hasGalleryMigration) omittedVersions.add("15");
        if (originalIntake) omittedVersions.add("16");
        Path initial = migrationFiles("initial", omittedVersions.toArray(String[]::new));
        Flyway.configure().dataSource(dataSource).locations(location(initial)).target(startingVersion).load().migrate();
        populate("16".equals(startingVersion), hasPendingPriceMigration);
        Map<String, List<String>> before = dataSnapshot();
        List<Map<String, Object>> historyBefore = history();
        Map<String, List<String>> deceasedBefore = deceasedSnapshot();
        Flyway candidate = Flyway.configure().dataSource(dataSource).load();

        if ("16".equals(startingVersion) || originalIntake) {
            try (var application = new SpringApplicationBuilder(CatworldApplication.class).run(
                    "--server.address=127.0.0.1", "--server.port=0",
                    "--spring.datasource.url=" + ((DriverManagerDataSource) dataSource).getUrl(),
                    "--spring.datasource.username=" + System.getenv("CATWORLD_MIGRATION_MYSQL_USERNAME"),
                    "--spring.datasource.password=" + System.getenv("CATWORLD_MIGRATION_MYSQL_PASSWORD"),
                    "--spring.datasource.driver-class-name=com.mysql.cj.jdbc.Driver",
                    "--spring.jpa.hibernate.ddl-auto=validate", "--spring.flyway.enabled=true",
                    "--catworld.security.username=fictional-admin",
                    "--catworld.security.password=fictional-password",
                    "--catworld.security.cors-allowed-origins=http://localhost:4200")) {
                assertTrue(application.isActive());
                assertNotNull(application.getBean(HistoricalMigrationConfig.class));
            }
        } else {
            HistoricalMigrationConfig.migrate(candidate);
        }

        assertEquals(before, dataSnapshot());
        assertTrue(history().containsAll(historyBefore));
        assertEquals(1, jdbc.queryForObject(
                "select count(*) from flyway_schema_history where version = '14' and success = 1", Integer.class));
        assertEquals(1, jdbc.queryForObject(
                "select count(*) from flyway_schema_history where version = '15' and success = 1", Integer.class));
        assertEquals(1, jdbc.queryForObject(
                "select count(*) from flyway_schema_history where version = '16' and success = 1", Integer.class));
        assertEquals(1, jdbc.queryForObject(
                "select count(*) from flyway_schema_history where version = '17' and success = 1", Integer.class));
        assertEquals("YES", jdbc.queryForObject("""
                select is_nullable from information_schema.columns
                where table_schema = database() and table_name = 'stay_agreed_amount_corrections'
                  and column_name = 'new_agreed_amount'
                """, String.class));
        if ("16".equals(startingVersion)) {
            assertEquals(deceasedBefore, deceasedSnapshot());
            assertEquals(!hasGalleryMigration, installedRank("15") > installedRank("16"));
            if (!hasPendingPriceMigration) {
                assertTrue(installedRank("14") > installedRank("16"));
            }
        } else {
            assertEquals(0, jdbc.queryForObject("select count(*) from cats where deceased = true", Integer.class));
        }
        if (!hasGalleryMigration) {
            assertTrue(installedRank("14") < installedRank("15"));
        }
        assertTrue(installedRank("15") < installedRank("17"));
        if (originalIntake) {
            assertTrue(installedRank("14") > installedRank("17"));
            assertTrue(installedRank("16") > installedRank("14"));
        }
        assertEquals(hasPendingPriceMigration ? 1 : 0,
                jdbc.queryForObject("select count(*) from stays where price_pending = true", Integer.class));
        jdbc.update("""
                insert into cat_informational_photos (id, cat_id, created_at, content)
                values (?, ?, '2026-11-10 12:30:00', X'FFD8FFD9')
                """, id(51), id(4));

        jdbc.update("update stays set agreed_amount = null, price_pending = true where id = ?", id(7));
        jdbc.update("""
                insert into stay_agreed_amount_corrections
                    (id, stay_id, previous_agreed_amount, new_agreed_amount, decided_by_id, decided_at, reason)
                values (?, ?, 400, null, ?, '2026-11-10 12:30:00', 'Price to be confirmed')
                """, id(50), id(7), id(1));
        assertEquals(3, jdbc.queryForObject("select count(*) from stay_payments where stay_id = ?",
                Integer.class, id(7)));
        assertNull(jdbc.queryForObject("select agreed_amount from stays where id = ?", String.class, id(7)));
        assertEquals("0", jdbc.queryForObject("select agreed_amount from stays where id = ?",
                String.class, id(8)));

        List<Map<String, Object>> migratedHistory = history();
        Map<String, List<String>> migratedData = dataSnapshot();
        HistoricalMigrationConfig.migrate(Flyway.configure().dataSource(dataSource).load());
        assertEquals(migratedHistory, history());
        assertEquals(migratedData, dataSnapshot());
        assertEquals("FFD8FFD9", jdbc.queryForObject(
                "select hex(content) from cat_informational_photos where id = ?", String.class, id(51)));
        candidate.validate();
    }

    @ParameterizedTest
    @ValueSource(strings = {"12", "16", "17"})
    void rejectsAnAppliedChecksumMismatchBeforeApplyingLateMigrations(String changedVersion) throws IOException {
        boolean originalIntake = "17".equals(changedVersion);
        Path initial = migrationFiles("initial", "14", originalIntake ? "16" : "15");
        Flyway.configure().dataSource(dataSource).locations(location(initial))
                .target(originalIntake ? "17" : "16").load().migrate();
        populate(!originalIntake, false);
        Map<String, List<String>> before = dataSnapshot();
        List<Map<String, Object>> historyBefore = history();
        Path altered = migrationFiles("altered");
        try (var scripts = Files.list(altered)) {
            Path script = scripts.filter(path -> path.getFileName().toString().startsWith("V" + changedVersion + "__"))
                    .findFirst().orElseThrow();
            Files.writeString(script, Files.readString(script) + "\nSELECT 'changed applied migration';\n");
        }

        var failure = assertThrows(FlywayException.class, () -> HistoricalMigrationConfig.migrate(
                Flyway.configure().dataSource(dataSource).locations(location(altered)).load()));

        assertTrue(failure.getMessage().contains("Migration checksum mismatch for migration version " + changedVersion));
        assertEquals(before, dataSnapshot());
        assertEquals(historyBefore, history());
        assertEquals(0, jdbc.queryForObject("""
                select count(*) from information_schema.columns
                where table_schema = database() and table_name = 'stays' and column_name = 'price_pending'
                """, Integer.class));
        assertEquals(originalIntake ? 1 : 0, jdbc.queryForObject("""
                select count(*) from information_schema.tables
                where table_schema = database() and table_name = 'cat_informational_photos'
                """, Integer.class));
    }

    @Test
    void rejectsLateV16OutsideThePublishedV17History() throws IOException {
        Flyway.configure().dataSource(dataSource).locations(location(migrationFiles("initial", "16")))
                .target("17").load().migrate();
        var before = history();

        assertThrows(FlywayException.class, () -> HistoricalMigrationConfig.migrate(
                Flyway.configure().dataSource(dataSource).load()));
        assertEquals(before, history());
    }

    @Test
    void resumesThePublishedV17UpgradeAfterLateV14() throws IOException {
        Flyway.configure().dataSource(dataSource).locations(location(migrationFiles("initial", "14", "16")))
                .target("17").load().migrate();
        Flyway.configure().dataSource(dataSource).outOfOrder(true).target("14").load().migrate();
        var before = history();

        HistoricalMigrationConfig.migrate(Flyway.configure().dataSource(dataSource).load());

        assertTrue(history().containsAll(before));
        assertEquals(16, installedRank("14"));
        assertEquals(17, installedRank("16"));
    }

    @Test
    void rejectsAnUnexpectedV16ScriptEvenInThePublishedV17History() throws IOException {
        Flyway.configure().dataSource(dataSource).locations(location(migrationFiles("initial", "14", "16")))
                .target("17").load().migrate();
        var before = history();
        Path altered = migrationFiles("altered", "16");
        Files.writeString(altered.resolve("V16__unapproved_migration.sql"), "CREATE TABLE unexpected (id INT);");

        assertThrows(FlywayException.class, () -> HistoricalMigrationConfig.migrate(
                Flyway.configure().dataSource(dataSource).locations(location(altered)).load()));
        assertEquals(before, history());
    }

    @Test
    void rejectsAnotherIgnoredVersionInsteadOfEnablingGeneralOutOfOrderMigration() throws IOException {
        Flyway.configure().dataSource(dataSource).locations(location(migrationFiles("initial", "14", "15")))
                .target("16").load().migrate();
        List<Map<String, Object>> historyBefore = history();
        Path extra = migrationFiles("extra");
        Files.writeString(extra.resolve("V14_1__unapproved_migration.sql"), "CREATE TABLE unexpected (id INT);");
        assertThrows(FlywayException.class, () -> HistoricalMigrationConfig.migrate(
                Flyway.configure().dataSource(dataSource).locations(location(extra)).load()));
        assertEquals(historyBefore, history());
        assertEquals(0, jdbc.queryForObject("""
                select count(*) from information_schema.tables
                where table_schema = database() and table_name = 'unexpected'
                """, Integer.class));
    }

    private Path migrationFiles(String name, String... omittedVersions) throws IOException {
        Path directory = Files.createDirectory(temporary.resolve(name));
        var omitted = Set.of(omittedVersions);
        try (var scripts = Files.list(Path.of("src/main/resources/db/migration"))) {
            for (Path script : scripts.toList()) {
                String filename = script.getFileName().toString();
                if (filename.endsWith(".sql")
                        && omitted.stream().noneMatch(version -> filename.startsWith("V" + version + "__"))) {
                    Files.copy(script, directory.resolve(filename));
                }
            }
        }
        return directory;
    }

    private int installedRank(String version) {
        return jdbc.queryForObject(
                "select installed_rank from flyway_schema_history where version = ?", Integer.class, version);
    }

    private String location(Path path) {
        return "filesystem:" + path.toAbsolutePath().toString().replace('\\', '/');
    }

    private List<Map<String, Object>> history() {
        return jdbc.queryForList("""
                select installed_rank, version, description, type, script, checksum, installed_by,
                       installed_on, execution_time, success
                from flyway_schema_history order by installed_rank
                """);
    }

    private Map<String, List<String>> deceasedSnapshot() {
        if (jdbc.queryForObject("""
                select count(*) from information_schema.columns
                where table_schema = database() and table_name = 'cats' and column_name = 'deceased'
                """, Integer.class) == 0) {
            return Map.of();
        }
        return Map.of("owners", jdbc.queryForList("select concat(hex(id), ':', deceased) from owners order by id", String.class),
                "cats", jdbc.queryForList("select concat(hex(id), ':', deceased) from cats order by id", String.class));
    }

    private Map<String, List<String>> dataSnapshot() {
        Map<String, List<String>> result = new LinkedHashMap<>();
        for (String table : List.of("user_accounts", "owners", "vets", "cats", "stays", "stay_cat",
                "nightly_reference_rates", "stay_pricing_decisions", "stay_agreed_amount_corrections",
                "stay_payments", "stay_payment_annulments", "sensitive_stay_contexts", "sensitive_stay_context_cats")) {
            result.put(table, jdbc.query("select * from " + table, (row, index) -> {
                ResultSetMetaData columns = row.getMetaData();
                List<String> values = new ArrayList<>();
                for (int column = 1; column <= columns.getColumnCount(); column++) {
                    String name = columns.getColumnName(column);
                    if ("price_pending".equals(name) || "deceased".equals(name)) continue;
                    Object value = row.getObject(column);
                    values.add(name + "=" + (value instanceof byte[] bytes
                            ? HexFormat.of().formatHex(bytes) : Objects.toString(value, "null")));
                }
                return String.join("|", values);
            }).stream().sorted().toList());
        }
        return result;
    }

    private void populate(boolean deceased, boolean pending) {
        jdbc.update("""
                insert into user_accounts(id, username, password_hash, role, enabled, created_at, updated_at)
                values (?, 'fictional-admin', 'unused', 'ADMIN', true, '2026-11-10 12:00:00', '2026-11-10 12:00:00')
                """, id(1));
        for (int number = 2; number <= 3; number++) {
            jdbc.update("""
                    insert into owners(id, full_name, primary_phone, created_by_id, created_at, updated_at)
                    values (?, ?, '555-0100', ?, '2026-11-10 12:00:00', '2026-11-10 12:00:00')
                    """, id(number), "Fictional owner " + number, id(1));
        }
        jdbc.update("""
                insert into vets(id, name, created_by_id, created_at, updated_at)
                values (?, 'Fictional veterinarian', ?, '2026-11-10 12:00:00', '2026-11-10 12:00:00')
                """, id(10), id(1));
        for (int number = 4; number <= 6; number++) {
            jdbc.update("""
                    insert into cats(id, name, birth_date, sex, owner_id, vet_id, created_by_id, created_at, updated_at)
                    values (?, ?, '2020-01-01', 'FEMALE', ?, ?, ?, '2026-11-10 12:00:00', '2026-11-10 12:00:00')
                    """, id(number), "Fictional cat " + number, id(number == 6 ? 3 : 2), id(10), id(1));
        }
        for (int number = 7; number <= 9; number++) {
            Integer agreement = switch (number) {
                case 7 -> 400;
                case 8 -> 0;
                default -> null;
            };
            jdbc.update("""
                    insert into stays(id, owner_id, created_by_id, start_at, end_at, retained_nightly_rate,
                                      agreed_amount, created_at, updated_at)
                    values (?, ?, ?, '2026-11-11 10:00:00', '2026-11-13 10:00:00', 100, ?,
                            '2026-11-10 12:00:00', '2026-11-10 12:00:00')
                    """, id(number), id(number == 8 ? 3 : 2), id(1), agreement);
        }
        jdbc.update("insert into stay_cat values (?, ?), (?, ?), (?, ?)",
                id(7), id(4), id(7), id(5), id(8), id(6));
        jdbc.update("update nightly_reference_rates set nightly_rate = 9000 where category = 'ONE_CAT'");
        jdbc.update("""
                insert into sensitive_stay_contexts
                    (id, stay_id, owner_id, owner_full_name, stay_start_at, stay_end_at)
                values (?, ?, ?, 'Fictional owner 2', '2026-11-11 10:00:00', '2026-11-13 10:00:00')
                """, id(20), id(7), id(2));
        jdbc.update("insert into sensitive_stay_context_cats values (?, ?, 'Fictional cat 4'), (?, ?, 'Fictional cat 5')",
                id(20), id(4), id(20), id(5));
        jdbc.update("""
                insert into stay_agreed_amount_corrections
                    (id, stay_id, previous_agreed_amount, new_agreed_amount, decided_by_id, decided_at, reason, sensitive_context_id)
                values (?, ?, 350, 400, ?, '2026-11-10 12:15:00', 'Fictional correction', ?)
                """, id(30), id(7), id(1), id(20));
        jdbc.update("""
                insert into stay_pricing_decisions
                    (id, stay_id, retained_nightly_rate, new_number_of_nights, new_agreed_amount, decided_by_id, decided_at)
                values (?, ?, 100, 2, 350, ?, '2026-11-10 12:00:00')
                """, id(31), id(7), id(1));
        for (int number = 40; number <= 42; number++) {
            jdbc.update("""
                    insert into stay_payments
                        (id, stay_id, amount, payment_date, note, annulled, registered_by_id, created_at, updated_at)
                    values (?, ?, ?, '2026-11-10', 'Fictional instalment', ?, ?,
                            '2026-11-10 12:00:00', '2026-11-10 12:00:00')
                    """, id(number), id(7), number == 40 ? 100 : 25, number == 42, id(1));
        }
        jdbc.update("""
                insert into stay_payment_annulments(id, stay_id, payment_id, annulled_by_id, annulled_at, reason)
                values (?, ?, ?, ?, '2026-11-10 12:20:00', 'Fictional duplicate')
                """, id(43), id(7), id(42), id(1));
        if (deceased) {
            jdbc.update("update owners set deceased = true where id = ?", id(2));
            jdbc.update("update cats set deceased = true where id = ?", id(4));
        }
        if (pending) {
            jdbc.update("update stays set agreed_amount = null, price_pending = true where id = ?", id(9));
        }
    }

    private byte[] id(int number) {
        return ByteBuffer.allocate(16).putLong(0).putLong(number).array();
    }
}
