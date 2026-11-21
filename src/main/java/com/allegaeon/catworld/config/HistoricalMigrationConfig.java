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
    private static final MigrationVersion ACTUAL_MOVEMENTS_VERSION = MigrationVersion.fromVersion("21");
    private static final MigrationVersion CAT_INTAKE_VERSION = MigrationVersion.fromVersion("17");
    private static final String ACTUAL_MOVEMENTS_SCRIPT = "V21__create_stay_actual_movements.sql";
    private static final List<String> EARLY_MOVEMENTS_HISTORY = List.of(
            "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13", "21");
    private static final Set<String> EARLY_MOVEMENTS_MISSING_SCRIPTS = Set.of(
            "V14__pending_stay_prices.sql", "V15__create_cat_informational_photos.sql",
            "V16__mark_deceased_cats_and_owners.sql", "V17__create_cat_intake.sql");
    private static final MigrationVersion OWN_LITTER_CATALOG_VERSION = MigrationVersion.fromVersion("26.4");
    private static final String BRAND_VARIETIES_SCRIPT = "V26_1__add_food_variety_catalog.sql";
    private static final String BREED_SEEDS_SCRIPT = "V26_2__seed_common_breeds.sql";
    private static final String CATALOG_MANAGEMENT_SCRIPT = "V26_3__manage_cat_profile_catalogs.sql";
    private static final String OWN_LITTER_CATALOG_SCRIPT = "V26_4__add_own_litter_catalog.sql";
    private static final String STAY_LITTER_PRICING_SCRIPT = "V27__add_stay_litter_pricing.sql";
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
                .filter(migration -> !ACTUAL_MOVEMENTS_SCRIPT.equals(migration.getScript()))
                .toList();
        var ignoredVersions = ignored.stream().map(MigrationInfo::getVersion).toList();
        MigrationVersion target = null;
        if (!ignoredVersions.isEmpty() && ignoredVersions.stream().allMatch(version ->
                PENDING_PRICE_VERSION.equals(version) || CAT_PHOTO_GALLERY_VERSION.equals(version))) {
            target = ignoredVersions.contains(CAT_PHOTO_GALLERY_VERSION)
                    ? CAT_PHOTO_GALLERY_VERSION : PENDING_PRICE_VERSION;
        } else if (matchesPublishedIntakeHistory(info.applied(), ignored)) {
            target = DECEASED_MARKERS_VERSION;
        } else if (matchesLitterPricingHistory(info.applied(), ignored)) {
            target = OWN_LITTER_CATALOG_VERSION;
        }
        if (EARLY_MOVEMENTS_HISTORY.equals(installedVersions(info.applied()))
                && EARLY_MOVEMENTS_MISSING_SCRIPTS.equals(ignored.stream()
                .map(MigrationInfo::getScript).collect(Collectors.toSet()))) {
            target = CAT_INTAKE_VERSION;
        }
        if (target != null) migrateOutOfOrder(flyway, target);

        var remaining = Arrays.stream(flyway.info().all())
                .filter(migration -> migration.getState() == MigrationState.IGNORED)
                .map(MigrationInfo::getScript).toList();
        if (remaining.equals(List.of(ACTUAL_MOVEMENTS_SCRIPT))) {
            migrateOutOfOrder(flyway, ACTUAL_MOVEMENTS_VERSION);
        }
        flyway.migrate();
    }

    private static void migrateOutOfOrder(Flyway flyway, MigrationVersion target) {
        Flyway.configure().configuration(flyway.getConfiguration())
                .outOfOrder(true)
                .target(target)
                .load()
                .migrate();
    }

    private static boolean matchesLitterPricingHistory(MigrationInfo[] applied, List<MigrationInfo> ignored) {
        var missing = ignored.stream().map(MigrationInfo::getScript).collect(Collectors.toSet());
        var installed = Arrays.stream(applied)
                .filter(migration -> migration.getState() == MigrationState.SUCCESS
                        || migration.getState() == MigrationState.OUT_OF_ORDER)
                .map(MigrationInfo::getScript).collect(Collectors.toSet());
        if (!installed.contains(BRAND_VARIETIES_SCRIPT) || !installed.contains(STAY_LITTER_PRICING_SCRIPT)) return false;
        return (missing.equals(Set.of(OWN_LITTER_CATALOG_SCRIPT))
                        && installed.containsAll(Set.of(BREED_SEEDS_SCRIPT, CATALOG_MANAGEMENT_SCRIPT)))
                || (missing.equals(Set.of(CATALOG_MANAGEMENT_SCRIPT, OWN_LITTER_CATALOG_SCRIPT))
                        && installed.contains(BREED_SEEDS_SCRIPT))
                || missing.equals(Set.of(BREED_SEEDS_SCRIPT, CATALOG_MANAGEMENT_SCRIPT, OWN_LITTER_CATALOG_SCRIPT));
    }

    private static boolean matchesPublishedIntakeHistory(MigrationInfo[] applied, List<MigrationInfo> ignored) {
        if (ignored.isEmpty() || ignored.size() > PUBLISHED_INTAKE_MISSING_SCRIPTS.size()) {
            return false;
        }
        var missingScripts = ignored.stream().map(MigrationInfo::getScript).collect(Collectors.toSet());
        var versions = installedVersions(applied);
        return (PUBLISHED_INTAKE_MISSING_SCRIPTS.equals(missingScripts)
                && PUBLISHED_INTAKE_HISTORY.equals(versions))
                || (Set.of(DECEASED_MARKERS_SCRIPT).equals(missingScripts)
                && PUBLISHED_INTAKE_WITH_LATE_PRICES.equals(versions));
    }

    private static List<String> installedVersions(MigrationInfo[] applied) {
        return Arrays.stream(applied)
                .filter(MigrationInfo::isVersioned)
                .sorted(Comparator.comparing(MigrationInfo::getInstalledRank))
                .map(migration -> migration.getVersion().getVersion())
                .toList();
    }
}
