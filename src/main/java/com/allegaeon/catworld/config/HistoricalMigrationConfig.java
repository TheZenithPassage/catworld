package com.allegaeon.catworld.config;

import org.flywaydb.core.Flyway;
import org.flywaydb.core.api.MigrationInfo;
import org.flywaydb.core.api.MigrationState;
import org.flywaydb.core.api.MigrationVersion;
import org.springframework.boot.flyway.autoconfigure.FlywayMigrationStrategy;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.Arrays;
import java.util.Comparator;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Configuration(proxyBeanMethods = false)
public class HistoricalMigrationConfig {

    private static final MigrationVersion PENDING_PRICE_VERSION = MigrationVersion.fromVersion("14");
    private static final MigrationVersion CAT_PHOTO_GALLERY_VERSION = MigrationVersion.fromVersion("15");
    private static final MigrationVersion DECEASED_MARKERS_VERSION = MigrationVersion.fromVersion("16");
    private static final List<String> PUBLISHED_INTAKE_HISTORY = List.of(
            "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13", "15", "17");
    private static final List<String> PUBLISHED_INTAKE_WITH_LATE_PRICES = Stream.concat(
            PUBLISHED_INTAKE_HISTORY.stream(), Stream.of(PENDING_PRICE_VERSION.getVersion())).toList();
    private static final String DECEASED_MARKERS_SCRIPT = "V16__mark_deceased_cats_and_owners.sql";
    private static final Set<String> PUBLISHED_INTAKE_MISSING_SCRIPTS = Set.of(
            "V14__pending_stay_prices.sql", DECEASED_MARKERS_SCRIPT);

    @Bean
    FlywayMigrationStrategy historicalMigrationStrategy() {
        return HistoricalMigrationConfig::migrate;
    }

    static void migrate(Flyway flyway) {
        var info = flyway.info();
        var ignored = Arrays.stream(info.all())
                .filter(migration -> migration.getState() == MigrationState.IGNORED)
                .toList();
        var ignoredVersions = ignored.stream().map(MigrationInfo::getVersion).toList();
        MigrationVersion target = null;
        if (!ignoredVersions.isEmpty() && ignoredVersions.stream().allMatch(version ->
                PENDING_PRICE_VERSION.equals(version) || CAT_PHOTO_GALLERY_VERSION.equals(version))) {
            target = ignoredVersions.contains(CAT_PHOTO_GALLERY_VERSION)
                    ? CAT_PHOTO_GALLERY_VERSION : PENDING_PRICE_VERSION;
        } else if (matchesPublishedIntakeHistory(info.applied(), ignored)) {
            target = DECEASED_MARKERS_VERSION;
        }
        if (target != null) {
            Flyway.configure().configuration(flyway.getConfiguration())
                    .outOfOrder(true)
                    .target(target)
                    .load()
                    .migrate();
        }
        flyway.migrate();
    }

    private static boolean matchesPublishedIntakeHistory(MigrationInfo[] applied, List<MigrationInfo> ignored) {
        if (ignored.isEmpty() || ignored.size() > PUBLISHED_INTAKE_MISSING_SCRIPTS.size()) {
            return false;
        }
        var missingScripts = ignored.stream().map(MigrationInfo::getScript).collect(Collectors.toSet());
        var installedVersions = Arrays.stream(applied)
                .filter(MigrationInfo::isVersioned)
                .sorted(Comparator.comparing(MigrationInfo::getInstalledRank))
                .map(migration -> migration.getVersion().getVersion())
                .toList();
        return (PUBLISHED_INTAKE_MISSING_SCRIPTS.equals(missingScripts)
                && PUBLISHED_INTAKE_HISTORY.equals(installedVersions))
                || (Set.of(DECEASED_MARKERS_SCRIPT).equals(missingScripts)
                && PUBLISHED_INTAKE_WITH_LATE_PRICES.equals(installedVersions));
    }
}
