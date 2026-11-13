package com.allegaeon.catworld.repository;

import com.allegaeon.catworld.dto.PaymentRegistrationRequestDTO;
import com.allegaeon.catworld.dto.PaymentRemovalRequestDTO;
import com.allegaeon.catworld.dto.StayDateFilter;
import com.allegaeon.catworld.dto.StayDateMatchMode;
import com.allegaeon.catworld.dto.StayUpdateDTO;
import com.allegaeon.catworld.dto.sensitiveactivity.PaymentRemovedActivityDTO;
import com.allegaeon.catworld.dto.sensitiveactivity.PricingOverrideActivityDTO;
import com.allegaeon.catworld.dto.sensitiveactivity.SensitiveEconomicActivityFilter;
import com.allegaeon.catworld.dto.sensitiveactivity.SensitiveEconomicEventType;
import com.allegaeon.catworld.exception.ConflictException;
import com.allegaeon.catworld.exception.ForbiddenException;
import com.allegaeon.catworld.model.*;
import com.allegaeon.catworld.security.CurrentUserAccountService;
import com.allegaeon.catworld.service.ISensitiveEconomicActivityService;
import com.allegaeon.catworld.service.StayService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

import java.math.BigDecimal;
import java.nio.ByteBuffer;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicReference;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;

@EnabledIfEnvironmentVariable(named = "CATWORLD_NATIVE_MYSQL_URL", matches = ".+")
@SpringBootTest(properties = {
        "spring.datasource.driver-class-name=com.mysql.cj.jdbc.Driver",
        "spring.jpa.database-platform=org.hibernate.dialect.MySQLDialect",
        "spring.jpa.hibernate.ddl-auto=validate",
        "spring.flyway.enabled=true",
        "catworld.security.username=native-admin",
        "catworld.security.password=native-password",
        "catworld.security.cors-allowed-origins=http://localhost:4200"
})
class SensitiveEconomicActivityMySqlIntegrationTest {

    @DynamicPropertySource
    static void nativeProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url",
                () -> System.getenv("CATWORLD_NATIVE_MYSQL_URL"));
        registry.add("spring.datasource.username",
                () -> System.getenv("CATWORLD_NATIVE_MYSQL_USERNAME"));
        registry.add("spring.datasource.password",
                () -> System.getenv("CATWORLD_NATIVE_MYSQL_PASSWORD"));
    }

    @Autowired StayService stayService;
    @Autowired UserAccountRepository userRepository;
    @Autowired OwnerRepository ownerRepository;
    @Autowired StayRepository stayRepository;
    @Autowired StayPaymentRepository paymentRepository;
    @Autowired StayPaymentRemovalRepository removalRepository;
    @Autowired ISensitiveEconomicActivityService sensitiveEconomicActivityService;
    @Autowired PasswordEncoder passwordEncoder;
    @Autowired JdbcTemplate jdbc;
    @MockitoBean CurrentUserAccountService currentUserAccountService;
    @MockitoBean Clock clock;

    @BeforeEach
    void resetData() {
        when(clock.getZone()).thenReturn(ZoneId.of("America/Argentina/Buenos_Aires"));
        jdbc.update("delete from stay_payment_removals");
        jdbc.update("delete from stay_payment_annulments");
        jdbc.update("delete from stay_payment_edits");
        jdbc.update("delete from stay_payments");
        jdbc.update("delete from stay_agreed_amount_corrections");
        jdbc.update("delete from stay_pricing_decisions");
        jdbc.update("delete from sensitive_stay_context_cats");
        jdbc.update("delete from sensitive_stay_contexts");
        jdbc.update("delete from nightly_reference_rate_changes");
        jdbc.update("delete from stay_cat");
        jdbc.update("delete from stays");
        jdbc.update("delete from cats");
        jdbc.update("delete from vets");
        jdbc.update("delete from owners");
        jdbc.update("update nightly_reference_rates set nightly_rate = null");
        jdbc.update("delete from user_accounts");
        when(clock.instant()).thenReturn(Instant.parse("2026-08-02T12:00:00Z"));
    }

    @Test
    void nativeV10UsesExactStorageAndRemovalEvidenceSurvivesSafeDeletion() {
        assertEquals(List.of("1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13"),
                jdbc.queryForList("""
                        select version from flyway_schema_history
                        where success = 1 and version is not null
                        order by installed_rank
                        limit 13
                        """, String.class));
        assertTrue(jdbc.queryForObject("select version()", String.class)
                .startsWith("8."));
        assertEquals("REPEATABLE-READ", jdbc.queryForObject(
                "select @@transaction_isolation", String.class));
        assertEquals(0, jdbc.queryForObject("""
                select numeric_scale from information_schema.columns
                where table_schema = database()
                  and table_name = 'stay_payment_removals'
                  and column_name = 'amount'
                """, Integer.class));

        Fixture fixture = fixture();
        when(currentUserAccountService.getCurrentUserAccount())
                .thenReturn(fixture.actor());
        stayService.registerPayment(fixture.stay().getId(), registration("40"));
        StayPayment payment = payments(fixture.stay().getId()).get(0);
        stayService.removePayment(fixture.stay().getId(), payment.getId(),
                PaymentRemovalRequestDTO.builder().reason("Native removal").build());
        stayService.deleteStay(fixture.stay().getId());
        ownerRepository.deleteById(fixture.owner().getId());
        ownerRepository.flush();

        assertEquals(0, paymentRepository.count());
        assertFalse(stayRepository.existsById(fixture.stay().getId()));
        assertEquals(new BigDecimal("40"), jdbc.queryForObject(
                "select amount from stay_payment_removals", BigDecimal.class));
        assertEquals("Native Owner", jdbc.queryForObject("""
                select c.owner_full_name
                from sensitive_stay_contexts c
                join stay_payment_removals r on r.sensitive_context_id = c.id
                """, String.class));
    }

    @Test
    void readsUtcAuditInstantsAndFiltersTheirExactBounds() {
        Fixture fixture = fixture();
        when(currentUserAccountService.getCurrentUserAccount()).thenReturn(fixture.actor());
        stayService.registerPayment(fixture.stay().getId(), registration("40"));
        UUID stayId = fixture.stay().getId();
        UUID paymentId = payments(stayId).getFirst().getId();
        Instant registeredAt = Instant.parse("2026-08-02T10:15:20.123456Z");
        Instant removedAt = Instant.parse("2026-08-02T12:34:56.654321Z");
        jdbc.update("""
                update stay_payments set created_at = '2026-08-02 10:15:20.123456'
                where id = ?
                """, uuidBytes(paymentId));
        when(clock.instant()).thenReturn(removedAt);
        stayService.removePayment(stayId, paymentId,
                PaymentRemovalRequestDTO.builder().reason("Audit timestamp regression").build());

        var unfiltered = sensitiveEconomicActivityService.getActivity(
                removalFilter(stayId, null, null), 0);
        var event = assertInstanceOf(PaymentRemovedActivityDTO.class, unfiltered.items().getFirst());
        assertAll(
                () -> assertEquals(removedAt, event.occurredAt()),
                () -> assertEquals(registeredAt, event.registeredAt()),
                () -> assertEquals(fixture.stay().getStartAt(), event.affectedContext().startAt()),
                () -> assertEquals(fixture.stay().getEndAt(), event.affectedContext().endAt()),
                () -> {
                    var matching = sensitiveEconomicActivityService.getActivity(
                            removalFilter(stayId, removedAt, removedAt.plusNanos(1_000)), 0);
                    assertEquals(1, matching.totalElements());
                    assertEquals(List.of(event), matching.items());
                },
                () -> assertEquals(0, sensitiveEconomicActivityService.getActivity(
                        removalFilter(stayId, null, removedAt), 0).totalElements()),
                () -> assertEquals(1, sensitiveEconomicActivityService.getActivity(
                        removalFilter(stayId, null, removedAt.plusNanos(1)), 0).totalElements()),
                () -> assertEquals(0, sensitiveEconomicActivityService.getActivity(
                        removalFilter(stayId, removedAt.plusNanos(1), null), 0).totalElements()));
    }

    private SensitiveEconomicActivityFilter removalFilter(UUID stayId, Instant from, Instant to) {
        return new SensitiveEconomicActivityFilter(null, from, to,
                SensitiveEconomicEventType.PAYMENT_REMOVED, null, null, stayId);
    }

    @Test
    void filtersStayAndAuditDatesAcrossBusinessMidnight() {
        LocalDateTime start = LocalDateTime.parse("2026-11-30T23:30:00");
        LocalDateTime end = LocalDateTime.parse("2026-12-01T00:30:00");
        Fixture fixture = fixture(start, end);
        UUID stayId = fixture.stay().getId();
        assertEquals(start, storedStayTime(stayId, "start_at"));
        assertEquals(end, storedStayTime(stayId, "end_at"));
        when(currentUserAccountService.getCurrentUserAccount()).thenReturn(fixture.actor());
        stayService.registerPayment(stayId, registration("40"));
        stayService.removePayment(stayId, payments(stayId).getFirst().getId(),
                PaymentRemovalRequestDTO.builder().reason("Stay date filter regression").build());

        LocalDate november = LocalDate.parse("2026-11-30");
        LocalDate december = LocalDate.parse("2026-12-01");
        var overview = stayService.getStayOverview(0, Set.of(StayStatus.RESERVED),
                null, null, null, null, new StayDateFilter(november, november, StayDateMatchMode.OVERLAPS));
        assertEquals(List.of(stayId), overview.items().stream().map(item -> item.id()).toList());
        var event = assertInstanceOf(PaymentRemovedActivityDTO.class, sensitiveEconomicActivityService
                .getActivity(removalFilter(stayId, null, null), 0).items().getFirst());
        assertAll(
                () -> assertEquals(start, event.affectedContext().startAt()),
                () -> assertEquals(end, event.affectedContext().endAt()),
                () -> assertEquals(1, countRemovals(stayId, november, november, StayDateMatchMode.OVERLAPS)),
                () -> assertEquals(1, countRemovals(stayId, december, december, StayDateMatchMode.OVERLAPS)),
                () -> assertEquals(0, countRemovals(stayId, december, december, StayDateMatchMode.STAY_WITHIN_RANGE)),
                () -> assertEquals(1, countRemovals(stayId, november, december, StayDateMatchMode.STAY_WITHIN_RANGE)),
                () -> assertEquals(1, countRemovals(stayId, november, december, StayDateMatchMode.RANGE_WITHIN_STAY)));
    }

    @Test
    void madridRepeatedHourDoesNotChangeBusinessStatusOrMutationPermissions() {
        LocalDateTime firstDeparture = LocalDateTime.parse("2027-10-31T00:30:00");
        LocalDateTime secondDeparture = firstDeparture.plusHours(1);
        LocalDateTime reservedArrival = LocalDateTime.parse("2027-10-31T01:15:00");
        Fixture closed = fixture(firstDeparture.minusDays(1), firstDeparture);
        Fixture open = fixture(firstDeparture.minusDays(1), secondDeparture);
        Fixture reserved = fixture(reservedArrival, reservedArrival.plusDays(1));
        UUID closedId = closed.stay().getId();
        UUID openId = open.stay().getId();
        UUID reservedId = reserved.stay().getId();
        when(clock.instant()).thenReturn(Instant.parse("2027-10-31T03:45:00Z"));
        assertEquals(firstDeparture, storedStayTime(closedId, "end_at"));
        assertEquals(secondDeparture, storedStayTime(openId, "end_at"));
        assertEquals(reservedArrival, storedStayTime(reservedId, "start_at"));

        assertStatusFilter(StayStatus.CHECKED_OUT, closedId);
        assertStatusFilter(StayStatus.CHECKED_IN, openId);
        assertStatusFilter(StayStatus.RESERVED, reservedId);

        UserAccount staff = UserAccount.builder().role(UserRole.STAFF).enabled(true).build();
        when(currentUserAccountService.getCurrentUserAccount()).thenReturn(staff);
        assertThrows(ForbiddenException.class, () -> stayService.registerPayment(closedId, registration("40")));
        when(currentUserAccountService.getCurrentUserAccount()).thenReturn(closed.actor());
        assertThrows(ConflictException.class, () -> stayService.updateStay(closedId, StayUpdateDTO.builder()
                .startAt(closed.stay().getStartAt()).endAt(firstDeparture.plusMinutes(5)).build()));
        assertThrows(ConflictException.class, () -> stayService.cancelStay(closedId));
        stayService.cancelStay(openId);
        assertEquals(LocalDateTime.parse("2027-10-31T00:45:00"), storedStayTime(openId, "cancelled_at"));
        assertStatusFilter(StayStatus.CANCELLED, openId);
    }

    @Test
    void editingAnOpenStayReplacesLegacyShiftedWallTimes() {
        Fixture fixture = fixture();
        UUID stayId = fixture.stay().getId();
        jdbc.update("""
                update stays set start_at = '2026-12-01 00:30:00', end_at = '2026-12-03 00:30:00'
                where id = ?
                """, uuidBytes(stayId));
        LocalDateTime correctedArrival = LocalDateTime.parse("2026-11-30T23:30:00");
        LocalDateTime correctedDeparture = LocalDateTime.parse("2026-12-02T23:30:00");
        when(currentUserAccountService.getCurrentUserAccount()).thenReturn(fixture.actor());

        var updated = stayService.updateStay(stayId, StayUpdateDTO.builder()
                .startAt(correctedArrival).endAt(correctedDeparture).build());

        assertEquals(correctedArrival, updated.getStartAt());
        assertEquals(correctedDeparture, updated.getEndAt());
        assertEquals(correctedArrival, storedStayTime(stayId, "start_at"));
        assertEquals(correctedDeparture, storedStayTime(stayId, "end_at"));
    }

    private void assertStatusFilter(StayStatus status, UUID expectedStayId) {
        var result = stayService.getStayOverview(0, Set.of(status), null, null, null, null,
                new StayDateFilter(null, null, null));
        assertEquals(1, result.totalElements());
        assertEquals(expectedStayId, result.items().getFirst().id());
        assertEquals(status, result.items().getFirst().status());
    }

    private LocalDateTime storedStayTime(UUID stayId, String column) {
        return jdbc.queryForObject("select cast(" + column + " as char) from stays where id = ?",
                (row, ignored) -> LocalDateTime.parse(row.getString(1).replace(' ', 'T')), uuidBytes(stayId));
    }

    private long countRemovals(UUID stayId, LocalDate from, LocalDate to, StayDateMatchMode mode) {
        return sensitiveEconomicActivityService.getActivity(new SensitiveEconomicActivityFilter(
                null, null, null, SensitiveEconomicEventType.PAYMENT_REMOVED,
                null, null, stayId, from, to, mode), 0).totalElements();
    }

    @Test
    void databaseUnionAppliesTheFullSensitiveActivityContract() {
        SensitiveEconomicActivityQueryContract.Fixture fixture =
                SensitiveEconomicActivityQueryContract.seed(jdbc);
        when(currentUserAccountService.getCurrentUserAccount())
                .thenReturn(fixture.actor());

        SensitiveEconomicActivityQueryContract.assertContract(
                jdbc,
                sensitiveEconomicActivityService,
                fixture
        );
    }

    @Test
    void nativeAuditUsesCapturedTransferEvidenceAfterLiveStayAndRateChanges() {
        Fixture fixture = fixture();
        UUID contextId = UUID.randomUUID();
        UUID decisionId = UUID.randomUUID();
        jdbc.update("""
                insert into sensitive_stay_contexts (
                    id, stay_id, owner_id, owner_full_name,
                    stay_start_at, stay_end_at, stay_cancelled_at
                ) values (?, ?, ?, ?, ?, ?, ?)
                """, uuidBytes(contextId), uuidBytes(fixture.stay().getId()),
                uuidBytes(fixture.owner().getId()), fixture.owner().getFullName(),
                fixture.stay().getStartAt(), fixture.stay().getEndAt(), null);
        jdbc.update("""
                insert into stay_pricing_decisions (
                    id, stay_id, retained_nightly_rate,
                    arrival_transfer_required, departure_transfer_required,
                    retained_transfer_rate, transfer_waived,
                    previous_number_of_nights, new_number_of_nights,
                    previous_agreed_amount, new_agreed_amount,
                    decided_by_id, decided_at, reason, sensitive_context_id
                ) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, uuidBytes(decisionId), uuidBytes(fixture.stay().getId()),
                new BigDecimal("50"), true, true, new BigDecimal("7"), false,
                2L, 2L, new BigDecimal("100"), new BigDecimal("115"),
                uuidBytes(fixture.actor().getId()), Instant.parse("2026-08-02T12:00:00Z"),
                "Captured transfer override", uuidBytes(contextId));

        jdbc.update("update transfer_rates set transfer_rate = 99 where id = 1");
        jdbc.update("""
                update stays set retained_nightly_rate = 1,
                    retained_transfer_rate = null,
                    arrival_transfer_required = false,
                    departure_transfer_required = false,
                    transfer_waived = true
                where id = ?
                """, uuidBytes(fixture.stay().getId()));
        when(currentUserAccountService.getCurrentUserAccount()).thenReturn(fixture.actor());

        PricingOverrideActivityDTO activity = sensitiveEconomicActivityService.getActivity(
                        new com.allegaeon.catworld.dto.sensitiveactivity.SensitiveEconomicActivityFilter(
                                null, null, null, SensitiveEconomicEventType.PRICING_OVERRIDE,
                                null, null, fixture.stay().getId()), 0)
                .items().stream()
                .filter(item -> item.eventId().equals(decisionId))
                .map(PricingOverrideActivityDTO.class::cast)
                .findFirst().orElseThrow();

        assertTrue(activity.arrivalTransferRequired());
        assertTrue(activity.departureTransferRequired());
        assertFalse(activity.transferWaived());
        assertEquals(new BigDecimal("7"), activity.retainedTransferRate());
        assertEquals(new BigDecimal("14"), activity.transferSuggestedAmount());
        assertEquals(new BigDecimal("114"), activity.suggestedAmount());
        assertEquals(new BigDecimal("115"), activity.agreedAmount());
    }

    @Test
    void paymentRemovalAndStayDeletionProduceOnlySerializedOutcome()
            throws Exception {
        Fixture fixture = fixture();
        when(currentUserAccountService.getCurrentUserAccount())
                .thenReturn(fixture.actor());
        stayService.registerPayment(fixture.stay().getId(), registration("25"));
        StayPayment payment = payments(fixture.stay().getId()).get(0);

        AtomicReference<Thread> removalThread = new AtomicReference<>();
        AtomicReference<Thread> deletionThread = new AtomicReference<>();
        CountDownLatch removalHasLock = new CountDownLatch(1);
        CountDownLatch releaseRemoval = new CountDownLatch(1);
        CountDownLatch deletionReachedAuthorization = new CountDownLatch(1);
        when(currentUserAccountService.getCurrentUserAccount()).thenAnswer(call -> {
            Thread current = Thread.currentThread();
            if (current == removalThread.get()) {
                removalHasLock.countDown();
                await(releaseRemoval);
            }
            if (current == deletionThread.get()) {
                deletionReachedAuthorization.countDown();
            }
            return fixture.actor();
        });

        ExecutorService executor = Executors.newFixedThreadPool(2);
        try {
            Future<?> removal = executor.submit(() -> {
                removalThread.set(Thread.currentThread());
                stayService.removePayment(fixture.stay().getId(), payment.getId(),
                        PaymentRemovalRequestDTO.builder()
                                .reason("Contended removal").build());
            });
            assertTrue(removalHasLock.await(5, TimeUnit.SECONDS));
            Future<?> deletion = executor.submit(() -> {
                deletionThread.set(Thread.currentThread());
                stayService.deleteStay(fixture.stay().getId());
            });
            assertFalse(deletionReachedAuthorization.await(1, TimeUnit.SECONDS));
            releaseRemoval.countDown();
            removal.get(10, TimeUnit.SECONDS);
            assertTrue(deletionReachedAuthorization.await(5, TimeUnit.SECONDS));
            deletion.get(10, TimeUnit.SECONDS);
        } finally {
            releaseRemoval.countDown();
            executor.shutdownNow();
        }

        assertEquals(0, paymentRepository.count());
        assertEquals(1, removalRepository.count());
        assertFalse(stayRepository.existsById(fixture.stay().getId()));
    }

    @Test
    void paymentCreationAndRemovalSerializeThroughSharedStayLock()
            throws Exception {
        Fixture fixture = fixture();
        when(currentUserAccountService.getCurrentUserAccount())
                .thenReturn(fixture.actor());
        stayService.registerPayment(fixture.stay().getId(), registration("25"));
        StayPayment paymentToRemove = payments(fixture.stay().getId()).get(0);

        AtomicReference<Thread> creationThread = new AtomicReference<>();
        AtomicReference<Thread> removalThread = new AtomicReference<>();
        CountDownLatch creationHasLock = new CountDownLatch(1);
        CountDownLatch releaseCreation = new CountDownLatch(1);
        CountDownLatch removalReachedAuthorization = new CountDownLatch(1);
        when(currentUserAccountService.getCurrentUserAccount()).thenAnswer(call -> {
            Thread current = Thread.currentThread();
            if (current == creationThread.get()) {
                creationHasLock.countDown();
                await(releaseCreation);
            }
            if (current == removalThread.get()) {
                removalReachedAuthorization.countDown();
            }
            return fixture.actor();
        });

        ExecutorService executor = Executors.newFixedThreadPool(2);
        try {
            Future<?> creation = executor.submit(() -> {
                creationThread.set(Thread.currentThread());
                stayService.registerPayment(
                        fixture.stay().getId(), registration("30"));
            });
            assertTrue(creationHasLock.await(5, TimeUnit.SECONDS));
            Future<?> removal = executor.submit(() -> {
                removalThread.set(Thread.currentThread());
                stayService.removePayment(
                        fixture.stay().getId(),
                        paymentToRemove.getId(),
                        PaymentRemovalRequestDTO.builder()
                                .reason("Contended creation and removal")
                                .build()
                );
            });
            assertFalse(removalReachedAuthorization.await(1, TimeUnit.SECONDS));
            releaseCreation.countDown();
            creation.get(10, TimeUnit.SECONDS);
            assertTrue(removalReachedAuthorization.await(5, TimeUnit.SECONDS));
            removal.get(10, TimeUnit.SECONDS);
        } finally {
            releaseCreation.countDown();
            executor.shutdownNow();
        }

        List<StayPayment> remainingPayments = payments(fixture.stay().getId());
        assertEquals(1, remainingPayments.size());
        assertEquals(new BigDecimal("30"), remainingPayments.get(0).getAmount());
        assertEquals(1, removalRepository.count());
        assertEquals(new BigDecimal("25"),
                removalRepository.findAll().get(0).getAmount());
    }

    private byte[] uuidBytes(UUID value) {
        return ByteBuffer.allocate(16)
                .putLong(value.getMostSignificantBits())
                .putLong(value.getLeastSignificantBits())
                .array();
    }

    private Fixture fixture() {
        LocalDateTime start = LocalDateTime.now(clock).plusDays(2).withSecond(0).withNano(0);
        return fixture(start, start.plusDays(2));
    }

    private Fixture fixture(LocalDateTime start, LocalDateTime end) {
        UserAccount actor = userRepository.saveAndFlush(UserAccount.builder()
                .username("native-audit-" + UUID.randomUUID())
                .passwordHash(passwordEncoder.encode("password"))
                .role(UserRole.ADMIN).enabled(true).build());
        Owner owner = ownerRepository.saveAndFlush(Owner.builder()
                .fullName("Native Owner").primaryPhone("555-0144")
                .createdBy(actor).build());
        Stay stay = stayRepository.saveAndFlush(Stay.builder()
                .startAt(start).endAt(end)
                .retainedNightlyRate(new BigDecimal("50"))
                .agreedAmount(new BigDecimal("100"))
                .owner(owner).createdBy(actor).build());
        return new Fixture(actor, owner, stay);
    }

    private PaymentRegistrationRequestDTO registration(String amount) {
        return PaymentRegistrationRequestDTO.builder()
                .amount(new BigDecimal(amount))
                .paymentDate(LocalDate.of(2026, 8, 1)).build();
    }

    private List<StayPayment> payments(UUID stayId) {
        return paymentRepository.findAllByStay_IdOrderByCreatedAtAscIdAsc(stayId);
    }

    private void await(CountDownLatch latch) {
        try {
            if (!latch.await(5, TimeUnit.SECONDS)) {
                throw new IllegalStateException("Timed out awaiting race gate");
            }
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException(exception);
        }
    }

    private record Fixture(UserAccount actor, Owner owner, Stay stay) {}
}
