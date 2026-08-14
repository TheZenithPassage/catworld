package com.allegaeon.catworld.repository;

import com.allegaeon.catworld.dto.PricingDecisionRequestDTO;
import com.allegaeon.catworld.dto.StayRequestDTO;
import com.allegaeon.catworld.dto.StayCreationPricingPreviewRequestDTO;
import com.allegaeon.catworld.dto.StayDatePricingPreviewRequestDTO;
import com.allegaeon.catworld.dto.StayResponseDTO;
import com.allegaeon.catworld.dto.StayUpdateDTO;
import com.allegaeon.catworld.exception.ConflictException;
import com.allegaeon.catworld.model.Cat;
import com.allegaeon.catworld.model.NightlyReferenceRate;
import com.allegaeon.catworld.model.NightlyReferenceRateCategory;
import com.allegaeon.catworld.model.Owner;
import com.allegaeon.catworld.model.Sex;
import com.allegaeon.catworld.model.Stay;
import com.allegaeon.catworld.model.StayAgreedAmountCorrection;
import com.allegaeon.catworld.model.StayPricingDecision;
import com.allegaeon.catworld.model.UserAccount;
import com.allegaeon.catworld.model.UserRole;
import com.allegaeon.catworld.security.CurrentUserAccountService;
import com.allegaeon.catworld.service.StayService;
import jakarta.persistence.LockModeType;
import jakarta.validation.ConstraintViolationException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

import java.math.BigDecimal;
import java.lang.reflect.Method;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;

import static org.junit.jupiter.api.Assertions.assertAll;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.when;

@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:stay_pricing_persistence_context;DB_CLOSE_DELAY=-1;MODE=MySQL",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.datasource.username=sa",
        "spring.datasource.password=",
        "spring.jpa.database-platform=org.hibernate.dialect.H2Dialect",
        "spring.jpa.hibernate.ddl-auto=none",
        "spring.flyway.enabled=false",
        "catworld.security.username=persistence-admin",
        "catworld.security.password=persistence-password",
        "catworld.security.cors-allowed-origins=http://localhost:4200"
})
@ActiveProfiles("persistence")
@ContextConfiguration(
        initializers = NightlyReferenceRateMigrationTest.LatestSchemaInitializer.class
)
class StayPricingPersistenceTest {

    private static final Instant DECIDED_AT =
            Instant.parse("2026-07-28T12:00:00Z");

    @Autowired
    private StayService stayService;

    @Autowired
    private UserAccountRepository userAccountRepository;

    @Autowired
    private OwnerRepository ownerRepository;

    @Autowired
    private CatRepository catRepository;

    @Autowired
    private StayRepository stayRepository;

    @Autowired
    private StayPricingDecisionRepository stayPricingDecisionRepository;

    @Autowired
    private StayAgreedAmountCorrectionRepository
            stayAgreedAmountCorrectionRepository;

    @Autowired
    private NightlyReferenceRateRepository nightlyReferenceRateRepository;

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
        jdbcTemplate.update("delete from stay_agreed_amount_corrections");
        jdbcTemplate.update("delete from stay_pricing_decisions");
        jdbcTemplate.update("delete from nightly_reference_rate_changes");
        jdbcTemplate.update("delete from stay_cat");
        jdbcTemplate.update("delete from stays");
        jdbcTemplate.update("delete from cats");
        jdbcTemplate.update("delete from vets");
        jdbcTemplate.update("delete from owners");
        jdbcTemplate.update("update nightly_reference_rates set nightly_rate = null");
        jdbcTemplate.update("delete from user_accounts");
        when(clock.instant()).thenReturn(DECIDED_AT);
    }

    @Test
    void pricingAndCorrectionEvidenceSurviveCancellationAndStayDeletion() {
        PricingFixture fixture = createPricedStay();
        UUID stayId = fixture.response().getStayId();

        stayService.updateStay(
                stayId,
                updateRequest(stayId, fixture.startAt(), 3, new BigDecimal("30"), null)
        );
        stayService.updateStay(
                stayId,
                updateRequest(
                        stayId, fixture.startAt(),
                        4,
                        new BigDecimal("35"),
                        "Client negotiated a whole-stay amount"
                )
        );
        stayService.correctAgreedAmount(
                stayId,
                PricingDecisionRequestDTO.builder()
                        .agreedAmount(new BigDecimal("40"))
                        .reason("Administrative agreement correction")
                        .build()
        );

        List<StayPricingDecision> decisions =
                stayPricingDecisionRepository.findAllByStayIdOrderByDecidedAtAsc(stayId);
        assertEquals(3, decisions.size());
        assertEquals(2, decisions.get(0).getNewNumberOfNights());
        assertEquals(new BigDecimal("20"), decisions.get(0).getNewAgreedAmount());
        assertEquals(2L, decisions.get(1).getPreviousNumberOfNights());
        assertEquals(3, decisions.get(1).getNewNumberOfNights());
        assertEquals(new BigDecimal("20"), decisions.get(1).getPreviousAgreedAmount());
        assertEquals(new BigDecimal("30"), decisions.get(1).getNewAgreedAmount());
        assertEquals(3L, decisions.get(2).getPreviousNumberOfNights());
        assertEquals(4, decisions.get(2).getNewNumberOfNights());
        assertEquals(new BigDecimal("30"), decisions.get(2).getPreviousAgreedAmount());
        assertEquals(new BigDecimal("35"), decisions.get(2).getNewAgreedAmount());
        assertEquals(
                "Client negotiated a whole-stay amount",
                decisions.get(2).getReason()
        );
        assertTrue(decisions.stream().allMatch(
                decision -> DECIDED_AT.equals(decision.getDecidedAt())
                        && fixture.actor().getId().equals(decision.getDecidedBy().getId())
                        && new BigDecimal("10")
                        .compareTo(decision.getRetainedNightlyRate()) == 0
        ));
        List<StayAgreedAmountCorrection> corrections =
                stayAgreedAmountCorrectionRepository.findAllByStayId(stayId);
        assertEquals(1, corrections.size());
        assertEquals(
                new BigDecimal("35"),
                corrections.get(0).getPreviousAgreedAmount()
        );
        assertEquals(
                new BigDecimal("40"),
                corrections.get(0).getNewAgreedAmount()
        );
        assertEquals(
                "Administrative agreement correction",
                corrections.get(0).getReason()
        );

        stayService.cancelStay(stayId);
        Stay cancelled = stayRepository.findById(stayId).orElseThrow();
        assertEquals(new BigDecimal("10"), cancelled.getRetainedNightlyRate());
        assertEquals(new BigDecimal("40"), cancelled.getAgreedAmount());
        assertEquals(3, stayPricingDecisionRepository
                .findAllByStayIdOrderByDecidedAtAsc(stayId)
                .size());
        assertEquals(1, stayAgreedAmountCorrectionRepository
                .findAllByStayId(stayId)
                .size());

        stayService.deleteStay(stayId);

        assertFalse(stayRepository.existsById(stayId));
        assertEquals(3, stayPricingDecisionRepository
                .findAllByStayIdOrderByDecidedAtAsc(stayId)
                .size());
        assertEquals(1, stayAgreedAmountCorrectionRepository
                .findAllByStayId(stayId)
                .size());
    }

    @Test
    void failedDecisionInsertRollsBackNightAndAgreementMutation() {
        PricingFixture fixture = createPricedStay();
        UUID stayId = fixture.response().getStayId();
        UserAccount missingAdmin = UserAccount.builder()
                .id(UUID.randomUUID())
                .username("missing-admin")
                .role(UserRole.ADMIN)
                .enabled(true)
                .build();
        when(currentUserAccountService.getCurrentUserAccount())
                .thenReturn(missingAdmin);

        assertThrows(
                RuntimeException.class,
                () -> stayService.updateStay(
                        stayId,
                        updateRequest(
                                stayId, fixture.startAt(),
                                3,
                                new BigDecimal("30"),
                                null
                        )
                )
        );

        Stay unchanged = stayRepository.findById(stayId).orElseThrow();
        assertEquals(fixture.startAt().plusDays(2), unchanged.getEndAt());
        assertEquals(new BigDecimal("20"), unchanged.getAgreedAmount());
        assertEquals(1, stayPricingDecisionRepository
                .findAllByStayIdOrderByDecidedAtAsc(stayId)
                .size());
    }

    @Test
    void legacyNullAgreementCorrectionIsRejectedWithoutPersistence() {
        PersistenceFixture fixture = createPersistenceFixture();
        Stay legacyStay = stay(fixture, null, null);
        legacyStay = stayRepository.saveAndFlush(legacyStay);
        when(currentUserAccountService.getCurrentUserAccount())
                .thenReturn(fixture.actor());

        UUID stayId = legacyStay.getId();

        assertThrows(
                ConflictException.class,
                () -> stayService.correctAgreedAmount(
                        stayId,
                        correctionRequest(
                                new BigDecimal("25"),
                                "Recorded inherited agreement"
                        )
                )
        );

        Stay unchanged = stayRepository.findById(stayId).orElseThrow();
        assertNull(unchanged.getAgreedAmount());
        assertTrue(stayAgreedAmountCorrectionRepository.findAllByStayId(stayId).isEmpty());
    }

    @Test
    void numericNoOpLeavesManagedStayTimestampAndCorrectionHistoryUnchanged() {
        PricingFixture fixture = createPricedStay();
        UUID stayId = fixture.response().getStayId();
        Stay before = stayRepository.findById(stayId).orElseThrow();
        Instant updatedAt = before.getUpdatedAt();

        stayService.correctAgreedAmount(
                stayId,
                correctionRequest(new BigDecimal("20.0"), null)
        );

        Stay after = stayRepository.findById(stayId).orElseThrow();
        assertEquals(new BigDecimal("20"), after.getAgreedAmount());
        assertEquals(updatedAt, after.getUpdatedAt());
        assertEquals(
                0,
                stayAgreedAmountCorrectionRepository.findAllByStayId(stayId).size()
        );
    }

    @Test
    void failedCorrectionEventInsertRollsBackAgreementMutation() {
        PricingFixture fixture = createPricedStay();
        UUID stayId = fixture.response().getStayId();
        UserAccount missingAdmin = UserAccount.builder()
                .id(UUID.randomUUID())
                .username("missing-correction-admin")
                .role(UserRole.ADMIN)
                .enabled(true)
                .build();
        when(currentUserAccountService.getCurrentUserAccount())
                .thenReturn(missingAdmin);

        assertThrows(
                RuntimeException.class,
                () -> stayService.correctAgreedAmount(
                        stayId,
                        correctionRequest(
                                new BigDecimal("30"),
                                "Correction that must roll back"
                        )
                )
        );

        Stay unchanged = stayRepository.findById(stayId).orElseThrow();
        assertEquals(new BigDecimal("20"), unchanged.getAgreedAmount());
        assertEquals(
                0,
                stayAgreedAmountCorrectionRepository.findAllByStayId(stayId).size()
        );
    }

    @Test
    void concurrentCorrectionsFormAccurateSerializedChain() throws Exception {
        PricingFixture fixture = createPricedStay();
        UUID stayId = fixture.response().getStayId();
        CountDownLatch ready = new CountDownLatch(2);
        CountDownLatch start = new CountDownLatch(1);
        ExecutorService executor = Executors.newFixedThreadPool(2);

        try {
            Future<StayResponseDTO> correctionToThirty = executor.submit(() -> {
                ready.countDown();
                start.await();
                return stayService.correctAgreedAmount(
                        stayId,
                        correctionRequest(
                                new BigDecimal("30"),
                                "First competing correction"
                        )
                );
            });
            Future<StayResponseDTO> correctionToForty = executor.submit(() -> {
                ready.countDown();
                start.await();
                return stayService.correctAgreedAmount(
                        stayId,
                        correctionRequest(
                                new BigDecimal("40"),
                                "Second competing correction"
                        )
                );
            });

            assertTrue(ready.await(5, TimeUnit.SECONDS));
            start.countDown();
            correctionToThirty.get(10, TimeUnit.SECONDS);
            correctionToForty.get(10, TimeUnit.SECONDS);
        } finally {
            executor.shutdownNow();
        }

        List<StayAgreedAmountCorrection> corrections =
                stayAgreedAmountCorrectionRepository.findAllByStayId(stayId);
        assertEquals(2, corrections.size());
        StayAgreedAmountCorrection first = corrections.stream()
                .filter(correction -> new BigDecimal("20").compareTo(
                        correction.getPreviousAgreedAmount()) == 0)
                .findFirst()
                .orElseThrow();
        StayAgreedAmountCorrection second = corrections.stream()
                .filter(correction -> correction != first
                        && first.getNewAgreedAmount().compareTo(
                        correction.getPreviousAgreedAmount()) == 0)
                .findFirst()
                .orElseThrow();

        assertEquals(
                Set.of(new BigDecimal("30"), new BigDecimal("40")),
                Set.of(first.getNewAgreedAmount(), second.getNewAgreedAmount())
        );
        Stay finalStay = stayRepository.findById(stayId).orElseThrow();
        assertEquals(
                0,
                second.getNewAgreedAmount().compareTo(finalStay.getAgreedAmount())
        );
    }

    @Test
    void stayUpdateLookupDeclaresPessimisticWriteLock() throws Exception {
        Method lockedLookup = StayRepository.class.getMethod(
                "findByIdForUpdate",
                UUID.class
        );

        assertEquals(
                LockModeType.PESSIMISTIC_WRITE,
                lockedLookup.getAnnotation(Lock.class).value()
        );
    }

    @Test
    void directRepositoryWritesRejectFractionalMonetaryValues() {
        PersistenceFixture fixture = createPersistenceFixture();

        assertAll(
                () -> assertStayRejected(
                        fixture,
                        new BigDecimal("10.5"),
                        new BigDecimal("20")
                ),
                () -> assertStayRejected(
                        fixture,
                        new BigDecimal("10"),
                        new BigDecimal("20.5")
                ),
                () -> assertDecisionRejected(
                        fixture.actor(),
                        new BigDecimal("10.5"),
                        new BigDecimal("20"),
                        new BigDecimal("20")
                ),
                () -> assertDecisionRejected(
                        fixture.actor(),
                        new BigDecimal("10"),
                        new BigDecimal("20.5"),
                        new BigDecimal("20")
                ),
                () -> assertDecisionRejected(
                        fixture.actor(),
                        new BigDecimal("10"),
                        new BigDecimal("20"),
                        new BigDecimal("20.5")
                )
        );

        assertEquals(0, jdbcTemplate.queryForObject(
                "select count(*) from stays",
                Integer.class
        ));
        assertEquals(0, jdbcTemplate.queryForObject(
                "select count(*) from stay_pricing_decisions",
                Integer.class
        ));
    }

    @Test
    void directRepositoryWritesRejectInvalidMonetaryBoundsAndMissingDecisionAmount() {
        PersistenceFixture fixture = createPersistenceFixture();

        assertAll(
                () -> assertStayRejected(
                        fixture,
                        BigDecimal.ZERO,
                        new BigDecimal("20")
                ),
                () -> assertStayRejected(
                        fixture,
                        new BigDecimal("10"),
                        new BigDecimal("-1")
                ),
                () -> assertDecisionRejected(
                        fixture.actor(),
                        BigDecimal.ZERO,
                        new BigDecimal("20"),
                        new BigDecimal("20")
                ),
                () -> assertDecisionRejected(
                        fixture.actor(),
                        new BigDecimal("10"),
                        new BigDecimal("-1"),
                        new BigDecimal("20")
                ),
                () -> assertDecisionRejected(
                        fixture.actor(),
                        new BigDecimal("10"),
                        new BigDecimal("20"),
                        new BigDecimal("-1")
                ),
                () -> assertDecisionRejected(
                        fixture.actor(),
                        new BigDecimal("10"),
                        new BigDecimal("20"),
                        null
                )
        );
    }

    @Test
    void directRepositoryWritesRejectOverCapacityMonetaryValues() {
        PersistenceFixture fixture = createPersistenceFixture();
        BigDecimal overCapacity = new BigDecimal("10000000000000000000");

        assertAll(
                () -> assertStayRejected(
                        fixture,
                        overCapacity,
                        new BigDecimal("20")
                ),
                () -> assertStayRejected(
                        fixture,
                        new BigDecimal("10"),
                        overCapacity
                ),
                () -> assertDecisionRejected(
                        fixture.actor(),
                        overCapacity,
                        new BigDecimal("20"),
                        new BigDecimal("20")
                ),
                () -> assertDecisionRejected(
                        fixture.actor(),
                        new BigDecimal("10"),
                        overCapacity,
                        new BigDecimal("20")
                ),
                () -> assertDecisionRejected(
                        fixture.actor(),
                        new BigDecimal("10"),
                        new BigDecimal("20"),
                        overCapacity
                )
        );
    }

    @Test
    void directCorrectionWritesRejectInvalidImmutableEvidence() {
        PersistenceFixture fixture = createPersistenceFixture();
        BigDecimal overCapacity = new BigDecimal("10000000000000000000");

        assertAll(
                () -> assertCorrectionRejected(
                        fixture.actor(),
                        new BigDecimal("20.5"),
                        new BigDecimal("25"),
                        "Reason"
                ),
                () -> assertCorrectionRejected(
                        fixture.actor(),
                        new BigDecimal("20"),
                        new BigDecimal("25.5"),
                        "Reason"
                ),
                () -> assertCorrectionRejected(
                        fixture.actor(),
                        new BigDecimal("-1"),
                        new BigDecimal("25"),
                        "Reason"
                ),
                () -> assertCorrectionRejected(
                        fixture.actor(),
                        new BigDecimal("20"),
                        overCapacity,
                        "Reason"
                ),
                () -> assertCorrectionRejected(
                        fixture.actor(),
                        new BigDecimal("20"),
                        new BigDecimal("20"),
                        "No numerical change"
                ),
                () -> assertCorrectionRejected(
                        fixture.actor(),
                        null,
                        new BigDecimal("25"),
                        "   "
                )
        );
    }

    private void assertStayRejected(
            PersistenceFixture fixture,
            BigDecimal retainedNightlyRate,
            BigDecimal agreedAmount) {
        assertThrows(
                ConstraintViolationException.class,
                () -> stayRepository.saveAndFlush(stay(
                        fixture,
                        retainedNightlyRate,
                        agreedAmount
                ))
        );
    }

    private void assertDecisionRejected(
            UserAccount actor,
            BigDecimal retainedNightlyRate,
            BigDecimal previousAgreedAmount,
            BigDecimal newAgreedAmount) {
        assertThrows(
                ConstraintViolationException.class,
                () -> stayPricingDecisionRepository.saveAndFlush(decision(
                        actor,
                        retainedNightlyRate,
                        previousAgreedAmount,
                        newAgreedAmount
                ))
        );
    }

    private void assertCorrectionRejected(
            UserAccount actor,
            BigDecimal previousAgreedAmount,
            BigDecimal newAgreedAmount,
            String reason) {
        assertThrows(
                RuntimeException.class,
                () -> stayAgreedAmountCorrectionRepository.saveAndFlush(
                        StayAgreedAmountCorrection.builder()
                                .stayId(UUID.randomUUID())
                                .previousAgreedAmount(previousAgreedAmount)
                                .newAgreedAmount(newAgreedAmount)
                                .decidedBy(actor)
                                .decidedAt(DECIDED_AT)
                                .reason(reason)
                                .build()
                )
        );
    }

    private PersistenceFixture createPersistenceFixture() {
        UserAccount actor = userAccountRepository.saveAndFlush(UserAccount.builder()
                .username("direct-persistence-" + UUID.randomUUID())
                .passwordHash(passwordEncoder.encode("password"))
                .role(UserRole.ADMIN)
                .enabled(true)
                .build());
        Owner owner = ownerRepository.saveAndFlush(Owner.builder()
                .fullName("Direct Persistence Owner")
                .primaryPhone("555-0188")
                .createdBy(actor)
                .build());
        return new PersistenceFixture(actor, owner);
    }

    private Stay stay(
            PersistenceFixture fixture,
            BigDecimal retainedNightlyRate,
            BigDecimal agreedAmount) {
        LocalDateTime startAt = LocalDateTime.of(2027, 8, 1, 12, 0);
        return Stay.builder()
                .startAt(startAt)
                .endAt(startAt.plusDays(2))
                .retainedNightlyRate(retainedNightlyRate)
                .agreedAmount(agreedAmount)
                .owner(fixture.owner())
                .createdBy(fixture.actor())
                .build();
    }

    private StayPricingDecision decision(
            UserAccount actor,
            BigDecimal retainedNightlyRate,
            BigDecimal previousAgreedAmount,
            BigDecimal newAgreedAmount) {
        return StayPricingDecision.builder()
                .stayId(UUID.randomUUID())
                .retainedNightlyRate(retainedNightlyRate)
                .previousNumberOfNights(1L)
                .newNumberOfNights(2)
                .previousAgreedAmount(previousAgreedAmount)
                .newAgreedAmount(newAgreedAmount)
                .decidedBy(actor)
                .decidedAt(DECIDED_AT)
                .build();
    }

    private PricingFixture createPricedStay() {
        UserAccount actor = userAccountRepository.saveAndFlush(UserAccount.builder()
                .username("pricing-admin-" + UUID.randomUUID())
                .passwordHash(passwordEncoder.encode("password"))
                .role(UserRole.ADMIN)
                .enabled(true)
                .build());
        Owner owner = ownerRepository.saveAndFlush(Owner.builder()
                .fullName("Pricing Owner")
                .primaryPhone("555-0177")
                .createdBy(actor)
                .build());
        LocalDateTime startAt = LocalDateTime.of(2027, 8, 1, 12, 0);
        Cat cat = catRepository.saveAndFlush(Cat.builder()
                .name("Milo")
                .birthDate(startAt.minusYears(3).toLocalDate())
                .sex(Sex.MALE)
                .owner(owner)
                .createdBy(actor)
                .lastRabiesDate(startAt.plusYears(1).toLocalDate())
                .lastTripleFelineDate(startAt.plusYears(1).toLocalDate())
                .createdBy(actor)
                .build());
        NightlyReferenceRate rate = nightlyReferenceRateRepository
                .findById(NightlyReferenceRateCategory.ONE_CAT)
                .orElseThrow();
        rate.setNightlyRate(new BigDecimal("10"));
        nightlyReferenceRateRepository.saveAndFlush(rate);
        when(currentUserAccountService.getCurrentUserAccount()).thenReturn(actor);

        Set<UUID> catIds = Set.of(cat.getId());
        var confirmation = stayService.previewCreationPricing(
                        StayCreationPricingPreviewRequestDTO.builder()
                                .startAt(startAt)
                                .endAt(startAt.plusDays(2))
                                .catIds(catIds)
                                .build())
                .getConfirmation();

        StayResponseDTO response = stayService.createStay(StayRequestDTO.builder()
                .startAt(startAt)
                .endAt(startAt.plusDays(2))
                .catIds(catIds)
                .pricingDecision(PricingDecisionRequestDTO.builder()
                        .agreedAmount(new BigDecimal("20"))
                        .build())
                .confirmation(confirmation)
                .build());

        return new PricingFixture(actor, startAt, response);
    }

    private StayUpdateDTO updateRequest(
            UUID stayId,
            LocalDateTime startAt,
            long nights,
            BigDecimal agreedAmount,
            String reason) {
        var confirmation = stayService.previewDateChangePricing(
                        stayId,
                        StayDatePricingPreviewRequestDTO.builder()
                                .startAt(startAt)
                                .endAt(startAt.plusDays(nights))
                                .build())
                .getConfirmation();
        return StayUpdateDTO.builder()
                .startAt(startAt)
                .endAt(startAt.plusDays(nights))
                .pricingDecision(PricingDecisionRequestDTO.builder()
                        .agreedAmount(agreedAmount)
                        .reason(reason)
                        .build())
                .confirmation(confirmation)
                .build();
    }

    private PricingDecisionRequestDTO correctionRequest(
            BigDecimal agreedAmount,
            String reason) {
        return PricingDecisionRequestDTO.builder()
                .agreedAmount(agreedAmount)
                .reason(reason)
                .build();
    }

    private record PricingFixture(
            UserAccount actor,
            LocalDateTime startAt,
            StayResponseDTO response) {
    }

    private record PersistenceFixture(
            UserAccount actor,
            Owner owner) {
    }
}
