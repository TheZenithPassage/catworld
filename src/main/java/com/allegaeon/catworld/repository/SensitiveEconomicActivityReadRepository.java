package com.allegaeon.catworld.repository;

import com.allegaeon.catworld.dto.sensitiveactivity.SensitiveEconomicActivityFilter;
import com.allegaeon.catworld.dto.sensitiveactivity.SensitiveEconomicEventType;
import jakarta.persistence.EntityManager;
import jakarta.persistence.Query;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.nio.ByteBuffer;
import java.sql.Date;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import com.allegaeon.catworld.dto.overview.OverviewPage;
import com.allegaeon.catworld.model.SensitiveStayContextCat;

@Repository
@RequiredArgsConstructor
public class SensitiveEconomicActivityReadRepository {

    private static final DateTimeFormatter DATABASE_DATETIME =
            DateTimeFormatter.ofPattern("uuuu-MM-dd HH:mm:ss.SSSSSS");

    // Read native DATETIME projections as text so the driver does not interpret them
    // as timestamps. Event times are UTC, while stay context times are local.
    private static final String UNION_QUERY = """
            SELECT activity.event_id, activity.event_type, activity.event_type_order,
                   CAST(activity.occurred_at AS CHAR(26)), activity.actor_id,
                   activity.actor_username, activity.context_id, activity.stay_id,
                   activity.owner_id, activity.owner_full_name,
                   CAST(activity.stay_start_at AS CHAR(26)), CAST(activity.stay_end_at AS CHAR(26)),
                   CAST(activity.stay_cancelled_at AS CHAR(26)), activity.rate_category,
                   activity.previous_rate, activity.new_rate, activity.retained_nightly_rate,
                   activity.number_of_nights, activity.agreed_amount,
                   activity.previous_agreed_amount, activity.new_agreed_amount,
                   activity.payment_id, activity.previous_amount, activity.new_amount,
                   activity.amount, activity.payment_date, activity.payment_note,
                   activity.registered_by_id, activity.registered_by_username,
                   CAST(activity.registered_at AS CHAR(26)), activity.annulled, activity.reason,
                   activity.arrival_transfer_required, activity.departure_transfer_required,
                   activity.transfer_waived, activity.retained_transfer_rate
            FROM (
                SELECT
                    rate_change.id AS event_id,
                    'NIGHTLY_RATE_CHANGED' AS event_type,
                    0 AS event_type_order,
                    rate_change.changed_at AS occurred_at,
                    actor.id AS actor_id,
                    actor.username AS actor_username,
                    NULL AS context_id,
                    NULL AS stay_id,
                    NULL AS owner_id,
                    NULL AS owner_full_name,
                    NULL AS stay_start_at,
                    NULL AS stay_end_at,
                    NULL AS stay_cancelled_at,
                    rate_change.category AS rate_category,
                    rate_change.previous_nightly_rate AS previous_rate,
                    rate_change.new_nightly_rate AS new_rate,
                    NULL AS retained_nightly_rate,
                    NULL AS number_of_nights,
                    NULL AS agreed_amount,
                    NULL AS previous_agreed_amount,
                    NULL AS new_agreed_amount,
                    NULL AS payment_id,
                    NULL AS previous_amount,
                    NULL AS new_amount,
                    NULL AS amount,
                    NULL AS payment_date,
                    NULL AS payment_note,
                    NULL AS registered_by_id,
                    NULL AS registered_by_username,
                    NULL AS registered_at,
                    NULL AS annulled,
                    NULL AS reason,
                    NULL AS arrival_transfer_required, NULL AS departure_transfer_required,
                    NULL AS transfer_waived, NULL AS retained_transfer_rate
                FROM nightly_reference_rate_changes rate_change
                JOIN user_accounts actor ON actor.id = rate_change.changed_by_id

                UNION ALL

                SELECT
                    pricing.id,
                    'PRICING_OVERRIDE',
                    1,
                    pricing.decided_at,
                    actor.id,
                    actor.username,
                    context.id,
                    context.stay_id,
                    context.owner_id,
                    context.owner_full_name,
                    context.stay_start_at,
                    context.stay_end_at,
                    context.stay_cancelled_at,
                    NULL,
                    NULL,
                    NULL,
                    pricing.retained_nightly_rate,
                    pricing.new_number_of_nights,
                    pricing.new_agreed_amount,
                    NULL,
                    NULL,
                    NULL,
                    NULL,
                    NULL,
                    NULL,
                    NULL,
                    NULL,
                    NULL,
                    NULL,
                    NULL,
                    NULL,
                    pricing.reason,
                    pricing.arrival_transfer_required, pricing.departure_transfer_required,
                    pricing.transfer_waived, pricing.retained_transfer_rate
                FROM stay_pricing_decisions pricing
                JOIN user_accounts actor ON actor.id = pricing.decided_by_id
                JOIN sensitive_stay_contexts context
                    ON context.id = pricing.sensitive_context_id
                WHERE pricing.retained_nightly_rate IS NOT NULL
                  AND pricing.reason IS NOT NULL
                  AND CHAR_LENGTH(TRIM(pricing.reason)) > 0
                  AND pricing.retained_nightly_rate
                        * pricing.new_number_of_nights
                        + CASE
                            WHEN pricing.transfer_waived
                                OR pricing.retained_transfer_rate IS NULL THEN 0
                            ELSE pricing.retained_transfer_rate
                                * ((CASE WHEN pricing.arrival_transfer_required THEN 1 ELSE 0 END)
                                   + (CASE WHEN pricing.departure_transfer_required THEN 1 ELSE 0 END))
                          END
                        <> pricing.new_agreed_amount

                UNION ALL

                SELECT
                    correction.id,
                    'AGREED_AMOUNT_CORRECTED',
                    2,
                    correction.decided_at,
                    actor.id,
                    actor.username,
                    context.id,
                    context.stay_id,
                    context.owner_id,
                    context.owner_full_name,
                    context.stay_start_at,
                    context.stay_end_at,
                    context.stay_cancelled_at,
                    NULL,
                    NULL,
                    NULL,
                    NULL,
                    NULL,
                    NULL,
                    correction.previous_agreed_amount,
                    correction.new_agreed_amount,
                    NULL,
                    NULL,
                    NULL,
                    NULL,
                    NULL,
                    NULL,
                    NULL,
                    NULL,
                    NULL,
                    NULL,
                    correction.reason,
                    NULL, NULL, NULL, NULL
                FROM stay_agreed_amount_corrections correction
                JOIN user_accounts actor ON actor.id = correction.decided_by_id
                JOIN sensitive_stay_contexts context
                    ON context.id = correction.sensitive_context_id

                UNION ALL

                SELECT
                    payment_edit.id,
                    'PAYMENT_EDITED',
                    3,
                    payment_edit.edited_at,
                    actor.id,
                    actor.username,
                    context.id,
                    context.stay_id,
                    context.owner_id,
                    context.owner_full_name,
                    context.stay_start_at,
                    context.stay_end_at,
                    context.stay_cancelled_at,
                    NULL,
                    NULL,
                    NULL,
                    NULL,
                    NULL,
                    NULL,
                    NULL,
                    NULL,
                    payment_edit.payment_id,
                    payment_edit.previous_amount,
                    payment_edit.new_amount,
                    NULL,
                    payment_edit.payment_date,
                    payment_edit.payment_note,
                    registrant.id,
                    registrant.username,
                    payment_edit.registered_at,
                    NULL,
                    payment_edit.reason,
                    NULL, NULL, NULL, NULL
                FROM stay_payment_edits payment_edit
                JOIN user_accounts actor ON actor.id = payment_edit.edited_by_id
                JOIN user_accounts registrant
                    ON registrant.id = payment_edit.registered_by_id
                JOIN sensitive_stay_contexts context
                    ON context.id = payment_edit.sensitive_context_id

                UNION ALL

                SELECT
                    annulment.id,
                    'PAYMENT_ANNULLED',
                    4,
                    annulment.annulled_at,
                    actor.id,
                    actor.username,
                    context.id,
                    context.stay_id,
                    context.owner_id,
                    context.owner_full_name,
                    context.stay_start_at,
                    context.stay_end_at,
                    context.stay_cancelled_at,
                    NULL,
                    NULL,
                    NULL,
                    NULL,
                    NULL,
                    NULL,
                    NULL,
                    NULL,
                    annulment.payment_id,
                    NULL,
                    NULL,
                    annulment.amount,
                    annulment.payment_date,
                    annulment.payment_note,
                    registrant.id,
                    registrant.username,
                    annulment.registered_at,
                    NULL,
                    annulment.reason,
                    NULL, NULL, NULL, NULL
                FROM stay_payment_annulments annulment
                JOIN user_accounts actor ON actor.id = annulment.annulled_by_id
                JOIN user_accounts registrant
                    ON registrant.id = annulment.registered_by_id
                JOIN sensitive_stay_contexts context
                    ON context.id = annulment.sensitive_context_id

                UNION ALL

                SELECT
                    removal.id,
                    'PAYMENT_REMOVED',
                    5,
                    removal.removed_at,
                    actor.id,
                    actor.username,
                    context.id,
                    context.stay_id,
                    context.owner_id,
                    context.owner_full_name,
                    context.stay_start_at,
                    context.stay_end_at,
                    context.stay_cancelled_at,
                    NULL,
                    NULL,
                    NULL,
                    NULL,
                    NULL,
                    NULL,
                    NULL,
                    NULL,
                    removal.payment_id,
                    NULL,
                    NULL,
                    removal.amount,
                    removal.payment_date,
                    removal.payment_note,
                    registrant.id,
                    registrant.username,
                    removal.registered_at,
                    removal.annulled,
                    removal.reason,
                    NULL, NULL, NULL, NULL
                FROM stay_payment_removals removal
                JOIN user_accounts actor ON actor.id = removal.removed_by_id
                JOIN user_accounts registrant
                    ON registrant.id = removal.registered_by_id
                JOIN sensitive_stay_contexts context
                    ON context.id = removal.sensitive_context_id
            ) activity
            WHERE 1 = 1
            """;

    private static final String GLOBAL_ORDER = """
            ORDER BY activity.occurred_at DESC,
                     activity.event_type_order ASC,
                     activity.event_id ASC
            """;

    private final EntityManager entityManager;

    public OverviewPage<SensitiveEconomicActivityProjection> findActivity(
            SensitiveEconomicActivityFilter filter, int page) {
        StringBuilder sql = new StringBuilder(UNION_QUERY);
        Map<String, LocalDateTime> stayBounds = new LinkedHashMap<>();
        appendPredicates(sql, filter, stayBounds);
        String filteredSql = sql.toString();
        sql.append('\n').append(GLOBAL_ORDER);

        Query query = entityManager.createNativeQuery(sql.toString());
        bindParameters(query, filter, stayBounds);
        query.setFirstResult(page * OverviewPage.PAGE_SIZE);
        query.setMaxResults(OverviewPage.PAGE_SIZE);

        @SuppressWarnings("unchecked")
        List<Object[]> rows = query.getResultList();
        Query countQuery = entityManager.createNativeQuery(
                "SELECT COUNT(*) FROM (" + filteredSql + ") counted_activity");
        bindParameters(countQuery, filter, stayBounds);
        long total = ((Number) countQuery.getSingleResult()).longValue();
        return new OverviewPage<>(project(rows), page, total);
    }

    public List<SensitiveEconomicActivityProjection> findActivity(
            SensitiveEconomicActivityFilter filter) {
        return findActivity(filter, 0).items();
    }

    private void appendPredicates(
            StringBuilder sql,
            SensitiveEconomicActivityFilter filter,
            Map<String, LocalDateTime> stayBounds) {
        LocalDate stayFrom = filter.stayFrom();
        LocalDate stayTo = filter.stayTo();
        if (stayFrom != null || stayTo != null) {
            sql.append(" AND EXISTS (SELECT 1 FROM stays current_stay WHERE current_stay.id = activity.stay_id");
            switch (filter.stayDateMatchMode()) {
                case OVERLAPS -> {
                    onOrAfterStayDay(sql, stayBounds, "end_at", stayFrom);
                    onOrBeforeStayDay(sql, stayBounds, "start_at", stayTo);
                }
                case STAY_WITHIN_RANGE -> {
                    onOrAfterStayDay(sql, stayBounds, "start_at", stayFrom);
                    onOrBeforeStayDay(sql, stayBounds, "end_at", stayTo);
                }
                case RANGE_WITHIN_STAY -> {
                    onOrBeforeStayDay(sql, stayBounds, "start_at", stayFrom != null ? stayFrom : stayTo);
                    onOrAfterStayDay(sql, stayBounds, "end_at", stayTo != null ? stayTo : stayFrom);
                }
            }
            sql.append(")");
        }
        if (filter.actorId() != null) {
            sql.append(" AND activity.actor_id = :actorId");
        }
        if (filter.occurredFrom() != null) {
            sql.append(" AND activity.occurred_at >= CAST(:occurredFrom AS DATETIME(6))");
        }
        if (filter.occurredTo() != null) {
            sql.append(" AND activity.occurred_at < CAST(:occurredTo AS DATETIME(6))");
        }
        if (filter.eventType() != null) {
            sql.append(" AND activity.event_type = :eventType");
        }
        if (filter.ownerId() != null) {
            sql.append(" AND activity.owner_id = :ownerId");
        }
        if (filter.stayId() != null) {
            sql.append(" AND activity.stay_id = :stayId");
        }
        if (filter.catId() != null) {
            sql.append("""
                     AND EXISTS (
                         SELECT 1
                         FROM sensitive_stay_context_cats filtered_cat
                         WHERE filtered_cat.context_id = activity.context_id
                           AND filtered_cat.cat_id = :catId
                     )
                    """);
        }
    }

    // Bind stay boundaries as wall times, matching the entity's LocalDateTime mapping.
    private static void onOrAfterStayDay(StringBuilder sql, Map<String, LocalDateTime> bounds,
                                        String column, LocalDate date) {
        if (date == null) return;
        sql.append(" AND current_stay.").append(column).append(" >= CAST(:stayLower AS DATETIME(6))");
        bounds.put("stayLower", date.atStartOfDay());
    }

    private static void onOrBeforeStayDay(StringBuilder sql, Map<String, LocalDateTime> bounds,
                                         String column, LocalDate date) {
        if (date == null) return;
        sql.append(" AND current_stay.").append(column);
        if (LocalDate.MAX.equals(date)) {
            sql.append(" <= CAST(:stayUpper AS DATETIME(6))");
            bounds.put("stayUpper", date.atTime(LocalTime.MAX));
        } else {
            sql.append(" < CAST(:stayUpper AS DATETIME(6))");
            bounds.put("stayUpper", date.plusDays(1).atStartOfDay());
        }
    }

    private void bindParameters(
            Query query,
            SensitiveEconomicActivityFilter filter,
            Map<String, LocalDateTime> stayBounds) {
        // Untyped native parameters can still use the driver's timestamp conversion.
        stayBounds.forEach((name, bound) -> query.setParameter(name, DATABASE_DATETIME.format(bound)));
        if (filter.actorId() != null) {
            query.setParameter("actorId", uuidBytes(filter.actorId()));
        }
        if (filter.occurredFrom() != null) {
            query.setParameter(
                    "occurredFrom", utcBound(filter.occurredFrom()));
        }
        if (filter.occurredTo() != null) {
            query.setParameter(
                    "occurredTo", utcBound(filter.occurredTo()));
        }
        if (filter.eventType() != null) {
            query.setParameter("eventType", filter.eventType().name());
        }
        if (filter.ownerId() != null) {
            query.setParameter("ownerId", uuidBytes(filter.ownerId()));
        }
        if (filter.stayId() != null) {
            query.setParameter("stayId", uuidBytes(filter.stayId()));
        }
        if (filter.catId() != null) {
            query.setParameter("catId", uuidBytes(filter.catId()));
        }
    }

    private List<SensitiveEconomicActivityProjection> project(
            List<Object[]> rows) {
        List<UUID> contextIds = rows.stream().map(row -> uuid(row[6]))
                .filter(java.util.Objects::nonNull).distinct().toList();
        Map<UUID, List<SensitiveEconomicActivityProjection.CatProjection>> catsByContext = new java.util.HashMap<>();
        if (!contextIds.isEmpty()) {
            entityManager.createQuery("select cat from SensitiveStayContextCat cat where cat.context.id in :contextIds order by cat.id.catId", SensitiveStayContextCat.class)
                    .setParameter("contextIds", contextIds).getResultList().forEach(cat ->
                            catsByContext.computeIfAbsent(cat.getContext().getId(), ignored -> new ArrayList<>())
                                    .add(new SensitiveEconomicActivityProjection.CatProjection(cat.getCatId(), cat.getCatName())));
        }
        Map<ActivityKey, Accumulator> activities = new LinkedHashMap<>();
        for (Object[] row : rows) {
            ActivityKey key = new ActivityKey(
                    eventType(row[1]),
                    uuid(row[0])
            );
            Accumulator accumulator = activities.computeIfAbsent(
                    key,
                    ignored -> new Accumulator(row)
            );
            catsByContext.getOrDefault(uuid(row[6]), List.of()).forEach(cat -> accumulator.cats.putIfAbsent(cat.id(), cat));
        }
        return activities.values().stream()
                .map(Accumulator::toProjection)
                .toList();
    }

    private SensitiveEconomicEventType eventType(Object value) {
        return SensitiveEconomicEventType.valueOf(string(value));
    }

    private UUID uuid(Object value) {
        if (value == null) {
            return null;
        }
        if (value instanceof UUID uuid) {
            return uuid;
        }
        if (value instanceof byte[] bytes && bytes.length == 16) {
            ByteBuffer buffer = ByteBuffer.wrap(bytes);
            return new UUID(buffer.getLong(), buffer.getLong());
        }
        return UUID.fromString(value.toString());
    }

    private byte[] uuidBytes(UUID value) {
        return ByteBuffer.allocate(16)
                .putLong(value.getMostSignificantBits())
                .putLong(value.getLeastSignificantBits())
                .array();
    }

    private String string(Object value) {
        return value == null ? null : value.toString();
    }

    private BigDecimal decimal(Object value) {
        if (value == null) {
            return null;
        }
        return value instanceof BigDecimal decimal
                ? decimal
                : new BigDecimal(value.toString());
    }

    private Long longValue(Object value) {
        return value == null ? null : ((Number) value).longValue();
    }

    private static String utcBound(Instant instant) {
        // Both >= and < keep their meaning when a bound falls between stored microseconds.
        Instant microsecond = instant.truncatedTo(ChronoUnit.MICROS);
        if (!instant.equals(microsecond)) {
            microsecond = microsecond.plus(1, ChronoUnit.MICROS);
        }
        return DATABASE_DATETIME.format(LocalDateTime.ofInstant(microsecond, ZoneOffset.UTC));
    }

    private Instant instant(Object value) {
        return value == null ? null : localDateTime(value).toInstant(ZoneOffset.UTC);
    }

    private LocalDateTime localDateTime(Object value) {
        return value == null ? null : LocalDateTime.parse(string(value).trim().replace(' ', 'T'));
    }

    private LocalDate localDate(Object value) {
        if (value == null) {
            return null;
        }
        if (value instanceof LocalDate localDate) {
            return localDate;
        }
        return ((Date) value).toLocalDate();
    }

    private Boolean booleanValue(Object value) {
        if (value == null || value instanceof Boolean) {
            return (Boolean) value;
        }
        return ((Number) value).intValue() != 0;
    }

    private record ActivityKey(
            SensitiveEconomicEventType eventType,
            UUID eventId) {
    }

    private final class Accumulator {

        private final Object[] row;
        private final Map<UUID, SensitiveEconomicActivityProjection.CatProjection>
                cats = new LinkedHashMap<>();

        private Accumulator(Object[] row) {
            this.row = row;
        }

        private SensitiveEconomicActivityProjection toProjection() {
            return new SensitiveEconomicActivityProjection(
                    uuid(row[0]),
                    eventType(row[1]),
                    instant(row[3]),
                    uuid(row[4]),
                    string(row[5]),
                    uuid(row[6]),
                    uuid(row[7]),
                    uuid(row[8]),
                    string(row[9]),
                    localDateTime(row[10]),
                    localDateTime(row[11]),
                    localDateTime(row[12]),
                    new ArrayList<>(cats.values()),
                    string(row[13]),
                    decimal(row[14]),
                    decimal(row[15]),
                    decimal(row[16]),
                    longValue(row[17]),
                    decimal(row[18]),
                    decimal(row[19]),
                    decimal(row[20]),
                    uuid(row[21]),
                    decimal(row[22]),
                    decimal(row[23]),
                    decimal(row[24]),
                    localDate(row[25]),
                    string(row[26]),
                    uuid(row[27]),
                    string(row[28]),
                    instant(row[29]),
                    booleanValue(row[30]),
                    string(row[31]),
                    booleanValue(row[32]), booleanValue(row[33]),
                    booleanValue(row[34]), decimal(row[35])
            );
        }
    }
}
