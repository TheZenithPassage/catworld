package com.allegaeon.catworld.repository;

import com.allegaeon.catworld.dto.PaymentRegistrationRequestDTO;
import com.allegaeon.catworld.dto.PaymentRemovalRequestDTO;
import com.allegaeon.catworld.model.*;
import com.allegaeon.catworld.security.CurrentUserAccountService;
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
    void nativeV8UsesExactStorageAndRemovalEvidenceSurvivesSafeDeletion() {
        assertEquals(List.of("1", "2", "3", "4", "5", "6", "7", "8"),
                jdbc.queryForList("""
                        select version from flyway_schema_history
                        where success = 1 and version is not null
                        order by installed_rank
                        """, String.class));
        assertTrue(jdbc.queryForObject("select version()", String.class)
                .startsWith("8.0"));
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
