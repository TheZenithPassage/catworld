package com.allegaeon.catworld.repository;

import com.allegaeon.catworld.dto.sensitiveactivity.AgreedAmountCorrectedActivityDTO;
import com.allegaeon.catworld.dto.sensitiveactivity.NightlyRateChangedActivityDTO;
import com.allegaeon.catworld.dto.sensitiveactivity.PaymentAnnulledActivityDTO;
import com.allegaeon.catworld.dto.sensitiveactivity.PaymentEditedActivityDTO;
import com.allegaeon.catworld.dto.sensitiveactivity.PaymentRemovedActivityDTO;
import com.allegaeon.catworld.dto.sensitiveactivity.PricingOverrideActivityDTO;
import com.allegaeon.catworld.dto.sensitiveactivity.SensitiveEconomicActivityFilter;
import com.allegaeon.catworld.dto.sensitiveactivity.SensitiveEconomicActivityResponseDTO;
import com.allegaeon.catworld.dto.sensitiveactivity.SensitiveEconomicEventType;
import com.allegaeon.catworld.model.UserAccount;
import com.allegaeon.catworld.model.UserRole;
import com.allegaeon.catworld.service.ISensitiveEconomicActivityService;
import org.springframework.jdbc.core.JdbcTemplate;

import java.math.BigDecimal;
import java.nio.ByteBuffer;
import java.sql.Date;
import java.sql.Timestamp;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertInstanceOf;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

final class SensitiveEconomicActivityQueryContract {

    private static final Instant OCCURRED_AT =
            Instant.parse("2026-08-02T12:00:00.123456Z");
    private static final Instant REGISTERED_AT =
            Instant.parse("2026-08-02T11:59:00.123456Z");
    private static final LocalDateTime STAY_START =
            LocalDateTime.of(2026, 8, 10, 10, 0);
    private static final LocalDateTime STAY_END =
            LocalDateTime.of(2026, 8, 12, 10, 0);

    private SensitiveEconomicActivityQueryContract() {
    }

    static Fixture seed(JdbcTemplate jdbc) {
        Fixture fixture = new Fixture(
                uuid("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee"),
                uuid("ffffffff-ffff-ffff-ffff-ffffffffffff"),
                uuid("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
                uuid("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
                uuid("cccccccc-cccc-cccc-cccc-cccccccccccc"),
                uuid("dddddddd-dddd-dddd-dddd-dddddddddddd"),
                uuid("00000000-0000-0000-0000-000000000001"),
                uuid("00000000-0000-0000-0000-000000000002"),
                uuid("00000000-0000-0000-0000-000000000010"),
                uuid("00000000-0000-0000-0000-000000000020"),
                uuid("00000000-0000-0000-0000-000000000030"),
                uuid("00000000-0000-0000-0000-000000000040"),
                uuid("00000000-0000-0000-0000-000000000050")
        );
        insertUser(jdbc, fixture.actorId(), "query-admin");
        insertUser(jdbc, fixture.registrantId(), "query-registrant");

        UUID pricingContext = context(jdbc, fixture, 1);
        UUID correctionContext = context(jdbc, fixture, 2);
        UUID editContext = context(jdbc, fixture, 3);
        UUID annulmentContext = context(jdbc, fixture, 4);
        UUID removalContext = context(jdbc, fixture, 5);
        UUID matchingPricingContext = context(jdbc, fixture, 6);
        UUID unavailablePricingContext = context(jdbc, fixture, 7);

        insertRateChange(
                jdbc, fixture.firstRateId(), "ONE_CAT", "10", "11", fixture);
        insertRateChange(
                jdbc, fixture.secondRateId(), "TWO_CATS", "20", "21", fixture);
        insertPricing(
                jdbc, fixture.pricingId(), pricingContext, "10", 2, "15",
                "Approved adjustment", fixture);
        insertPricing(
                jdbc, uuid("00000000-0000-0000-0000-000000000060"),
                matchingPricingContext, "10", 2, "20",
                "Matches suggestion", fixture);
        insertPricing(
                jdbc, uuid("00000000-0000-0000-0000-000000000061"),
                unavailablePricingContext, null, 2, "0", null, fixture);
        insertPricing(
                jdbc, uuid("00000000-0000-0000-0000-000000000062"),
                null, "10", 2, "15", "Legacy override", fixture);

        jdbc.update("""
                INSERT INTO stay_agreed_amount_corrections (
                    id, stay_id, previous_agreed_amount, new_agreed_amount,
                    decided_by_id, decided_at, reason, sensitive_context_id
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """,
                bytes(fixture.correctionId()), bytes(fixture.stayId()),
                amount("15"), amount("16"), bytes(fixture.actorId()),
                timestamp(OCCURRED_AT), "Corrected transcription",
                bytes(correctionContext));
        jdbc.update("""
                INSERT INTO stay_agreed_amount_corrections (
                    id, stay_id, previous_agreed_amount, new_agreed_amount,
                    decided_by_id, decided_at, reason, sensitive_context_id
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """,
                bytes(uuid("00000000-0000-0000-0000-000000000063")),
                bytes(fixture.stayId()), amount("16"), amount("17"),
                bytes(fixture.actorId()), timestamp(OCCURRED_AT),
                "Legacy correction", null);

        UUID editedPaymentId =
                uuid("11111111-1111-1111-1111-111111111111");
        jdbc.update("""
                INSERT INTO stay_payment_edits (
                    id, stay_id, payment_id, previous_amount, new_amount,
                    edited_by_id, edited_at, reason, sensitive_context_id,
                    payment_date, payment_note, registered_by_id, registered_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                bytes(fixture.editId()), bytes(fixture.stayId()),
                bytes(editedPaymentId), amount("5"), amount("6"),
                bytes(fixture.actorId()), timestamp(OCCURRED_AT),
                "Corrected payment", bytes(editContext),
                Date.valueOf(LocalDate.of(2026, 8, 1)), "Cash",
                bytes(fixture.registrantId()), timestamp(REGISTERED_AT));
        jdbc.update("""
                INSERT INTO stay_payment_edits (
                    id, stay_id, payment_id, previous_amount, new_amount,
                    edited_by_id, edited_at, reason
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """,
                bytes(uuid("00000000-0000-0000-0000-000000000064")),
                bytes(fixture.stayId()),
                bytes(uuid("11111111-1111-1111-1111-111111111112")),
                amount("6"), amount("7"), bytes(fixture.actorId()),
                timestamp(OCCURRED_AT), "Legacy edit");

        UUID annulledPaymentId =
                uuid("22222222-2222-2222-2222-222222222222");
        jdbc.update("""
                INSERT INTO stay_payment_annulments (
                    id, stay_id, payment_id, annulled_by_id, annulled_at,
                    reason, sensitive_context_id, amount, payment_date,
                    payment_note, registered_by_id, registered_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                bytes(fixture.annulmentId()), bytes(fixture.stayId()),
                bytes(annulledPaymentId), bytes(fixture.actorId()),
                timestamp(OCCURRED_AT), "Duplicate payment",
                bytes(annulmentContext), amount("7"),
                Date.valueOf(LocalDate.of(2026, 8, 1)), "Card",
                bytes(fixture.registrantId()), timestamp(REGISTERED_AT));
        jdbc.update("""
                INSERT INTO stay_payment_annulments (
                    id, stay_id, payment_id, annulled_by_id, annulled_at, reason
                ) VALUES (?, ?, ?, ?, ?, ?)
                """,
                bytes(uuid("00000000-0000-0000-0000-000000000065")),
                bytes(fixture.stayId()),
                bytes(uuid("22222222-2222-2222-2222-222222222223")),
                bytes(fixture.actorId()), timestamp(OCCURRED_AT),
                "Legacy annulment");

        jdbc.update("""
                INSERT INTO stay_payment_removals (
                    id, sensitive_context_id, stay_id, payment_id, amount,
                    payment_date, payment_note, annulled, registered_by_id,
                    registered_at, removed_by_id, removed_at, reason
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                bytes(fixture.removalId()), bytes(removalContext),
                bytes(fixture.stayId()),
                bytes(uuid("33333333-3333-3333-3333-333333333333")),
                amount("8"), Date.valueOf(LocalDate.of(2026, 8, 1)),
                "Transfer", true, bytes(fixture.registrantId()),
                timestamp(REGISTERED_AT), bytes(fixture.actorId()),
                timestamp(OCCURRED_AT), "Removed duplicate");
        return fixture;
    }

    static void assertContract(
            JdbcTemplate jdbc,
            ISensitiveEconomicActivityService service,
            Fixture fixture) {
        var initialPage = service.getActivity(null, 0);
        assertEquals(0, initialPage.page());
        assertEquals(10, initialPage.pageSize());
        assertEquals(7, initialPage.totalElements());
        List<SensitiveEconomicActivityResponseDTO> all = initialPage.items();

        assertEquals(List.of(
                fixture.firstRateId(),
                fixture.secondRateId(),
                fixture.pricingId(),
                fixture.correctionId(),
                fixture.editId(),
                fixture.annulmentId(),
                fixture.removalId()
        ), all.stream().map(SensitiveEconomicActivityResponseDTO::eventId).toList());
        assertEquals(List.of(
                SensitiveEconomicEventType.NIGHTLY_RATE_CHANGED,
                SensitiveEconomicEventType.NIGHTLY_RATE_CHANGED,
                SensitiveEconomicEventType.PRICING_OVERRIDE,
                SensitiveEconomicEventType.AGREED_AMOUNT_CORRECTED,
                SensitiveEconomicEventType.PAYMENT_EDITED,
                SensitiveEconomicEventType.PAYMENT_ANNULLED,
                SensitiveEconomicEventType.PAYMENT_REMOVED
        ), all.stream().map(SensitiveEconomicActivityResponseDTO::eventType).toList());
        assertTrue(all.stream().allMatch(event -> OCCURRED_AT.equals(
                event.occurredAt())));
        assertEquals(7, all.stream()
                .map(event -> event.eventType() + ":" + event.eventId())
                .distinct()
                .count());

        NightlyRateChangedActivityDTO rate = assertInstanceOf(
                NightlyRateChangedActivityDTO.class, all.get(0));
        assertNull(rate.affectedContext());
        assertEquals(new BigDecimal("10"), rate.previousRate());
        PricingOverrideActivityDTO pricing = assertInstanceOf(
                PricingOverrideActivityDTO.class, all.get(2));
        assertEquals(new BigDecimal("10"), pricing.retainedNightlyRate());
        assertEquals(new BigDecimal("15"), pricing.agreedAmount());
        AgreedAmountCorrectedActivityDTO correction = assertInstanceOf(
                AgreedAmountCorrectedActivityDTO.class, all.get(3));
        assertEquals(new BigDecimal("16"), correction.newAgreedAmount());
        PaymentEditedActivityDTO edit = assertInstanceOf(
                PaymentEditedActivityDTO.class, all.get(4));
        assertEquals(new BigDecimal("5"), edit.previousAmount());
        assertEquals(new BigDecimal("6"), edit.newAmount());
        PaymentAnnulledActivityDTO annulment = assertInstanceOf(
                PaymentAnnulledActivityDTO.class, all.get(5));
        assertEquals(new BigDecimal("7"), annulment.amount());
        PaymentRemovedActivityDTO removal = assertInstanceOf(
                PaymentRemovedActivityDTO.class, all.get(6));
        assertEquals(new BigDecimal("8"), removal.amount());
        assertTrue(removal.annulled());

        for (SensitiveEconomicActivityResponseDTO event : all.subList(2, 7)) {
            assertEquals(fixture.stayId(), event.affectedContext().stayId());
            assertEquals(fixture.ownerId(), event.affectedContext().owner().id());
            assertEquals(List.of(fixture.firstCatId(), fixture.secondCatId()),
                    event.affectedContext().cats().stream()
                            .map(cat -> cat.id())
                            .toList());
        }

        SensitiveEconomicActivityFilter combined =
                new SensitiveEconomicActivityFilter(
                        fixture.actorId(),
                        OCCURRED_AT,
                        OCCURRED_AT.plusNanos(1_000),
                        SensitiveEconomicEventType.PAYMENT_REMOVED,
                        fixture.ownerId(),
                        fixture.secondCatId(),
                        fixture.stayId()
                );
        assertEquals(List.of(fixture.removalId()),
                service.getActivity(combined).stream()
                        .map(SensitiveEconomicActivityResponseDTO::eventId)
                        .toList());
        assertEquals(2, service.getActivity(
                new SensitiveEconomicActivityFilter(
                        null,
                        OCCURRED_AT,
                        null,
                        SensitiveEconomicEventType.NIGHTLY_RATE_CHANGED,
                        null,
                        null,
                        null
                )
        ).size());
        assertTrue(service.getActivity(
                new SensitiveEconomicActivityFilter(
                        null,
                        null,
                        OCCURRED_AT,
                        null,
                        null,
                        null,
                        null
                )
        ).isEmpty());
        assertEquals(5, service.getActivity(
                new SensitiveEconomicActivityFilter(
                        null,
                        null,
                        null,
                        null,
                        fixture.ownerId(),
                        null,
                        null
                )
        ).size());
        assertTrue(service.getActivity(
                new SensitiveEconomicActivityFilter(
                        null,
                        null,
                        null,
                        null,
                        null,
                        UUID.randomUUID(),
                        null
                )
        ).isEmpty());

        Set<UUID> excludedIds = Set.of(
                uuid("00000000-0000-0000-0000-000000000060"),
                uuid("00000000-0000-0000-0000-000000000061"),
                uuid("00000000-0000-0000-0000-000000000062"),
                uuid("00000000-0000-0000-0000-000000000063"),
                uuid("00000000-0000-0000-0000-000000000064"),
                uuid("00000000-0000-0000-0000-000000000065")
        );
        assertFalse(all.stream().anyMatch(event ->
                excludedIds.contains(event.eventId())));
        assertEquals(0, jdbc.queryForObject(
                "select count(*) from stays", Integer.class));
        assertEquals(0, jdbc.queryForObject(
                "select count(*) from owners", Integer.class));
        assertEquals(0, jdbc.queryForObject(
                "select count(*) from cats", Integer.class));

        for (int index = 70; index < 75; index++) {
            insertRateChange(jdbc,
                    uuid(String.format("00000000-0000-0000-0000-%012d", index)),
                    "ONE_CAT", "10", "11", fixture);
        }
        var firstPage = service.getActivity(null, 0);
        var secondPage = service.getActivity(null, 1);
        assertEquals(12, firstPage.totalElements());
        assertEquals(12, secondPage.totalElements());
        assertEquals(10, firstPage.items().size());
        assertEquals(2, secondPage.items().size());
        assertEquals(12, java.util.stream.Stream.concat(
                        firstPage.items().stream(), secondPage.items().stream())
                .map(event -> event.eventType() + ":" + event.eventId())
                .distinct().count());
    }

    private static UUID context(
            JdbcTemplate jdbc,
            Fixture fixture,
            int index) {
        UUID contextId = UUID.fromString(String.format(
                "10000000-0000-0000-0000-%012d", index));
        jdbc.update("""
                INSERT INTO sensitive_stay_contexts (
                    id, stay_id, owner_id, owner_full_name,
                    stay_start_at, stay_end_at, stay_cancelled_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?)
                """,
                bytes(contextId), bytes(fixture.stayId()),
                bytes(fixture.ownerId()), "Deleted Owner",
                Timestamp.valueOf(STAY_START), Timestamp.valueOf(STAY_END), null);
        insertContextCat(
                jdbc, contextId, fixture.secondCatId(), "Second Cat");
        insertContextCat(
                jdbc, contextId, fixture.firstCatId(), "First Cat");
        return contextId;
    }

    private static void insertContextCat(
            JdbcTemplate jdbc,
            UUID contextId,
            UUID catId,
            String name) {
        jdbc.update("""
                INSERT INTO sensitive_stay_context_cats (
                    context_id, cat_id, cat_name
                ) VALUES (?, ?, ?)
                """, bytes(contextId), bytes(catId), name);
    }

    private static void insertUser(
            JdbcTemplate jdbc,
            UUID id,
            String username) {
        jdbc.update("""
                INSERT INTO user_accounts (
                    id, username, password_hash, role, enabled,
                    created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?)
                """,
                bytes(id), username, "test-hash", "ADMIN", true,
                timestamp(REGISTERED_AT), timestamp(REGISTERED_AT));
    }

    private static void insertRateChange(
            JdbcTemplate jdbc,
            UUID id,
            String category,
            String previous,
            String next,
            Fixture fixture) {
        jdbc.update("""
                INSERT INTO nightly_reference_rate_changes (
                    id, category, previous_nightly_rate, new_nightly_rate,
                    changed_by_id, changed_at
                ) VALUES (?, ?, ?, ?, ?, ?)
                """,
                bytes(id), category, amount(previous), amount(next),
                bytes(fixture.actorId()), timestamp(OCCURRED_AT));
    }

    private static void insertPricing(
            JdbcTemplate jdbc,
            UUID id,
            UUID contextId,
            String retainedRate,
            long nights,
            String agreedAmount,
            String reason,
            Fixture fixture) {
        jdbc.update("""
                INSERT INTO stay_pricing_decisions (
                    id, stay_id, retained_nightly_rate,
                    previous_number_of_nights, new_number_of_nights,
                    previous_agreed_amount, new_agreed_amount,
                    decided_by_id, decided_at, reason, sensitive_context_id
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                bytes(id), bytes(fixture.stayId()), amount(retainedRate),
                null, nights, null, amount(agreedAmount),
                bytes(fixture.actorId()), timestamp(OCCURRED_AT), reason,
                contextId == null ? null : bytes(contextId));
    }

    private static UUID uuid(String value) {
        return UUID.fromString(value);
    }

    private static byte[] bytes(UUID value) {
        return ByteBuffer.allocate(16)
                .putLong(value.getMostSignificantBits())
                .putLong(value.getLeastSignificantBits())
                .array();
    }

    private static Timestamp timestamp(Instant instant) {
        return Timestamp.from(instant);
    }

    private static BigDecimal amount(String value) {
        return value == null ? null : new BigDecimal(value);
    }

    record Fixture(
            UUID actorId,
            UUID registrantId,
            UUID stayId,
            UUID ownerId,
            UUID firstCatId,
            UUID secondCatId,
            UUID firstRateId,
            UUID secondRateId,
            UUID pricingId,
            UUID correctionId,
            UUID editId,
            UUID annulmentId,
            UUID removalId) {

        UserAccount actor() {
            return UserAccount.builder()
                    .id(actorId)
                    .username("query-admin")
                    .role(UserRole.ADMIN)
                    .enabled(true)
                    .build();
        }
    }
}
