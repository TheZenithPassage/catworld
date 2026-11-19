package com.allegaeon.catworld.config;

import org.flywaydb.core.Flyway;
import org.flywaydb.core.api.MigrationState;
import org.flywaydb.core.api.MigrationVersion;
import org.springframework.boot.flyway.autoconfigure.FlywayMigrationStrategy;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.Arrays;

@Configuration(proxyBeanMethods = false)
public class PendingPriceMigrationConfig {

    private static final MigrationVersion PENDING_PRICE_VERSION = MigrationVersion.fromVersion("14");

    @Bean
    FlywayMigrationStrategy pendingPriceMigrationStrategy() {
        return PendingPriceMigrationConfig::migrate;
    }

    static void migrate(Flyway flyway) {
        var ignored = Arrays.stream(flyway.info().all())
                .filter(migration -> migration.getState() == MigrationState.IGNORED)
                .toList();
        if (ignored.size() == 1 && PENDING_PRICE_VERSION.equals(ignored.getFirst().getVersion())) {
            // V16 may precede this release. Limit the late migration to V14 and
            // keep Flyway's normal validation of every applied migration.
            Flyway.configure().configuration(flyway.getConfiguration())
                    .outOfOrder(true)
                    .target(PENDING_PRICE_VERSION)
                    .load()
                    .migrate();
        }
        flyway.migrate();
    }
}
