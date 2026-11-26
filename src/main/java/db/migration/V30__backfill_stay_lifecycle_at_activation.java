package db.migration;

import org.flywaydb.core.api.migration.BaseJavaMigration;
import org.flywaydb.core.api.migration.Context;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZoneOffset;

public class V30__backfill_stay_lifecycle_at_activation extends BaseJavaMigration {

    @Override
    public void migrate(Context context) throws SQLException {
        Instant activation = Instant.now();
        ZoneId zone = ZoneId.of(context.getConfiguration().getPlaceholders()
                .getOrDefault("catworld_business_zone", "America/Argentina/Buenos_Aires"));
        var connection = context.getConnection();

        try (var select = connection.prepareStatement("""
                    SELECT s.id, s.start_at, s.end_at,
                        a.occurred_at_utc AS arrival, d.occurred_at_utc AS departure
                    FROM stays s
                    LEFT JOIN stay_actual_movements a ON a.stay_id = s.id AND a.movement_type = 'ARRIVAL'
                    LEFT JOIN stay_actual_movements d ON d.stay_id = s.id AND d.movement_type = 'DEPARTURE'
                    WHERE s.cancelled_at IS NULL
                    """);
             var update = connection.prepareStatement("UPDATE stays SET movement_status = ? WHERE id = ?");
             var results = select.executeQuery()) {
            while (results.next()) {
                String movementStatus = classify(
                        results.getObject("start_at", LocalDateTime.class),
                        results.getObject("end_at", LocalDateTime.class),
                        utcInstant(results, "arrival"), utcInstant(results, "departure"), activation, zone);
                if (!movementStatus.equals("RESERVED")) {
                    update.setString(1, movementStatus);
                    update.setBytes(2, results.getBytes("id"));
                    update.addBatch();
                }
            }
            update.executeBatch();
        }
    }

    static String classify(LocalDateTime start, LocalDateTime end, Instant arrival, Instant departure,
                           Instant activation, ZoneId zone) {
        if (!scheduledBoundary(end, zone).isAfter(activation)
                || (departure != null && !departure.isAfter(activation)
                && (arrival == null || !departure.isBefore(arrival)))) {
            return "CHECKED_OUT";
        }
        if (!scheduledBoundary(start, zone).isAfter(activation) || (arrival != null && !arrival.isAfter(activation))) {
            return "CHECKED_IN";
        }
        return "RESERVED";
    }

    private static Instant scheduledBoundary(LocalDateTime scheduled, ZoneId zone) {
        var rules = zone.getRules();
        var offsets = rules.getValidOffsets(scheduled);
        // Use the first instant the old wall clock reached or passed the scheduled time.
        return offsets.isEmpty() ? rules.getTransition(scheduled).getInstant()
                : scheduled.toInstant(offsets.getFirst());
    }

    private static Instant utcInstant(ResultSet result, String column) throws SQLException {
        LocalDateTime value = result.getObject(column, LocalDateTime.class);
        return value == null ? null : value.toInstant(ZoneOffset.UTC);
    }
}
