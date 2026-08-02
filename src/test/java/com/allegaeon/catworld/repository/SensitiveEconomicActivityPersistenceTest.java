package com.allegaeon.catworld.repository;

import com.allegaeon.catworld.dto.PaymentRegistrationRequestDTO;
import com.allegaeon.catworld.dto.PaymentRemovalRequestDTO;
import com.allegaeon.catworld.model.*;
import com.allegaeon.catworld.security.CurrentUserAccountService;
import com.allegaeon.catworld.service.StayService;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.dao.DataIntegrityViolationException;
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
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;

@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:sensitive_activity_persistence;DB_CLOSE_DELAY=-1;MODE=MySQL",
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
class SensitiveEconomicActivityPersistenceTest {

    @Autowired StayService stayService;
    @Autowired UserAccountRepository userRepository;
    @Autowired OwnerRepository ownerRepository;
    @Autowired CatRepository catRepository;
    @Autowired StayRepository stayRepository;
    @Autowired StayPaymentRepository paymentRepository;
    @Autowired StayPaymentRemovalRepository removalRepository;
    @Autowired SensitiveStayContextRepository contextRepository;
    @Autowired PasswordEncoder passwordEncoder;
    @Autowired JdbcTemplate jdbc;
    @Autowired EntityManager entityManager;
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
        jdbc.update("delete from owners");
        jdbc.update("delete from user_accounts");
    }

    @Test
    void removalEvidenceIsExactAndSurvivesPaymentStayAndOwnerDeletion() {
        Fixture fixture = fixture();
        when(currentUserAccountService.getCurrentUserAccount())
                .thenReturn(fixture.actor());
        when(clock.instant()).thenReturn(Instant.parse("2026-08-02T12:00:00Z"));
        stayService.registerPayment(
                fixture.stay().getId(),
                PaymentRegistrationRequestDTO.builder()
                        .amount(new BigDecimal("40"))
                        .paymentDate(LocalDate.of(2026, 8, 1))
                        .note("Cash")
                        .build());
        StayPayment payment = paymentRepository
                .findAllByStay_IdOrderByCreatedAtAscIdAsc(fixture.stay().getId())
                .get(0);

        stayService.removePayment(
                fixture.stay().getId(), payment.getId(),
                PaymentRemovalRequestDTO.builder()
                        .reason("Duplicate receipt").build());

        assertEquals(0, paymentRepository.count());
        StayPaymentRemoval removal = removalRepository.findAll().get(0);
        assertEquals(new BigDecimal("40"), removal.getAmount());
        assertEquals(LocalDate.of(2026, 8, 1), removal.getPaymentDate());
        assertEquals("Cash", removal.getPaymentNote());
        assertEquals("Duplicate receipt", removal.getReason());
        assertEquals(fixture.actor().getId(), removal.getRegisteredBy().getId());
        assertEquals(fixture.actor().getId(), removal.getRemovedBy().getId());
        UUID contextId = jdbc.queryForObject(
                "select sensitive_context_id from stay_payment_removals where id = ?",
                UUID.class, removal.getId());
        assertEquals("Durable Owner", jdbc.queryForObject(
                "select owner_full_name from sensitive_stay_contexts where id = ?",
                String.class, contextId));
        assertEquals(fixture.cat().getId(), jdbc.queryForObject(
                "select cat_id from sensitive_stay_context_cats where context_id = ?",
                UUID.class, contextId));
        assertEquals("Durable Cat", jdbc.queryForObject(
                "select cat_name from sensitive_stay_context_cats where context_id = ?",
                String.class, contextId));

        stayService.deleteStay(fixture.stay().getId());
        catRepository.deleteById(fixture.cat().getId());
        catRepository.flush();
        ownerRepository.deleteById(fixture.owner().getId());
        ownerRepository.flush();
        entityManager.clear();

        StayPaymentRemoval durable = removalRepository.findAll().get(0);
        assertEquals(fixture.stay().getId(), durable.getStayId());
        assertEquals(fixture.owner().getId(), jdbc.queryForObject(
                "select owner_id from sensitive_stay_contexts where id = ?",
                UUID.class, contextId));
        assertEquals("Durable Owner", jdbc.queryForObject(
                "select owner_full_name from sensitive_stay_contexts where id = ?",
                String.class, contextId));
        assertFalse(stayRepository.existsById(fixture.stay().getId()));
        assertFalse(catRepository.existsById(fixture.cat().getId()));
        assertFalse(ownerRepository.existsById(fixture.owner().getId()));

        assertThrows(DataIntegrityViolationException.class, () -> {
            userRepository.deleteById(fixture.actor().getId());
            userRepository.flush();
        });
    }

    @Test
    void failedEvidenceAttributionRollsBackContextAndOperationalDeletion() {
        Fixture fixture = fixture();
        when(currentUserAccountService.getCurrentUserAccount()).thenReturn(
                UserAccount.builder()
                        .id(UUID.randomUUID())
                        .username("missing-admin")
                        .role(UserRole.ADMIN)
                        .enabled(true)
                        .build());
        when(clock.instant()).thenReturn(Instant.parse("2026-08-02T12:00:00Z"));
        StayPayment payment = paymentRepository.saveAndFlush(
                StayPayment.builder()
                        .stay(fixture.stay())
                        .amount(new BigDecimal("25"))
                        .paymentDate(LocalDate.of(2026, 8, 1))
                        .registeredBy(fixture.actor())
                        .build());

        assertThrows(RuntimeException.class, () -> stayService.removePayment(
                fixture.stay().getId(), payment.getId(),
                PaymentRemovalRequestDTO.builder().reason("Must roll back").build()));

        assertTrue(paymentRepository.findByIdAndStay_Id(
                payment.getId(), fixture.stay().getId()).isPresent());
        assertEquals(0, removalRepository.count());
        assertEquals(0, jdbc.queryForObject(
                "select count(*) from sensitive_stay_contexts", Integer.class));
    }

    private Fixture fixture() {
        UserAccount actor = userRepository.saveAndFlush(UserAccount.builder()
                .username("audit-admin-" + UUID.randomUUID())
                .passwordHash(passwordEncoder.encode("password"))
                .role(UserRole.ADMIN)
                .enabled(true)
                .build());
        Owner owner = ownerRepository.saveAndFlush(Owner.builder()
                .fullName("Durable Owner")
                .primaryPhone("555-0123")
                .createdBy(actor)
                .build());
        Cat cat = catRepository.saveAndFlush(Cat.builder()
                .name("Durable Cat")
                .birthDate(LocalDate.of(2021, 1, 1))
                .sex(Sex.FEMALE)
                .owner(owner)
                .createdBy(actor)
                .build());
        LocalDateTime start = LocalDateTime.now().plusDays(2)
                .withSecond(0).withNano(0);
        Stay stay = Stay.builder()
                .startAt(start)
                .endAt(start.plusDays(2))
                .retainedNightlyRate(new BigDecimal("50"))
                .agreedAmount(new BigDecimal("100"))
                .owner(owner)
                .createdBy(actor)
                .build();
        stay.setStayCats(java.util.Set.of(StayCat.builder()
                .stay(stay)
                .cat(cat)
                .build()));
        stay = stayRepository.saveAndFlush(stay);
        return new Fixture(actor, owner, cat, stay);
    }

    private record Fixture(UserAccount actor, Owner owner, Cat cat, Stay stay) {}
}
