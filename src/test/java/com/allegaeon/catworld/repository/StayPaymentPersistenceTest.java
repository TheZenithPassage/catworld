package com.allegaeon.catworld.repository;

import com.allegaeon.catworld.dto.PaymentAnnulmentRequestDTO;
import com.allegaeon.catworld.dto.PaymentEditRequestDTO;
import com.allegaeon.catworld.dto.PaymentRegistrationRequestDTO;
import com.allegaeon.catworld.model.Owner;
import com.allegaeon.catworld.model.Stay;
import com.allegaeon.catworld.model.StayPayment;
import com.allegaeon.catworld.model.StayPaymentAnnulment;
import com.allegaeon.catworld.model.StayPaymentEdit;
import com.allegaeon.catworld.model.UserAccount;
import com.allegaeon.catworld.model.UserRole;
import com.allegaeon.catworld.security.CurrentUserAccountService;
import com.allegaeon.catworld.service.StayService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.when;

@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:stay_payment_persistence_context;DB_CLOSE_DELAY=-1;MODE=MySQL",
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
class StayPaymentPersistenceTest {

    private static final Instant MUTATED_AT =
            Instant.parse("2026-07-30T12:00:00Z");

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
    private StayPaymentAnnulmentRepository stayPaymentAnnulmentRepository;

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
        jdbcTemplate.update("delete from stay_payment_annulments");
        jdbcTemplate.update("delete from stay_payment_edits");
        jdbcTemplate.update("delete from stay_payments");
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
        when(clock.instant()).thenReturn(MUTATED_AT);
    }

    @Test
    void exactAmountsAndAuditSnapshotsRoundTripWhileAnnulledAmountsAreExcluded() {
        Fixture fixture = createFixture(new BigDecimal("100"));
        when(currentUserAccountService.getCurrentUserAccount())
                .thenReturn(fixture.actor());

        stayService.registerPayment(
                fixture.stay().getId(),
                registration(new BigDecimal("40"), "First instalment")
        );
        stayService.registerPayment(
                fixture.stay().getId(),
                registration(new BigDecimal("15"), "Second instalment")
        );
        List<StayPayment> registered = payments(fixture.stay().getId());
        StayPayment first = registered.get(0);
        StayPayment second = registered.get(1);

        stayService.editPayment(
                fixture.stay().getId(),
                first.getId(),
                PaymentEditRequestDTO.builder()
                        .amount(new BigDecimal("45"))
                        .reason("Corrected entered amount")
                        .build()
        );
        stayService.annulPayment(
                fixture.stay().getId(),
                second.getId(),
                PaymentAnnulmentRequestDTO.builder()
                        .reason("Duplicate receipt")
                        .build()
        );

        List<StayPayment> persisted = payments(fixture.stay().getId());
        StayPayment edited = persisted.stream()
                .filter(payment -> payment.getId().equals(first.getId()))
                .findFirst()
                .orElseThrow();
        StayPayment annulled = persisted.stream()
                .filter(payment -> payment.getId().equals(second.getId()))
                .findFirst()
                .orElseThrow();
        List<StayPaymentEdit> edits =
                stayPaymentEditRepository.findAllByStayIdOrderByEditedAtAsc(
                        fixture.stay().getId()
                );
        List<StayPaymentAnnulment> annulments =
                stayPaymentAnnulmentRepository
                        .findAllByStayIdOrderByAnnulledAtAsc(
                                fixture.stay().getId()
                        );

        assertEquals(new BigDecimal("45"), edited.getAmount());
        assertFalse(edited.isAnnulled());
        assertEquals(new BigDecimal("15"), annulled.getAmount());
        assertEquals(
                new BigDecimal("45"),
                stayPaymentRepository.sumActiveAmountByStayId(
                        fixture.stay().getId()
                )
        );
        assertEquals(1, edits.size());
        assertEquals(new BigDecimal("40"), edits.get(0).getPreviousAmount());
        assertEquals(new BigDecimal("45"), edits.get(0).getNewAmount());
        assertEquals("Corrected entered amount", edits.get(0).getReason());
        assertEquals(MUTATED_AT, edits.get(0).getEditedAt());
        assertEquals(1, annulments.size());
        assertEquals(second.getId(), annulments.get(0).getPaymentId());
        assertEquals("Duplicate receipt", annulments.get(0).getReason());
        assertEquals(MUTATED_AT, annulments.get(0).getAnnulledAt());
    }

    @Test
    void failedEditAuditInsertRollsBackOperationalAmountChange() {
        Fixture fixture = createFixture(new BigDecimal("100"));
        when(currentUserAccountService.getCurrentUserAccount())
                .thenReturn(fixture.actor());
        stayService.registerPayment(
                fixture.stay().getId(),
                registration(new BigDecimal("40"), null)
        );
        StayPayment payment = payments(fixture.stay().getId()).get(0);
        when(currentUserAccountService.getCurrentUserAccount())
                .thenReturn(missingAdmin("missing-edit-admin"));

        assertThrows(
                RuntimeException.class,
                () -> stayService.editPayment(
                        fixture.stay().getId(),
                        payment.getId(),
                        PaymentEditRequestDTO.builder()
                                .amount(new BigDecimal("45"))
                                .reason("Must roll back")
                                .build()
                )
        );

        assertEquals(
                new BigDecimal("40"),
                jdbcTemplate.queryForObject(
                        "select amount from stay_payments where id = ?",
                        BigDecimal.class,
                        payment.getId()
                )
        );
        assertEquals(0, stayPaymentEditRepository.count());
    }

    @Test
    void failedAnnulmentAuditInsertRollsBackOperationalAnnulment() {
        Fixture fixture = createFixture(new BigDecimal("100"));
        when(currentUserAccountService.getCurrentUserAccount())
                .thenReturn(fixture.actor());
        stayService.registerPayment(
                fixture.stay().getId(),
                registration(new BigDecimal("40"), null)
        );
        StayPayment payment = payments(fixture.stay().getId()).get(0);
        when(currentUserAccountService.getCurrentUserAccount())
                .thenReturn(missingAdmin("missing-annul-admin"));

        assertThrows(
                RuntimeException.class,
                () -> stayService.annulPayment(
                        fixture.stay().getId(),
                        payment.getId(),
                        PaymentAnnulmentRequestDTO.builder()
                                .reason("Must roll back")
                                .build()
                )
        );

        assertFalse(Boolean.TRUE.equals(jdbcTemplate.queryForObject(
                "select annulled from stay_payments where id = ?",
                Boolean.class,
                payment.getId()
        )));
        assertEquals(0, stayPaymentAnnulmentRepository.count());
    }

    private Fixture createFixture(BigDecimal agreedAmount) {
        UserAccount actor = userAccountRepository.saveAndFlush(
                UserAccount.builder()
                        .username("payment-admin-" + UUID.randomUUID())
                        .passwordHash(passwordEncoder.encode("password"))
                        .role(UserRole.ADMIN)
                        .enabled(true)
                        .build()
        );
        Owner owner = ownerRepository.saveAndFlush(
                Owner.builder()
                        .fullName("Payment Persistence Owner")
                        .primaryPhone("555-0199")
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

    private PaymentRegistrationRequestDTO registration(
            BigDecimal amount,
            String note) {
        return PaymentRegistrationRequestDTO.builder()
                .amount(amount)
                .paymentDate(LocalDate.of(2026, 7, 30))
                .note(note)
                .build();
    }

    private List<StayPayment> payments(UUID stayId) {
        return stayPaymentRepository
                .findAllByStay_IdOrderByCreatedAtAscIdAsc(stayId);
    }

    private UserAccount missingAdmin(String username) {
        return UserAccount.builder()
                .id(UUID.randomUUID())
                .username(username)
                .role(UserRole.ADMIN)
                .enabled(true)
                .build();
    }

    private record Fixture(UserAccount actor, Stay stay) {
    }
}
