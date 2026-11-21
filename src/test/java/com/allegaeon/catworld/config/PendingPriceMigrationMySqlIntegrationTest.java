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
import org.springframework.dao.DataAccessException;
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
import java.util.HashSet;
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
    private static final Map<String, Set<String>> LITTER_PRICING_COLUMNS = Map.of(
            "stays", Set.of("retained_litter_rate_per_kg"),
            "stay_cat", Set.of("litter_choice"),
            "stay_pricing_decisions", Set.of("litter_rate_per_kg", "litter_daily_half_kilos", "litter_choices"),
            "stay_agreed_amount_corrections", Set.of("litter_rate_per_kg", "litter_choices"));

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
        String isolatedSchema = "cw453_migration_" + UUID.randomUUID().toString().replace("-", "");
        administrator.execute("create database `" + isolatedSchema + "`");
        schema = isolatedSchema;
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

        // Profile and litter pricing additions have their initialization checked separately.
        assertEquals(before, dataSnapshot(LITTER_PRICING_COLUMNS,
                "food_brand_id", "food_detail", "birth_year", "care_instructions",
                "breed_option_id", "coat_option_id", "color_option_id",
                "last_internal_dewormer_option_id", "last_external_dewormer_option_id", "food_variety_id",
                "litter_preference", "litter_detail", "litter_detail_option_id"));
        assertEquals(0, jdbc.queryForObject("""
                select count(*) from cats where food_brand_id is not null or food_detail is not null
                """, Integer.class), "V23 must leave food brand references and diet details unset for historical cats");
        assertNewProfileFieldsUnset();
        assertHistoricalLitterDefaults();
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

    @Test
    void upgradesAnAgreedAndPaidMultiCatStayThroughV28() {
        Flyway.configure().dataSource(dataSource).target("26.1").load().migrate();
        populate(false, false);
        jdbc.update("update cats set litter_brand = 'Usa las de CatWorld' where id = ?", id(4));
        var before = dataSnapshot();
        var historyBefore = history();

        Flyway candidate = Flyway.configure().dataSource(dataSource).target("27").load();
        HistoricalMigrationConfig.migrate(candidate);

        assertEquals(before, dataSnapshot(LITTER_PRICING_COLUMNS,
                "litter_preference", "litter_detail", "litter_detail_option_id"));
        assertTrue(history().containsAll(historyBefore));
        assertEquals(1, jdbc.queryForObject(
                "select count(*) from flyway_schema_history where version = '27' and success = 1", Integer.class));
        assertHistoricalLitterDefaults();
        assertEquals(List.of("OWN", "OWN"), jdbc.queryForList(
                "select litter_choice from stay_cat where stay_id = ?", String.class, id(7)));
        candidate.validate();

        jdbc.update("update stays set price_pending = true where id = ?", id(9));
        jdbc.update("insert into stay_cat (stay_id, cat_id, litter_choice) values (?, ?, 'OWN'), (?, ?, 'HALF')",
                id(9), id(4), id(9), id(5));
        jdbc.update("update stays set agreed_amount = null, price_pending = true where id = ?", id(8));
        jdbc.update("""
                insert into stay_agreed_amount_corrections
                    (id, stay_id, previous_agreed_amount, new_agreed_amount, decided_by_id, decided_at, reason)
                values (?, ?, 0, null, ?, '2026-11-10 13:00:00', 'Reopened')
                """, id(32), id(8), id(1));
        jdbc.update("update stay_cat set litter_choice = 'ONE' where stay_id = ? and cat_id = ?", id(7), id(5));
        jdbc.update("update stays set retained_litter_rate_per_kg = 4000 where id = ?", id(7));
        var beforeV28 = dataSnapshot(LITTER_PRICING_COLUMNS);

        HistoricalMigrationConfig.migrate(Flyway.configure().dataSource(dataSource).load());

        assertEquals(beforeV28, dataSnapshot(LITTER_PRICING_COLUMNS));
        assertNull(jdbc.queryForObject("select litter_choice from stay_cat where stay_id = ? and cat_id = ?",
                String.class, id(9), id(4)));
        assertEquals("HALF", jdbc.queryForObject("select litter_choice from stay_cat where stay_id = ? and cat_id = ?",
                String.class, id(9), id(5)));
        assertNull(jdbc.queryForObject("select retained_litter_rate_per_kg from stays where id = ?", String.class, id(9)));
        assertEquals("OWN", jdbc.queryForObject("select litter_choice from stay_cat where stay_id = ?", String.class, id(8)));
        assertEquals(List.of("OWN", "ONE"), jdbc.queryForList(
                "select litter_choice from stay_cat where stay_id = ? order by cat_id", String.class, id(7)));
        assertEquals("4000", jdbc.queryForObject(
                "select retained_litter_rate_per_kg from stays where id = ?", String.class, id(7)));
        assertEquals("400", jdbc.queryForObject(
                "select agreed_amount from stays where id = ? and not price_pending", String.class, id(7)));
        assertEquals("125", jdbc.queryForObject(
                "select sum(amount) from stay_payments where stay_id = ? and not annulled", String.class, id(7)));
    }

    @Test
    void preservesExactBirthDatesAndEnforcesPrecisionWhenUpgradingV23() {
        Flyway.configure().dataSource(dataSource).target("23").load().migrate();
        populate(false, false);
        Flyway.configure().dataSource(dataSource).target("24").load().migrate();

        assertEquals("2020-01-01", jdbc.queryForObject("select birth_date from cats where id = ?", String.class, id(4)));
        assertNull(jdbc.queryForObject("select birth_year from cats where id = ?", Integer.class, id(4)));
        assertNull(jdbc.queryForObject("select care_instructions from cats where id = ?", String.class, id(4)));
        var missing = assertThrows(DataAccessException.class,
                () -> jdbc.update("update cats set birth_date = null where id = ?", id(4)));
        assertTrue(missing.getMessage().contains("chk_cats_birth_precision"));
        var both = assertThrows(DataAccessException.class,
                () -> jdbc.update("update cats set birth_year = 2020 where id = ?", id(4)));
        assertTrue(both.getMessage().contains("chk_cats_birth_precision"));
        jdbc.update("update cats set birth_date = null, birth_year = 2020 where id = ?", id(4));
        assertNull(jdbc.queryForObject("select birth_date from cats where id = ?", String.class, id(4)));
        assertEquals(2020, jdbc.queryForObject("select birth_year from cats where id = ?", Integer.class, id(4)));
    }

    @Test
    void preservesPopulatedHouseholdDataWhenUpgradingV23() {
        Flyway.configure().dataSource(dataSource).target("23").load().migrate();
        populate(false, false);
        jdbc.update("""
                insert into food_brands (id, name, normalized_key)
                values (?, 'Fictional approved brand', cast('fictional approved brand' as binary))
                """, id(60));
        jdbc.update("""
                update cats
                set food_brand_id = ?, food_brand = 'Fictional approved brand', food_detail = 'Fictional diet',
                    breed = 'Fictional breed', coat = 'Fictional coat', color = 'Fictional color',
                    last_internal_dewormer_name = 'Fictional internal treatment',
                    last_external_dewormer_name = 'Fictional external treatment'
                where id = ?
                """, id(60), id(4));
        jdbc.update("""
                insert into cat_intake_invitations
                    (id, owner_id, token_hash, allow_new_cats, scope_snapshot, requested_fields_snapshot, expires_at)
                values (?, ?, ?, true, ?, ?, '2026-11-17 12:00:00')
                """, id(61), id(2), "a".repeat(64),
                """
                {"00000000-0000-0000-0000-000000000004":{"birthDate":"2020-01-01"},
                 "00000000-0000-0000-0000-000000000005":{"birthDate":"2020-01-01"}}
                """.strip(),
                """
                {"00000000-0000-0000-0000-000000000004":["lastRabiesDate"],
                 "00000000-0000-0000-0000-000000000005":["litterBrand"]}
                """.strip());
        jdbc.update("""
                insert into cat_intake_reviews
                    (id, invitation_id, cat_id, cat_name, original_fields, proposed_fields,
                     submitted_at, approved_at, revision)
                values (?, ?, ?, 'Fictional cat 4', '{"birthDate":"2020-01-01"}',
                        '{"birthDate":"2020-02-20","lastRabiesDate":"2026-11-10"}',
                        '2026-11-10 13:00:00', null, 2),
                       (?, ?, ?, 'Fictional cat 5', '{}', '{"litterBrand":"Fictional approved litter"}',
                        '2026-11-10 14:00:00', '2026-11-10 15:00:00', 1)
                """, id(62), id(61), id(4), id(63), id(61), id(5));
        jdbc.update("""
                insert into cat_intake_photos (id, review_id, content)
                values (?, ?, X'FFD8FFE1FFD9')
                """, id(64), id(62));
        jdbc.update("""
                insert into cat_informational_photos (id, cat_id, created_at, content)
                values (?, ?, '2026-11-10 12:30:00', X'FFD8FFE0FFD9')
                """, id(65), id(4));

        var dataBefore = dataSnapshot();
        var householdBefore = householdSnapshot();
        var historyBefore = history();
        Flyway candidate = Flyway.configure().dataSource(dataSource).target("26").load();
        HistoricalMigrationConfig.migrate(candidate);

        assertEquals(dataBefore, dataSnapshot("birth_year", "care_instructions", "breed_option_id",
                "coat_option_id", "color_option_id", "last_internal_dewormer_option_id",
                "last_external_dewormer_option_id"));
        assertNewProfileFieldsUnset();
        assertEquals(householdBefore, householdSnapshot("dismissed_at"));
        assertEquals(0, jdbc.queryForObject(
                "select count(*) from cat_intake_reviews where dismissed_at is not null", Integer.class));
        assertEquals(0, jdbc.queryForObject("select count(*) from cat_profile_options", Integer.class));
        assertEquals(historyBefore, history().subList(0, historyBefore.size()));
        assertEquals("26", candidate.info().current().getVersion().getVersion());
        candidate.validate();

        var catsBeforeVarieties = dataSnapshot();
        var reviewsBeforeVarieties = householdSnapshot();
        Flyway withVarieties = Flyway.configure().dataSource(dataSource).target("26.1").load();
        HistoricalMigrationConfig.migrate(withVarieties);
        assertEquals("26.1", withVarieties.info().current().getVersion().getVersion());
        assertEquals(catsBeforeVarieties, dataSnapshot("food_variety_id"));
        assertEquals(reviewsBeforeVarieties, householdSnapshot("proposed_option_ids", "proposed_food_detail_brand"));
        assertEquals(0, jdbc.queryForObject("select count(*) from food_varieties", Integer.class));
        assertNull(jdbc.queryForObject("select food_variety_id from cats where id = ?", byte[].class, id(4)));
        assertNull(jdbc.queryForObject("select proposed_option_ids from cat_intake_reviews where id = ?",
                String.class, id(62)));

        jdbc.update("""
                insert into food_brands (id, name, normalized_key)
                values (?, 'Another brand', cast('another brand' as binary))
                """, id(67));
        jdbc.update("""
                insert into food_varieties (id, brand_id, name, normalized_key)
                values (?, ?, 'Another variety', cast('another variety' as binary))
                """, id(68), id(67));
        assertThrows(DataAccessException.class,
                () -> jdbc.update("update cats set food_variety_id = ? where id = ?", id(68), id(4)));
        assertThrows(DataAccessException.class,
                () -> jdbc.update("update cats set food_brand_id = null, food_variety_id = ? where id = ?", id(68), id(4)));
        withVarieties.validate();

        jdbc.update("""
                insert into cat_profile_options (id, category, name, normalized_key)
                values (?, 'breed', '  COMUN  ', X'636F6D756E')
                """, id(69));
        jdbc.update("update cats set breed_option_id = ? where id = ?", id(69), id(4));
        var catsBeforeBreeds = dataSnapshot();
        var reviewsBeforeBreeds = householdSnapshot();
        Flyway withBreeds = Flyway.configure().dataSource(dataSource).target("26.2").load();
        HistoricalMigrationConfig.migrate(withBreeds);
        assertEquals("26.2", withBreeds.info().current().getVersion().getVersion());
        assertEquals(Set.of("  COMUN  ", "Siamés", "Persa"), new HashSet<>(jdbc.queryForList(
                "select name from cat_profile_options where category = 'breed'", String.class)));
        assertArrayEquals(HexFormat.of().parseHex("7369616dc3a973"), jdbc.queryForObject(
                "select normalized_key from cat_profile_options where id = ?", byte[].class,
                HexFormat.of().parseHex("d58827db0efe488f84b393e7ad1d9a8a")));
        assertEquals(catsBeforeBreeds, dataSnapshot());
        assertEquals(reviewsBeforeBreeds, householdSnapshot());
        assertArrayEquals(id(69), jdbc.queryForObject("select breed_option_id from cats where id = ?",
                byte[].class, id(4)));
        withBreeds.validate();
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

    @ParameterizedTest
    @CsvSource({"true, true, true", "true, true, false", "true, false, false", "false, true, true"})
    void accommodatesCatalogsAndLitterPricingInEitherOrder(
            boolean pricingFirst, boolean breedSeedsPresent, boolean catalogManagerPresent)
            throws IOException {
        var initial = catalogMigrationFiles("catalog-initial", catalogManagerPresent, !pricingFirst,
                breedSeedsPresent, pricingFirst);
        var initialFlyway = Flyway.configure().dataSource(dataSource).locations(location(initial));
        if (pricingFirst && !breedSeedsPresent) initialFlyway.target("27");
        initialFlyway.load().migrate();
        populate(false, false);
        var dataBefore = dataSnapshot("litter_preference", "litter_detail", "litter_detail_option_id");
        var historyBefore = history();

        var combined = catalogMigrationFiles("catalog-combined", true, true, true, true);
        var startup = Flyway.configure().dataSource(dataSource).locations(location(combined)).load();
        HistoricalMigrationConfig.migrate(startup);

        for (String table : List.of("cat_profile_options", "food_brands", "food_varieties")) {
            assertEquals(1, jdbc.queryForObject("""
                    select count(*) from information_schema.columns
                    where table_schema = database() and table_name = ? and column_name = 'active'
                    """, Integer.class, table));
        }
        assertEquals(dataBefore, dataSnapshot("litter_preference", "litter_detail", "litter_detail_option_id"));
        assertEquals(0, jdbc.queryForObject("""
                select count(*) from cats
                where litter_preference is not null or litter_detail is not null or litter_detail_option_id is not null
                """, Integer.class));
        assertThrows(DataAccessException.class, () -> jdbc.update(
                "update cats set litter_preference = 'SHARED', litter_detail = 'Pellets' where id = ?", id(4)));
        assertTrue(history().containsAll(historyBefore));
        assertEquals(pricingFirst && !catalogManagerPresent, installedRank("27") < installedRank("26.3"));
        assertEquals(pricingFirst, installedRank("27") < installedRank("26.4"));
        assertTrue(installedRank("26.2") < installedRank("26.3"));
        assertTrue(installedRank("26.3") < installedRank("26.4"));
        assertTrue(installedRank("27") < installedRank("28"));
        startup.validate();
    }

    @Test
    void rejectsPricingChecksumMismatchBeforeRunningLateCatalogMigration() throws IOException {
        var initial = catalogMigrationFiles("catalog-initial", false, false, true, true);
        Flyway.configure().dataSource(dataSource).locations(location(initial)).load().migrate();
        var historyBefore = history();

        var combined = catalogMigrationFiles("catalog-combined", true, true, true, true);
        Files.writeString(combined.resolve("V27__add_stay_litter_pricing.sql"), "SELECT 'bad checksum';");
        var startup = Flyway.configure().dataSource(dataSource).locations(location(combined)).load();
        assertThrows(FlywayException.class, () -> HistoricalMigrationConfig.migrate(startup));

        assertEquals(historyBefore, history());
    }

    private Path catalogMigrationFiles(String name, boolean catalogs, boolean ownLitter, boolean breeds, boolean pricing)
            throws IOException {
        var directory = migrationFiles(name, "26_2", "26_3", "26_4", "27", "28");
        if (catalogs) {
            String script = "V26_3__manage_cat_profile_catalogs.sql";
            Files.copy(Path.of("src/main/resources/db/migration").resolve(script), directory.resolve(script));
        }
        if (ownLitter) {
            String script = "V26_4__add_own_litter_catalog.sql";
            Files.copy(Path.of("src/main/resources/db/migration").resolve(script), directory.resolve(script));
        }
        if (breeds) {
            Files.writeString(directory.resolve("V26_2__seed_common_breeds.sql"), "SELECT 'breed seed fixture';");
        }
        if (pricing) {
            Files.writeString(directory.resolve("V27__add_stay_litter_pricing.sql"), "SELECT 'pricing fixture';");
            Files.writeString(directory.resolve("V28__allow_unconfirmed_stay_litter.sql"), "SELECT 'pricing follow-up fixture';");
        }
        return directory;
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

    private Map<String, List<String>> householdSnapshot(String... excludedReviewColumns) {
        return Map.of(
                "food_brands", snapshotRows("food_brands", Set.of()),
                "cat_intake_invitations", snapshotRows("cat_intake_invitations", Set.of()),
                "cat_intake_reviews", snapshotRows("cat_intake_reviews", Set.of(excludedReviewColumns)),
                "cat_intake_photos", snapshotRows("cat_intake_photos", Set.of()),
                "cat_informational_photos", snapshotRows("cat_informational_photos", Set.of()));
    }

    private void assertNewProfileFieldsUnset() {
        assertEquals(0, jdbc.queryForObject("""
                select count(*) from cats where birth_year is not null or care_instructions is not null
                """, Integer.class), "V24 must preserve exact dates and leave care instructions unset for historical cats");
        assertEquals(0, jdbc.queryForObject("""
                select count(*) from cats
                where breed_option_id is not null or coat_option_id is not null or color_option_id is not null
                   or last_internal_dewormer_option_id is not null or last_external_dewormer_option_id is not null
                """, Integer.class), "V25 must leave option references unset for historical cats");
    }

    private void assertHistoricalLitterDefaults() {
        assertNull(jdbc.queryForObject("select litter_rate_per_kg from litter_rates where id = 1", String.class));
        assertEquals(0, jdbc.queryForObject(
                "select count(*) from stays where retained_litter_rate_per_kg is not null", Integer.class));
        assertEquals(0, jdbc.queryForObject(
                "select count(*) from stay_cat where litter_choice is null or litter_choice <> 'OWN'", Integer.class));
        assertEquals(0, jdbc.queryForObject("""
                select count(*) from stay_pricing_decisions
                where litter_rate_per_kg is not null or litter_daily_half_kilos <> 0 or litter_choices is not null
                """, Integer.class));
        assertEquals(0, jdbc.queryForObject("""
                select count(*) from stay_agreed_amount_corrections
                where litter_rate_per_kg is not null or litter_choices is not null
                """, Integer.class));
    }

    private Map<String, List<String>> dataSnapshot(String... excludedCatColumns) {
        return dataSnapshot(Map.of(), excludedCatColumns);
    }

    private Map<String, List<String>> dataSnapshot(Map<String, Set<String>> excludedNewColumns,
                                                  String... excludedCatColumns) {
        Set<String> excludedCatColumnNames = new HashSet<>(List.of(excludedCatColumns));
        excludedCatColumnNames.add("deceased");
        Map<String, List<String>> result = new LinkedHashMap<>();
        for (String table : List.of("user_accounts", "owners", "vets", "cats", "stays", "stay_cat",
                "nightly_reference_rates", "stay_pricing_decisions", "stay_agreed_amount_corrections",
                "stay_payments", "stay_payment_annulments", "sensitive_stay_contexts", "sensitive_stay_context_cats")) {
            Set<String> excludedColumns = new HashSet<>(switch (table) {
                case "cats" -> excludedCatColumnNames;
                case "owners" -> Set.of("deceased");
                case "stays" -> Set.of("price_pending");
                default -> Set.of();
            });
            excludedColumns.addAll(excludedNewColumns.getOrDefault(table, Set.of()));
            result.put(table, snapshotRows(table, excludedColumns));
        }
        return result;
    }

    private List<String> snapshotRows(String table, Set<String> excludedColumns) {
        return jdbc.query("select * from " + table, (row, index) -> {
            ResultSetMetaData columns = row.getMetaData();
            List<String> values = new ArrayList<>();
            for (int column = 1; column <= columns.getColumnCount(); column++) {
                String name = columns.getColumnName(column);
                if (excludedColumns.contains(name)) continue;
                Object value = row.getObject(column);
                values.add(name + "=" + (value instanceof byte[] bytes
                        ? HexFormat.of().formatHex(bytes) : Objects.toString(value, "null")));
            }
            return String.join("|", values);
        }).stream().sorted().toList();
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
                    insert into cats(id, name, birth_date, sex, food_brand, litter_brand, notes,
                                     owner_id, vet_id, created_by_id, created_at, updated_at)
                    values (?, ?, '2020-01-01', 'FEMALE', ?, ?, ?, ?, ?, ?,
                            '2026-11-10 12:00:00', '2026-11-10 12:00:00')
                    """, id(number), "Fictional cat " + number, "Fictional food " + number,
                    "Fictional litter " + number, "Fictional cat notes " + number, id(number == 6 ? 3 : 2), id(10), id(1));
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
