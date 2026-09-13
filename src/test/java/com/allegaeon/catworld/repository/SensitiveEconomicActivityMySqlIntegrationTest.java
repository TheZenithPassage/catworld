package com.allegaeon.catworld.repository;

import com.allegaeon.catworld.dto.PaymentRegistrationRequestDTO;
import com.allegaeon.catworld.dto.PaymentRemovalRequestDTO;
import com.allegaeon.catworld.dto.sensitiveactivity.PricingOverrideActivityDTO;
import com.allegaeon.catworld.dto.sensitiveactivity.SensitiveEconomicEventType;
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
import java.util.List;
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
        assertEquals(List.of("1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"),
                jdbc.queryForList("""
                        select version from flyway_schema_history
                        where success = 1 and version is not null
                        order by installed_rank
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
        UserAccount actor = userRepository.saveAndFlush(UserAccount.builder()
                .username("native-audit-" + UUID.randomUUID())
                .passwordHash(passwordEncoder.encode("password"))
                .role(UserRole.ADMIN).enabled(true).build());
        Owner owner = ownerRepository.saveAndFlush(Owner.builder()
                .fullName("Native Owner").primaryPhone("555-0144")
                .createdBy(actor).build());
        LocalDateTime start = LocalDateTime.now().plusDays(2)
                .withSecond(0).withNano(0);
        Stay stay = stayRepository.saveAndFlush(Stay.builder()
                .startAt(start).endAt(start.plusDays(2))
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
