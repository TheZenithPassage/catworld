package com.allegaeon.catworld.config;

import org.flywaydb.core.Flyway;
import org.flywaydb.core.api.MigrationInfo;
import org.flywaydb.core.api.MigrationState;
import org.flywaydb.core.api.MigrationVersion;
import org.springframework.boot.flyway.autoconfigure.FlywayMigrationStrategy;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.Arrays;

@Configuration(proxyBeanMethods = false)
public class HistoricalMigrationConfig {

    private static final MigrationVersion PENDING_PRICE_VERSION = MigrationVersion.fromVersion("14");
    private static final MigrationVersion CAT_PHOTO_GALLERY_VERSION = MigrationVersion.fromVersion("15");

    @Bean
    FlywayMigrationStrategy historicalMigrationStrategy() {
        return HistoricalMigrationConfig::migrate;
    }

    static void migrate(Flyway flyway) {
        var ignoredVersions = Arrays.stream(flyway.info().all())
                .filter(migration -> migration.getState() == MigrationState.IGNORED)
                .map(MigrationInfo::getVersion)
                .toList();
        if (!ignoredVersions.isEmpty() && ignoredVersions.stream().allMatch(version ->
                PENDING_PRICE_VERSION.equals(version) || CAT_PHOTO_GALLERY_VERSION.equals(version))) {
            // V16 may have been installed first. Apply only the known missing
            // versions before resuming Flyway's normal migration order.
            MigrationVersion target = ignoredVersions.contains(CAT_PHOTO_GALLERY_VERSION)
                    ? CAT_PHOTO_GALLERY_VERSION : PENDING_PRICE_VERSION;
            Flyway.configure().configuration(flyway.getConfiguration())
                    .outOfOrder(true)
                    .target(target)
                    .load()
                    .migrate();
        }
        flyway.migrate();
    }
}
