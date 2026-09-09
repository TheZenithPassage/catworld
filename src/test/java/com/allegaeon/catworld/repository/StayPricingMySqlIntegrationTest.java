package com.allegaeon.catworld.repository;

import com.allegaeon.catworld.dto.PricingDecisionRequestDTO;
import com.allegaeon.catworld.dto.StayCreationPricingPreviewRequestDTO;
import com.allegaeon.catworld.dto.StayDatePricingPreviewRequestDTO;
import com.allegaeon.catworld.dto.StayRequestDTO;
import com.allegaeon.catworld.dto.StayUpdateDTO;
import com.allegaeon.catworld.exception.StalePricingConfirmationException;
import com.allegaeon.catworld.exception.BadRequestException;
import com.allegaeon.catworld.model.Cat;
import com.allegaeon.catworld.model.NightlyReferenceRate;
import com.allegaeon.catworld.model.NightlyReferenceRateCategory;
import com.allegaeon.catworld.model.Owner;
import com.allegaeon.catworld.model.Sex;
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
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertInstanceOf;
import static org.junit.jupiter.api.Assertions.assertTrue;
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
class StayPricingMySqlIntegrationTest {

    @DynamicPropertySource
    static void nativeMySqlProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url",
                () -> System.getenv("CATWORLD_NATIVE_MYSQL_URL"));
        registry.add("spring.datasource.username",
                () -> System.getenv("CATWORLD_NATIVE_MYSQL_USERNAME"));
        registry.add("spring.datasource.password",
                () -> System.getenv("CATWORLD_NATIVE_MYSQL_PASSWORD"));
    }

    @Autowired StayService stayService;
    @Autowired UserAccountRepository userAccountRepository;
    @Autowired OwnerRepository ownerRepository;
    @Autowired CatRepository catRepository;
    @Autowired StayRepository stayRepository;
    @Autowired NightlyReferenceRateRepository nightlyReferenceRateRepository;
    @Autowired PasswordEncoder passwordEncoder;
    @Autowired JdbcTemplate jdbcTemplate;
    @Autowired PlatformTransactionManager transactionManager;
    @MockitoBean CurrentUserAccountService currentUserAccountService;
    @MockitoBean Clock clock;

    @BeforeEach
    void resetData() {
        when(clock.instant()).thenReturn(Instant.parse("2027-01-01T00:00:00Z"));
        jdbcTemplate.update("delete from stay_pricing_decisions");
        jdbcTemplate.update("delete from stay_agreed_amount_corrections");
        jdbcTemplate.update("delete from nightly_reference_rate_changes");
        jdbcTemplate.update("delete from stay_cat");
        jdbcTemplate.update("delete from stay_payments");
        jdbcTemplate.update("delete from stays");
        jdbcTemplate.update("delete from cats");
        jdbcTemplate.update("delete from vets");
        jdbcTemplate.update("delete from owners");
        jdbcTemplate.update("update nightly_reference_rates set nightly_rate = null");
        jdbcTemplate.update("delete from user_accounts");
    }

    @Test
    void creationWaitsForRateMutationAndRejectsItsStaleConfirmation()
            throws Exception {
        UserAccount actor = userAccountRepository.saveAndFlush(UserAccount.builder()
                .username("pricing-lock-" + UUID.randomUUID())
                .passwordHash(passwordEncoder.encode("password"))
                .role(UserRole.ADMIN).enabled(true).build());
        Owner owner = ownerRepository.saveAndFlush(Owner.builder()
                .fullName("Pricing Lock Owner").primaryPhone("555-0199")
                .createdBy(actor).build());
        LocalDateTime startAt = LocalDateTime.of(2027, 8, 1, 12, 0);
        Cat cat = catRepository.saveAndFlush(Cat.builder()
                .name("Lock Cat").birthDate(startAt.minusYears(3).toLocalDate())
                .sex(Sex.FEMALE).owner(owner).createdBy(actor)
                .lastRabiesDate(startAt.plusYears(1).toLocalDate())
                .lastTripleFelineDate(startAt.plusYears(1).toLocalDate())
                .build());
        NightlyReferenceRate rate = nightlyReferenceRateRepository
                .findById(NightlyReferenceRateCategory.ONE_CAT).orElseThrow();
        rate.setNightlyRate(new BigDecimal("10"));
        nightlyReferenceRateRepository.saveAndFlush(rate);
        when(currentUserAccountService.getCurrentUserAccount()).thenReturn(actor);

        Set<UUID> catIds = Set.of(cat.getId());
        var confirmation = stayService.previewCreationPricing(
                StayCreationPricingPreviewRequestDTO.builder()
                        .startAt(startAt).endAt(startAt.plusDays(2))
                        .catIds(catIds).build()).getConfirmation();
        StayRequestDTO request = StayRequestDTO.builder()
                .startAt(startAt).endAt(startAt.plusDays(2)).catIds(catIds)
                .pricingDecision(PricingDecisionRequestDTO.builder()
                        .agreedAmount(new BigDecimal("20")).build())
                .confirmation(confirmation).build();

        CountDownLatch rateLocked = new CountDownLatch(1);
        CountDownLatch allowRateCommit = new CountDownLatch(1);
        TransactionTemplate transaction = new TransactionTemplate(transactionManager);
        ExecutorService executor = Executors.newFixedThreadPool(2);
        try {
            Future<?> rateMutation = executor.submit(() -> transaction.execute(status -> {
                jdbcTemplate.queryForObject(
                        "select nightly_rate from nightly_reference_rates "
                                + "where category = 'ONE_CAT' for update",
                        BigDecimal.class);
                jdbcTemplate.update(
                        "update nightly_reference_rates set nightly_rate = 20 "
                                + "where category = 'ONE_CAT'");
                rateLocked.countDown();
                try {
                    assertTrue(allowRateCommit.await(10, TimeUnit.SECONDS));
                } catch (InterruptedException exception) {
                    Thread.currentThread().interrupt();
                    throw new IllegalStateException(exception);
                }
                return null;
            }));
            assertTrue(rateLocked.await(10, TimeUnit.SECONDS));
            Future<?> creation = executor.submit(() -> stayService.createStay(request));
            Thread.sleep(250);
            assertFalse(creation.isDone(), "creation must wait for the rate row lock");
            allowRateCommit.countDown();
            rateMutation.get(10, TimeUnit.SECONDS);
            ExecutionException failure = org.junit.jupiter.api.Assertions.assertThrows(
                    ExecutionException.class,
                    () -> creation.get(10, TimeUnit.SECONDS));
            assertInstanceOf(StalePricingConfirmationException.class,
                    failure.getCause());
        } finally {
            executor.shutdownNow();
        }

        assertEquals(0, stayRepository.count());
        assertEquals(0, new BigDecimal("20").compareTo(
                nightlyReferenceRateRepository
                        .findById(NightlyReferenceRateCategory.ONE_CAT)
                        .orElseThrow().getNightlyRate()));
    }

    @Test
    void creationWaitsForCanonicalTransferRateLockAndRejectsStaleTransferBasis()
            throws Exception {
        UserAccount actor = userAccountRepository.saveAndFlush(UserAccount.builder()
                .username("transfer-lock-" + UUID.randomUUID()).passwordHash(passwordEncoder.encode("password"))
                .role(UserRole.ADMIN).enabled(true).build());
        Owner owner = ownerRepository.saveAndFlush(Owner.builder().fullName("Transfer Lock Owner")
                .primaryPhone("555-0177").createdBy(actor).build());
        LocalDateTime startAt = LocalDateTime.of(2027, 10, 1, 12, 0);
        Cat cat = catRepository.saveAndFlush(Cat.builder().name("Transfer Lock Cat")
                .birthDate(startAt.minusYears(3).toLocalDate()).sex(Sex.FEMALE).owner(owner).createdBy(actor)
                .lastRabiesDate(startAt.plusYears(1).toLocalDate()).lastTripleFelineDate(startAt.plusYears(1).toLocalDate()).build());
        NightlyReferenceRate nightly = nightlyReferenceRateRepository.findById(NightlyReferenceRateCategory.ONE_CAT).orElseThrow();
        nightly.setNightlyRate(new BigDecimal("10")); nightlyReferenceRateRepository.saveAndFlush(nightly);
        jdbcTemplate.update("update transfer_rates set transfer_rate = 10 where id = 1");
        when(currentUserAccountService.getCurrentUserAccount()).thenReturn(actor);
        Set<UUID> catIds = Set.of(cat.getId());
        var confirmation = stayService.previewCreationPricing(StayCreationPricingPreviewRequestDTO.builder()
                .startAt(startAt).endAt(startAt.plusDays(2)).catIds(catIds).arrivalTransferRequired(true).build()).getConfirmation();
        StayRequestDTO request = StayRequestDTO.builder().startAt(startAt).endAt(startAt.plusDays(2)).catIds(catIds)
                .arrivalTransferRequired(true).pricingDecision(PricingDecisionRequestDTO.builder().agreedAmount(new BigDecimal("30")).build())
                .confirmation(confirmation).build();
        CountDownLatch locked = new CountDownLatch(1), release = new CountDownLatch(1);
        TransactionTemplate transaction = new TransactionTemplate(transactionManager);
        ExecutorService executor = Executors.newFixedThreadPool(2);
        try {
            Future<?> mutation = executor.submit(() -> transaction.execute(status -> {
                jdbcTemplate.queryForObject("select transfer_rate from transfer_rates where id = 1 for update", BigDecimal.class);
                jdbcTemplate.update("update transfer_rates set transfer_rate = 20 where id = 1"); locked.countDown();
                try { assertTrue(release.await(10, TimeUnit.SECONDS)); } catch (InterruptedException e) { Thread.currentThread().interrupt(); throw new IllegalStateException(e); }
                return null;
            }));
            assertTrue(locked.await(10, TimeUnit.SECONDS));
            Future<?> creation = executor.submit(() -> stayService.createStay(request));
            Thread.sleep(250); assertFalse(creation.isDone(), "creation must wait for transfer row lock");
            release.countDown(); mutation.get(10, TimeUnit.SECONDS);
            ExecutionException failure = org.junit.jupiter.api.Assertions.assertThrows(ExecutionException.class, () -> creation.get(10, TimeUnit.SECONDS));
            assertInstanceOf(StalePricingConfirmationException.class, failure.getCause());
        } finally { release.countDown(); executor.shutdownNow(); }
        assertEquals(0, stayRepository.count());
        assertEquals(0, new BigDecimal("20").compareTo(jdbcTemplate.queryForObject("select transfer_rate from transfer_rates where id = 1", BigDecimal.class)));
    }

    @Test
    void updateWaitsForCurrentRateMutationAndPreservesOriginalRate()
            throws Exception {
        UserAccount actor = userAccountRepository.saveAndFlush(UserAccount.builder()
                .username("pricing-update-lock-" + UUID.randomUUID())
                .passwordHash(passwordEncoder.encode("password"))
                .role(UserRole.ADMIN).enabled(true).build());
        Owner owner = ownerRepository.saveAndFlush(Owner.builder()
                .fullName("Pricing Update Lock Owner").primaryPhone("555-0198")
                .createdBy(actor).build());
        LocalDateTime startAt = LocalDateTime.of(2027, 9, 1, 12, 0);
        Cat cat = catRepository.saveAndFlush(Cat.builder()
                .name("Update Lock Cat").birthDate(startAt.minusYears(3).toLocalDate())
                .sex(Sex.FEMALE).owner(owner).createdBy(actor)
                .lastRabiesDate(startAt.plusYears(1).toLocalDate())
                .lastTripleFelineDate(startAt.plusYears(1).toLocalDate())
                .build());
        NightlyReferenceRate rate = nightlyReferenceRateRepository
                .findById(NightlyReferenceRateCategory.ONE_CAT).orElseThrow();
        rate.setNightlyRate(new BigDecimal("10"));
        nightlyReferenceRateRepository.saveAndFlush(rate);
        when(currentUserAccountService.getCurrentUserAccount()).thenReturn(actor);

        Set<UUID> catIds = Set.of(cat.getId());
        var creationConfirmation = stayService.previewCreationPricing(
                StayCreationPricingPreviewRequestDTO.builder()
                        .startAt(startAt).endAt(startAt.plusDays(2))
                        .catIds(catIds).build()).getConfirmation();
        var stay = stayService.createStay(StayRequestDTO.builder()
                .startAt(startAt).endAt(startAt.plusDays(2)).catIds(catIds)
                .pricingDecision(PricingDecisionRequestDTO.builder()
                        .agreedAmount(new BigDecimal("20")).build())
                .confirmation(creationConfirmation).build());
        rate.setNightlyRate(new BigDecimal("20"));
        nightlyReferenceRateRepository.saveAndFlush(rate);

        var updateConfirmation = stayService.previewDateChangePricing(
                stay.getStayId(), StayDatePricingPreviewRequestDTO.builder()
                        .startAt(startAt).endAt(startAt.plusDays(3)).build())
                .getConfirmation();
        updateConfirmation.setRetainedNightlyRate(new BigDecimal("20"));
        updateConfirmation.setSuggestedAmount(new BigDecimal("60"));
        StayUpdateDTO request = StayUpdateDTO.builder()
                .startAt(startAt).endAt(startAt.plusDays(3))
                .pricingDecision(PricingDecisionRequestDTO.builder()
                        .agreedAmount(new BigDecimal("60")).build())
                .confirmation(updateConfirmation).build();

        CountDownLatch rateLocked = new CountDownLatch(1);
        CountDownLatch allowRateCommit = new CountDownLatch(1);
        TransactionTemplate transaction = new TransactionTemplate(transactionManager);
        ExecutorService executor = Executors.newFixedThreadPool(2);
        try {
            Future<?> rateMutation = executor.submit(() -> transaction.execute(status -> {
                jdbcTemplate.queryForObject(
                        "select nightly_rate from nightly_reference_rates "
                                + "where category = 'ONE_CAT' for update",
                        BigDecimal.class);
                jdbcTemplate.update(
                        "update nightly_reference_rates set nightly_rate = 30 "
                                + "where category = 'ONE_CAT'");
                rateLocked.countDown();
                try {
                    assertTrue(allowRateCommit.await(10, TimeUnit.SECONDS));
                } catch (InterruptedException exception) {
                    Thread.currentThread().interrupt();
                    throw new IllegalStateException(exception);
                }
                return null;
            }));
            assertTrue(rateLocked.await(10, TimeUnit.SECONDS));
            Future<?> update = executor.submit(
                    () -> stayService.updateStay(stay.getStayId(), request));
            Thread.sleep(250);
            assertFalse(update.isDone(), "update must wait for the rate row lock");
            allowRateCommit.countDown();
            rateMutation.get(10, TimeUnit.SECONDS);
            ExecutionException failure = org.junit.jupiter.api.Assertions.assertThrows(
                    ExecutionException.class,
                    () -> update.get(10, TimeUnit.SECONDS));
            assertInstanceOf(StalePricingConfirmationException.class,
                    failure.getCause());
        } finally {
            executor.shutdownNow();
        }

        var persisted = stayRepository.findById(stay.getStayId()).orElseThrow();
        assertEquals(0, new BigDecimal("10").compareTo(
                persisted.getRetainedNightlyRate()));
        assertEquals(0, new BigDecimal("20").compareTo(persisted.getAgreedAmount()));
    }

    @Test
    void transferAdditionWaitsForLockedCurrentRateAndRequiresFreshDecision() throws Exception {
        UserAccount actor = userAccountRepository.saveAndFlush(UserAccount.builder().username("transfer-update-" + UUID.randomUUID()).passwordHash(passwordEncoder.encode("password")).role(UserRole.ADMIN).enabled(true).build());
        Owner owner = ownerRepository.saveAndFlush(Owner.builder().fullName("Transfer Update Owner").primaryPhone("555-0176").createdBy(actor).build());
        LocalDateTime start = LocalDateTime.of(2027, 11, 1, 12, 0);
        Cat cat = catRepository.saveAndFlush(Cat.builder().name("Transfer Update Cat").birthDate(start.minusYears(2).toLocalDate()).sex(Sex.FEMALE).owner(owner).createdBy(actor).lastRabiesDate(start.plusYears(1).toLocalDate()).lastTripleFelineDate(start.plusYears(1).toLocalDate()).build());
        NightlyReferenceRate nightly = nightlyReferenceRateRepository.findById(NightlyReferenceRateCategory.ONE_CAT).orElseThrow(); nightly.setNightlyRate(new BigDecimal("10")); nightlyReferenceRateRepository.saveAndFlush(nightly);
        jdbcTemplate.update("update transfer_rates set transfer_rate = null where id = 1"); when(currentUserAccountService.getCurrentUserAccount()).thenReturn(actor);
        Set<UUID> cats = Set.of(cat.getId());
        var created = stayService.createStay(StayRequestDTO.builder().startAt(start).endAt(start.plusDays(2)).catIds(cats).pricingDecision(PricingDecisionRequestDTO.builder().agreedAmount(new BigDecimal("20")).build()).confirmation(stayService.previewCreationPricing(StayCreationPricingPreviewRequestDTO.builder().startAt(start).endAt(start.plusDays(2)).catIds(cats).build()).getConfirmation()).build());
        StayUpdateDTO request = StayUpdateDTO.builder().startAt(start).endAt(start.plusDays(2)).arrivalTransferRequired(true).build();
        CountDownLatch locked = new CountDownLatch(1), release = new CountDownLatch(1); TransactionTemplate transaction = new TransactionTemplate(transactionManager); ExecutorService executor = Executors.newFixedThreadPool(2);
        try {
            Future<?> mutation = executor.submit(() -> transaction.execute(status -> { jdbcTemplate.queryForObject("select transfer_rate from transfer_rates where id = 1 for update", BigDecimal.class); jdbcTemplate.update("update transfer_rates set transfer_rate = 10 where id = 1"); locked.countDown(); try { assertTrue(release.await(10, TimeUnit.SECONDS)); } catch (InterruptedException e) { Thread.currentThread().interrupt(); throw new IllegalStateException(e); } return null; }));
            assertTrue(locked.await(10, TimeUnit.SECONDS)); Future<?> update = executor.submit(() -> stayService.updateStay(created.getStayId(), request)); Thread.sleep(250); assertFalse(update.isDone(), "transfer addition must wait for canonical transfer row"); release.countDown(); mutation.get(10, TimeUnit.SECONDS);
            ExecutionException failure = org.junit.jupiter.api.Assertions.assertThrows(ExecutionException.class, () -> update.get(10, TimeUnit.SECONDS)); assertInstanceOf(BadRequestException.class, failure.getCause());
        } finally { release.countDown(); executor.shutdownNow(); }
        var persisted = stayRepository.findById(created.getStayId()).orElseThrow(); assertFalse(persisted.isArrivalTransferRequired()); assertEquals(0, new BigDecimal("20").compareTo(persisted.getAgreedAmount())); assertEquals(1, jdbcTemplate.queryForObject("select count(*) from stay_pricing_decisions", Integer.class));
    }

    @Test
    void combinedCurrentNightlyAndTransferPricingSerializesWithoutDeadlock() throws Exception {
        UserAccount actor = userAccountRepository.saveAndFlush(UserAccount.builder().username("combined-lock-" + UUID.randomUUID()).passwordHash(passwordEncoder.encode("password")).role(UserRole.ADMIN).enabled(true).build());
        Owner owner = ownerRepository.saveAndFlush(Owner.builder().fullName("Combined Lock Owner").primaryPhone("555-0175").createdBy(actor).build());
        LocalDateTime start = LocalDateTime.of(2027, 12, 1, 12, 0);
        Cat first = catRepository.saveAndFlush(Cat.builder().name("Combined One").birthDate(start.minusYears(2).toLocalDate()).sex(Sex.FEMALE).owner(owner).createdBy(actor).lastRabiesDate(start.plusYears(1).toLocalDate()).lastTripleFelineDate(start.plusYears(1).toLocalDate()).build());
        Cat second = catRepository.saveAndFlush(Cat.builder().name("Combined Two").birthDate(start.minusYears(2).toLocalDate()).sex(Sex.MALE).owner(owner).createdBy(actor).lastRabiesDate(start.plusYears(1).toLocalDate()).lastTripleFelineDate(start.plusYears(1).toLocalDate()).build());
        NightlyReferenceRate nightly = nightlyReferenceRateRepository.findById(NightlyReferenceRateCategory.ONE_CAT).orElseThrow(); nightly.setNightlyRate(new BigDecimal("10")); nightlyReferenceRateRepository.saveAndFlush(nightly); jdbcTemplate.update("update transfer_rates set transfer_rate = 5 where id = 1"); when(currentUserAccountService.getCurrentUserAccount()).thenReturn(actor);
        Set<UUID> firstId = Set.of(first.getId());
        var existing = stayService.createStay(StayRequestDTO.builder().startAt(start).endAt(start.plusDays(2)).catIds(firstId).pricingDecision(PricingDecisionRequestDTO.builder().agreedAmount(new BigDecimal("20")).build()).confirmation(stayService.previewCreationPricing(StayCreationPricingPreviewRequestDTO.builder().startAt(start).endAt(start.plusDays(2)).catIds(firstId).build()).getConfirmation()).build());
        nightly.setNightlyRate(new BigDecimal("15")); nightlyReferenceRateRepository.saveAndFlush(nightly); jdbcTemplate.update("update transfer_rates set transfer_rate = 12 where id = 1");
        TransactionTemplate previewTransaction = new TransactionTemplate(transactionManager); var updatePreview = previewTransaction.execute(status -> stayService.previewDateChangePricing(existing.getStayId(), StayDatePricingPreviewRequestDTO.builder().startAt(start).endAt(start.plusDays(3)).arrivalTransferRequired(true).selectedNightlyRate(new BigDecimal("15")).selectedTransferRate(new BigDecimal("12")).build()));
        StayUpdateDTO update = StayUpdateDTO.builder().startAt(start).endAt(start.plusDays(3)).arrivalTransferRequired(true).pricingDecision(PricingDecisionRequestDTO.builder().agreedAmount(new BigDecimal("57")).build()).confirmation(updatePreview.getConfirmation()).build();
        Set<UUID> secondId = Set.of(second.getId()); var createPreview = stayService.previewCreationPricing(StayCreationPricingPreviewRequestDTO.builder().startAt(start).endAt(start.plusDays(2)).catIds(secondId).arrivalTransferRequired(true).build());
        StayRequestDTO create = StayRequestDTO.builder().startAt(start).endAt(start.plusDays(2)).catIds(secondId).arrivalTransferRequired(true).pricingDecision(PricingDecisionRequestDTO.builder().agreedAmount(new BigDecimal("42")).build()).confirmation(createPreview.getConfirmation()).build();
        ExecutorService executor = Executors.newFixedThreadPool(2); try { Future<?> one = executor.submit(() -> stayService.updateStay(existing.getStayId(), update)); Future<?> two = executor.submit(() -> stayService.createStay(create)); one.get(10, TimeUnit.SECONDS); two.get(10, TimeUnit.SECONDS); } finally { executor.shutdownNow(); }
        assertEquals(2, stayRepository.count());
    }
}
