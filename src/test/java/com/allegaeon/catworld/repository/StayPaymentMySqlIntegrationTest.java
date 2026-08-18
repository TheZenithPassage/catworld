package com.allegaeon.catworld.repository;

import com.allegaeon.catworld.dto.PaymentEditRequestDTO;
import com.allegaeon.catworld.dto.PaymentRegistrationRequestDTO;
import com.allegaeon.catworld.dto.PricingDecisionRequestDTO;
import com.allegaeon.catworld.exception.ConflictException;
import com.allegaeon.catworld.model.Owner;
import com.allegaeon.catworld.model.Stay;
import com.allegaeon.catworld.model.StayPayment;
import com.allegaeon.catworld.model.StayPaymentEdit;
import com.allegaeon.catworld.model.UserAccount;
import com.allegaeon.catworld.model.UserRole;
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
import java.util.Collections;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicReference;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertInstanceOf;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.when;

@EnabledIfEnvironmentVariable(
        named = "CATWORLD_NATIVE_MYSQL_URL",
        matches = ".+"
)
@SpringBootTest(properties = {
        "spring.datasource.driver-class-name=com.mysql.cj.jdbc.Driver",
        "spring.jpa.database-platform=org.hibernate.dialect.MySQLDialect",
        "spring.jpa.hibernate.ddl-auto=validate",
        "spring.flyway.enabled=true",
        "catworld.security.username=native-admin",
        "catworld.security.password=native-password",
        "catworld.security.cors-allowed-origins=http://localhost:4200"
})
class StayPaymentMySqlIntegrationTest {

    private static final Instant MUTATED_AT =
            Instant.parse("2026-07-30T12:00:00Z");

    @DynamicPropertySource
    static void nativeMySqlProperties(DynamicPropertyRegistry registry) {
        registry.add(
                "spring.datasource.url",
                () -> System.getenv("CATWORLD_NATIVE_MYSQL_URL")
        );
        registry.add(
                "spring.datasource.username",
                () -> System.getenv("CATWORLD_NATIVE_MYSQL_USERNAME")
        );
        registry.add(
                "spring.datasource.password",
                () -> System.getenv("CATWORLD_NATIVE_MYSQL_PASSWORD")
        );
    }

    @Autowired
    private StayService stayService;

    @Autowired
    private UserAccountRepository userAccountRepository;

    @Autowired
    private OwnerRepository ownerRepository;

    @Autowired
    private StayRepository stayRepository;

    @Autowired
    private StayPaymentRepository stayPaymentRepository;

    @Autowired
    private StayPaymentEditRepository stayPaymentEditRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @MockitoBean
    private CurrentUserAccountService currentUserAccountService;

    @MockitoBean
    private Clock clock;

    @BeforeEach
    void resetData() {
        jdbcTemplate.update("delete from stay_payment_removals");
        jdbcTemplate.update("delete from stay_payment_annulments");
        jdbcTemplate.update("delete from stay_payment_edits");
        jdbcTemplate.update("delete from stay_payments");
        jdbcTemplate.update("delete from stay_agreed_amount_corrections");
        jdbcTemplate.update("delete from stay_pricing_decisions");
        jdbcTemplate.update("delete from sensitive_stay_context_cats");
        jdbcTemplate.update("delete from sensitive_stay_contexts");
        jdbcTemplate.update("delete from nightly_reference_rate_changes");
        jdbcTemplate.update("delete from stay_cat");
        jdbcTemplate.update("delete from stays");
        jdbcTemplate.update("delete from cats");
        jdbcTemplate.update("delete from vets");
        jdbcTemplate.update("delete from owners");
        jdbcTemplate.update("update nightly_reference_rates set nightly_rate = null");
        jdbcTemplate.update("delete from user_accounts");
        when(clock.instant()).thenReturn(MUTATED_AT);
    }

    @Test
    void fullFlywaySchemaPreservesExactValuesAndRollsBackFailedAudit() {
        assertEquals(
                List.of("1", "2", "3", "4", "5", "6", "7", "8"),
                jdbcTemplate.queryForList(
                        """
                        select version
                        from flyway_schema_history
                        where success = 1 and version is not null
                        order by installed_rank
                        """,
                        String.class
                )
        );
        assertEquals(
                "decimal",
                jdbcTemplate.queryForObject(
                        """
                        select data_type
                        from information_schema.columns
                        where table_schema = database()
                          and table_name = 'stay_payments'
                          and column_name = 'amount'
                        """,
                        String.class
                )
        );
        assertEquals(
                19,
                jdbcTemplate.queryForObject(
                        """
                        select numeric_precision
                        from information_schema.columns
                        where table_schema = database()
                          and table_name = 'stay_payments'
                          and column_name = 'amount'
                        """,
                        Integer.class
                )
        );
        assertEquals(
                0,
                jdbcTemplate.queryForObject(
                        """
                        select numeric_scale
                        from information_schema.columns
                        where table_schema = database()
                          and table_name = 'stay_payments'
                          and column_name = 'amount'
                        """,
                        Integer.class
                )
        );

        Fixture fixture = createFixture(new BigDecimal("100"));
        when(currentUserAccountService.getCurrentUserAccount())
                .thenReturn(fixture.actor());
        stayService.registerPayment(
                fixture.stay().getId(),
                registration(new BigDecimal("40"))
        );
        StayPayment payment = payments(fixture.stay().getId()).get(0);
        stayService.editPayment(
                fixture.stay().getId(),
                payment.getId(),
                PaymentEditRequestDTO.builder()
                        .amount(new BigDecimal("45"))
                        .reason("Native exact edit")
                        .build()
        );

        StayPayment exactPayment = payments(fixture.stay().getId()).get(0);
        StayPaymentEdit exactEdit =
                stayPaymentEditRepository
                        .findAllByStayIdOrderByEditedAtAsc(
                                fixture.stay().getId()
                        )
                        .get(0);
        assertEquals(new BigDecimal("45"), exactPayment.getAmount());
        assertEquals(0, exactPayment.getAmount().scale());
        assertEquals(new BigDecimal("40"), exactEdit.getPreviousAmount());
        assertEquals(new BigDecimal("45"), exactEdit.getNewAmount());
        assertEquals(0, exactEdit.getPreviousAmount().scale());
        assertEquals(0, exactEdit.getNewAmount().scale());

        when(currentUserAccountService.getCurrentUserAccount())
                .thenReturn(missingAdmin());
        assertThrows(
                RuntimeException.class,
                () -> stayService.editPayment(
                        fixture.stay().getId(),
                        payment.getId(),
                        PaymentEditRequestDTO.builder()
                                .amount(new BigDecimal("50"))
                                .reason("Native rollback proof")
                                .build()
                )
        );

        assertEquals(
                new BigDecimal("45"),
                jdbcTemplate.queryForObject(
                        "select amount from stay_payments",
                        BigDecimal.class
                )
        );
        assertEquals(1, stayPaymentEditRepository.count());
    }

    @Test
    void concurrentRegistrationsSerializeAtTheSharedStayLock() throws Exception {
        Fixture fixture = createFixture(new BigDecimal("100"));
        when(currentUserAccountService.getCurrentUserAccount())
                .thenReturn(fixture.actor());
        CountDownLatch ready = new CountDownLatch(2);
        CountDownLatch start = new CountDownLatch(1);
        ExecutorService executor = Executors.newFixedThreadPool(2);

        try {
            Future<String> first = registrationTask(
                    executor,
                    fixture.stay().getId(),
                    ready,
                    start
            );
            Future<String> second = registrationTask(
                    executor,
                    fixture.stay().getId(),
                    ready,
                    start
            );
            assertTrue(ready.await(5, TimeUnit.SECONDS));
            start.countDown();

            List<String> outcomes = List.of(
                    futureOutcome(first),
                    futureOutcome(second)
            );
            assertEquals(1, Collections.frequency(outcomes, "committed"));
            assertEquals(1, Collections.frequency(outcomes, "conflict"));
        } finally {
            executor.shutdownNow();
        }

        assertEquals(
                new BigDecimal("70"),
                stayPaymentRepository.sumActiveAmountByStayId(
                        fixture.stay().getId()
                )
        );
        assertEquals(1, payments(fixture.stay().getId()).size());
    }

    @Test
    void paymentHoldingStayLockForcesDownwardCorrectionToSeeCommittedTotal()
            throws Exception {
        Fixture fixture = createFixture(new BigDecimal("100"));
        AtomicReference<Thread> paymentThread = new AtomicReference<>();
        AtomicReference<Thread> correctionThread = new AtomicReference<>();
        CountDownLatch paymentReachedPostLockAuthorization =
                new CountDownLatch(1);
        CountDownLatch releasePaymentAuthorization = new CountDownLatch(1);
        CountDownLatch correctionInvoked = new CountDownLatch(1);
        CountDownLatch correctionReachedPostLockAuthorization =
                new CountDownLatch(1);
        ExecutorService executor = Executors.newFixedThreadPool(2);
        when(currentUserAccountService.getCurrentUserAccount())
                .thenAnswer(invocation -> {
                    Thread current = Thread.currentThread();
                    if (current == paymentThread.get()) {
                        paymentReachedPostLockAuthorization.countDown();
                        await(releasePaymentAuthorization);
                    }
                    if (current == correctionThread.get()) {
                        correctionReachedPostLockAuthorization.countDown();
                    }
                    return fixture.actor();
                });

        try {
            Future<String> payment = executor.submit(() -> {
                paymentThread.set(Thread.currentThread());
                stayService.registerPayment(
                        fixture.stay().getId(),
                        registration(new BigDecimal("60"))
                );
                return "committed";
            });
            assertTrue(paymentReachedPostLockAuthorization.await(
                    5,
                    TimeUnit.SECONDS
            ));

            Future<String> correction = executor.submit(() -> {
                correctionThread.set(Thread.currentThread());
                correctionInvoked.countDown();
                try {
                    stayService.correctAgreedAmount(
                            fixture.stay().getId(),
                            PricingDecisionRequestDTO.builder()
                                    .agreedAmount(new BigDecimal("50"))
                                    .reason("Contending downward correction")
                                    .build()
                    );
                    return "committed";
                } catch (ConflictException exception) {
                    return "conflict";
                }
            });
            assertTrue(correctionInvoked.await(5, TimeUnit.SECONDS));
            assertFalse(
                    correctionReachedPostLockAuthorization.await(
                            1,
                            TimeUnit.SECONDS
                    ),
                    "Correction reached authorization while payment held the stay lock"
            );
            releasePaymentAuthorization.countDown();

            assertEquals("committed", payment.get(10, TimeUnit.SECONDS));
            assertTrue(correctionReachedPostLockAuthorization.await(
                    5,
                    TimeUnit.SECONDS
            ));
            assertEquals("conflict", correction.get(10, TimeUnit.SECONDS));
        } finally {
            releasePaymentAuthorization.countDown();
            executor.shutdownNow();
        }

        assertEquals(
                new BigDecimal("100"),
                stayRepository.findById(fixture.stay().getId())
                        .orElseThrow()
                        .getAgreedAmount()
        );
        assertEquals(
                new BigDecimal("60"),
                stayPaymentRepository.sumActiveAmountByStayId(
                        fixture.stay().getId()
                )
        );
    }

    private Future<String> registrationTask(
            ExecutorService executor,
            UUID stayId,
            CountDownLatch ready,
            CountDownLatch start) {
        return executor.submit(() -> {
            ready.countDown();
            await(start);
            try {
                stayService.registerPayment(
                        stayId,
                        registration(new BigDecimal("70"))
                );
                return "committed";
            } catch (ConflictException exception) {
                return "conflict";
            }
        });
    }

    private String futureOutcome(Future<String> future) throws Exception {
        try {
            return future.get(10, TimeUnit.SECONDS);
        } catch (ExecutionException exception) {
            assertInstanceOf(RuntimeException.class, exception.getCause());
            throw exception;
        }
    }

    private void await(CountDownLatch latch) {
        try {
            if (!latch.await(5, TimeUnit.SECONDS)) {
                throw new IllegalStateException("Timed out awaiting race gate");
            }
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("Race gate interrupted", exception);
        }
    }

    private Fixture createFixture(BigDecimal agreedAmount) {
        UserAccount actor = userAccountRepository.saveAndFlush(
                UserAccount.builder()
                        .username("native-payment-admin-" + UUID.randomUUID())
                        .passwordHash(passwordEncoder.encode("password"))
                        .role(UserRole.ADMIN)
                        .enabled(true)
                        .build()
        );
        Owner owner = ownerRepository.saveAndFlush(
                Owner.builder()
                        .fullName("Native Payment Owner")
                        .primaryPhone("555-0197")
                        .createdBy(actor)
                        .build()
        );
        LocalDateTime startAt = LocalDateTime.of(2026, 8, 1, 12, 0);
        Stay stay = stayRepository.saveAndFlush(
                Stay.builder()
                        .startAt(startAt)
                        .endAt(startAt.plusDays(2))
                        .retainedNightlyRate(new BigDecimal("50"))
                        .agreedAmount(agreedAmount)
                        .owner(owner)
                        .createdBy(actor)
                        .build()
        );
        return new Fixture(actor, stay);
    }

    private PaymentRegistrationRequestDTO registration(BigDecimal amount) {
        return PaymentRegistrationRequestDTO.builder()
                .amount(amount)
                .paymentDate(LocalDate.of(2026, 7, 30))
                .build();
    }

    private List<StayPayment> payments(UUID stayId) {
        return stayPaymentRepository
                .findAllByStay_IdOrderByCreatedAtAscIdAsc(stayId);
    }

    private UserAccount missingAdmin() {
        return UserAccount.builder()
                .id(UUID.randomUUID())
                .username("missing-native-admin")
                .role(UserRole.ADMIN)
                .enabled(true)
                .build();
    }

    private record Fixture(UserAccount actor, Stay stay) {
    }
}
