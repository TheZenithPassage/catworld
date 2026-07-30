package com.allegaeon.catworld.repository;

import com.allegaeon.catworld.security.UserAccountBootstrap;
import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import org.flywaydb.core.Flyway;
import org.flywaydb.core.api.MigrationVersion;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.ApplicationContextInitializer;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.core.io.ClassPathResource;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.SingleConnectionDataSource;
import org.springframework.jdbc.datasource.init.ResourceDatabasePopulator;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

import java.nio.ByteBuffer;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.Set;
import java.util.UUID;

import javax.sql.DataSource;

import static org.junit.jupiter.api.Assertions.assertEquals;

@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:rate_migration_context;DB_CLOSE_DELAY=-1;MODE=MySQL",
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
@ContextConfiguration(initializers = NightlyReferenceRateMigrationTest.LatestSchemaInitializer.class)
class NightlyReferenceRateMigrationTest {

    @Autowired
    private JdbcTemplate migratedJdbcTemplate;

    @MockitoBean
    private UserAccountBootstrap userAccountBootstrap;

    @Test
    void latestMigrationSeedsOnlyThreeUnavailableCategoriesAndValidatesMappings() {
        assertEquals(
                3,
                migratedJdbcTemplate.queryForObject(
                        "select count(*) from nightly_reference_rates",
                        Integer.class
                )
        );
        assertEquals(
                3,
                migratedJdbcTemplate.queryForObject(
                        "select count(*) from nightly_reference_rates where nightly_rate is null",
                        Integer.class
                )
        );
        assertEquals(
                0,
                migratedJdbcTemplate.queryForObject(
                        "select count(*) from nightly_reference_rate_changes",
                        Integer.class
                )
        );
        assertEquals(
                Set.of("ONE_CAT", "TWO_CATS", "THREE_PLUS_CATS"),
                Set.copyOf(migratedJdbcTemplate.queryForList(
                        "select category from nightly_reference_rates",
                        String.class
                ))
        );
        assertDecimalColumn(19, 0, "NIGHTLY_REFERENCE_RATES", "NIGHTLY_RATE");
        assertDecimalColumn(
                19,
                0,
                "NIGHTLY_REFERENCE_RATE_CHANGES",
                "PREVIOUS_NIGHTLY_RATE"
        );
        assertDecimalColumn(
                19,
                0,
                "NIGHTLY_REFERENCE_RATE_CHANGES",
                "NEW_NIGHTLY_RATE"
        );
    }

    @Test
    void migrationFromVersionThreePreservesLegacyStayAndDoesNotBackfillAudit() {
        SingleConnectionDataSource dataSource = new SingleConnectionDataSource(
                "jdbc:h2:mem:rate_upgrade_context;DB_CLOSE_DELAY=-1;MODE=MySQL",
                "sa",
                "",
                true
        );

        initializeVersionThreeSchema(dataSource);
        JdbcTemplate jdbcTemplate = new JdbcTemplate(dataSource);
        UUID actorId = UUID.fromString("00000000-0000-0000-0000-000000000011");
        UUID ownerId = UUID.fromString("00000000-0000-0000-0000-000000000012");
        UUID stayId = UUID.fromString("00000000-0000-0000-0000-000000000013");
        Timestamp createdAt = Timestamp.from(Instant.parse("2026-01-01T10:00:00Z"));
        Timestamp startAt = Timestamp.from(Instant.parse("2026-02-01T10:00:00Z"));
        Timestamp endAt = Timestamp.from(Instant.parse("2026-02-03T10:00:00Z"));

        jdbcTemplate.update(
                """
                insert into user_accounts
                    (id, username, password_hash, role, enabled, created_at, updated_at)
                values (?, ?, ?, ?, ?, ?, ?)
                """,
                uuidBytes(actorId),
                "legacy-admin",
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
                "Legacy Owner",
                "555-0100",
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
                startAt,
                endAt,
                "legacy stay",
                uuidBytes(ownerId),
                createdAt,
                createdAt,
                uuidBytes(actorId)
        );

        migrateFromVersionThree(dataSource);

        assertEquals(
                "legacy stay",
                jdbcTemplate.queryForObject(
                        "select notes from stays where id = ?",
                        String.class,
                        uuidBytes(stayId)
                )
        );
        assertEquals(
                3,
                jdbcTemplate.queryForObject(
                        "select count(*) from nightly_reference_rates where nightly_rate is null",
                        Integer.class
                )
        );
        assertEquals(
                0,
                jdbcTemplate.queryForObject(
                        "select count(*) from nightly_reference_rate_changes",
                        Integer.class
                )
        );
    }

    private byte[] uuidBytes(UUID id) {
        return ByteBuffer.allocate(16)
                .putLong(id.getMostSignificantBits())
                .putLong(id.getLeastSignificantBits())
                .array();
    }

    private void assertDecimalColumn(
            int expectedPrecision,
            int expectedScale,
            String tableName,
            String columnName) {
        assertEquals(
                expectedPrecision,
                migratedJdbcTemplate.queryForObject(
                        """
                        select numeric_precision
                        from information_schema.columns
                        where table_name = ? and column_name = ?
                        """,
                        Integer.class,
                        tableName,
                        columnName
                )
        );
        assertEquals(
                expectedScale,
                migratedJdbcTemplate.queryForObject(
                        """
                        select numeric_scale
                        from information_schema.columns
                        where table_name = ? and column_name = ?
                        """,
                        Integer.class,
                        tableName,
                        columnName
                )
        );
    }

    static final class LatestSchemaInitializer
            implements ApplicationContextInitializer<ConfigurableApplicationContext> {

        @Override
        public void initialize(ConfigurableApplicationContext applicationContext) {
            String url = applicationContext.getEnvironment()
                    .getRequiredProperty("spring.datasource.url");
            HikariConfig hikariConfig = new HikariConfig();
            hikariConfig.setJdbcUrl(url);
            hikariConfig.setUsername(applicationContext.getEnvironment()
                    .getRequiredProperty("spring.datasource.username"));
            hikariConfig.setPassword(applicationContext.getEnvironment()
                    .getProperty("spring.datasource.password", ""));
            hikariConfig.setDriverClassName(applicationContext.getEnvironment()
                    .getRequiredProperty("spring.datasource.driver-class-name"));
            hikariConfig.setMaximumPoolSize(4);
            HikariDataSource dataSource = new HikariDataSource(hikariConfig);
            applicationContext.getBeanFactory()
                    .registerSingleton("dataSource", dataSource);

            initializeVersionThreeSchema(dataSource);
            migrateFromVersionThree(dataSource);
        }
    }

    static void initializeVersionThreeSchema(DataSource dataSource) {
        ResourceDatabasePopulator populator = new ResourceDatabasePopulator(
                new ClassPathResource("db/migration/V1__init.sql"),
                new ClassPathResource("db/migration/V2__create_user_accounts.sql")
        );
        populator.execute(dataSource);

        JdbcTemplate jdbcTemplate = new JdbcTemplate(dataSource);
        replaceRoleConstraintForH2(jdbcTemplate);
        addCreatorAttribution(jdbcTemplate, "owners", "fk_owners_created_by");
        addCreatorAttribution(jdbcTemplate, "vets", "fk_vets_created_by");
        addCreatorAttribution(jdbcTemplate, "cats", "fk_cats_created_by");
        addCreatorAttribution(jdbcTemplate, "stays", "fk_stays_created_by");
    }

    static void migrateFromVersionThree(DataSource dataSource) {
        Flyway.configure()
                .dataSource(dataSource)
                .baselineOnMigrate(true)
                .baselineVersion(MigrationVersion.fromVersion("3"))
                .load()
                .migrate();
    }

    private static void replaceRoleConstraintForH2(JdbcTemplate jdbcTemplate) {
        jdbcTemplate.execute(
                "alter table user_accounts drop constraint chk_user_accounts_role"
        );
        jdbcTemplate.execute(
                """
                alter table user_accounts
                add constraint chk_user_accounts_role
                check (role = 'ADMIN' or role = 'STAFF')
                """
        );
    }

    private static void addCreatorAttribution(
            JdbcTemplate jdbcTemplate,
            String table,
            String constraint) {
        jdbcTemplate.execute(
                "alter table " + table + " add column created_by_id binary(16) not null"
        );
        jdbcTemplate.execute(
                "alter table " + table
                        + " add constraint " + constraint
                        + " foreign key (created_by_id) references user_accounts (id)"
        );
    }
}
