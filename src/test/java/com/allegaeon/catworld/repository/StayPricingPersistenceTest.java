package com.allegaeon.catworld.repository;

import com.allegaeon.catworld.dto.PricingDecisionRequestDTO;
import com.allegaeon.catworld.dto.StayRequestDTO;
import com.allegaeon.catworld.dto.StayResponseDTO;
import com.allegaeon.catworld.dto.StayUpdateDTO;
import com.allegaeon.catworld.model.Cat;
import com.allegaeon.catworld.model.NightlyReferenceRate;
import com.allegaeon.catworld.model.NightlyReferenceRateCategory;
import com.allegaeon.catworld.model.Owner;
import com.allegaeon.catworld.model.Sex;
import com.allegaeon.catworld.model.Stay;
import com.allegaeon.catworld.model.StayPricingDecision;
import com.allegaeon.catworld.model.UserAccount;
import com.allegaeon.catworld.model.UserRole;
import com.allegaeon.catworld.security.CurrentUserAccountService;
import com.allegaeon.catworld.service.StayService;
import jakarta.persistence.LockModeType;
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

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
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
    void sequentialReconfirmationsAreExactAndSurviveCancellationAndStayDeletion() {
        PricingFixture fixture = createPricedStay();
        UUID stayId = fixture.response().getStayId();

        stayService.updateStay(
                stayId,
                updateRequest(fixture.startAt(), 3, new BigDecimal("30"), null)
        );
        stayService.updateStay(
                stayId,
                updateRequest(
                        fixture.startAt(),
                        4,
                        new BigDecimal("35"),
                        "Client negotiated a whole-stay amount"
                )
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

        stayService.cancelStay(stayId);
        Stay cancelled = stayRepository.findById(stayId).orElseThrow();
        assertEquals(new BigDecimal("10"), cancelled.getRetainedNightlyRate());
        assertEquals(new BigDecimal("35"), cancelled.getAgreedAmount());
        assertEquals(3, stayPricingDecisionRepository
                .findAllByStayIdOrderByDecidedAtAsc(stayId)
                .size());

        stayService.deleteStay(stayId);

        assertFalse(stayRepository.existsById(stayId));
        assertEquals(3, stayPricingDecisionRepository
                .findAllByStayIdOrderByDecidedAtAsc(stayId)
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
                                fixture.startAt(),
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
        LocalDateTime startAt = LocalDateTime.of(2026, 8, 1, 12, 0);
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

        StayResponseDTO response = stayService.createStay(StayRequestDTO.builder()
                .startAt(startAt)
                .endAt(startAt.plusDays(2))
                .catIds(Set.of(cat.getId()))
                .pricingDecision(PricingDecisionRequestDTO.builder()
                        .agreedAmount(new BigDecimal("20"))
                        .build())
                .build());

        return new PricingFixture(actor, startAt, response);
    }

    private StayUpdateDTO updateRequest(
            LocalDateTime startAt,
            long nights,
            BigDecimal agreedAmount,
            String reason) {
        return StayUpdateDTO.builder()
                .startAt(startAt)
                .endAt(startAt.plusDays(nights))
                .pricingDecision(PricingDecisionRequestDTO.builder()
                        .agreedAmount(agreedAmount)
                        .reason(reason)
                        .build())
                .build();
    }

    private record PricingFixture(
            UserAccount actor,
            LocalDateTime startAt,
            StayResponseDTO response) {
    }
}
