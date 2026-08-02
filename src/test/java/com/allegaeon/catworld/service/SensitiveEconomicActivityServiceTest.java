package com.allegaeon.catworld.service;

import com.allegaeon.catworld.dto.sensitiveactivity.*;
import com.allegaeon.catworld.exception.BadRequestException;
import com.allegaeon.catworld.exception.ForbiddenException;
import com.allegaeon.catworld.mapper.SensitiveEconomicActivityMapper;
import com.allegaeon.catworld.model.*;
import com.allegaeon.catworld.repository.*;
import com.allegaeon.catworld.security.CurrentUserAccountService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SensitiveEconomicActivityServiceTest {

    @Mock NightlyReferenceRateChangeRepository rateRepository;
    @Mock StayPricingDecisionRepository pricingRepository;
    @Mock StayAgreedAmountCorrectionRepository correctionRepository;
    @Mock StayPaymentEditRepository editRepository;
    @Mock StayPaymentAnnulmentRepository annulmentRepository;
    @Mock StayPaymentRemovalRepository removalRepository;
    @Mock SensitiveEconomicActivityMapper mapper;
    @Mock CurrentUserAccountService currentUserAccountService;
    @Mock SensitiveEconomicActivityAuthorizationPolicy authorizationPolicy;
    @InjectMocks SensitiveEconomicActivityService service;

    @Test
    void mergesExactSixProducersWithStableGlobalOrderingAndIdentity() {
        UserAccount admin = user(UserRole.ADMIN);
        when(currentUserAccountService.getCurrentUserAccount()).thenReturn(admin);
        Instant newest = Instant.parse("2026-08-02T12:00:00Z");
        Instant older = newest.minusSeconds(1);

        NightlyReferenceRateChange rate = mock(NightlyReferenceRateChange.class);
        StayPricingDecision pricing = mock(StayPricingDecision.class);
        StayAgreedAmountCorrection correction = mock(StayAgreedAmountCorrection.class);
        StayPaymentEdit edit = mock(StayPaymentEdit.class);
        StayPaymentAnnulment annulment = mock(StayPaymentAnnulment.class);
        StayPaymentRemoval removal = mock(StayPaymentRemoval.class);
        when(rateRepository.findAll()).thenReturn(List.of(rate));
        when(pricingRepository.findAllBySensitiveContextIsNotNull())
                .thenReturn(List.of(pricing));
        when(correctionRepository.findAllBySensitiveContextIsNotNull())
                .thenReturn(List.of(correction));
        when(editRepository.findAllBySensitiveContextIsNotNull())
                .thenReturn(List.of(edit));
        when(annulmentRepository.findAllBySensitiveContextIsNotNull())
                .thenReturn(List.of(annulment));
        when(removalRepository.findAll()).thenReturn(List.of(removal));

        SensitiveEconomicActivityResponseDTO rateDto =
                event(SensitiveEconomicEventType.NIGHTLY_RATE_CHANGED, newest, null);
        SensitiveEconomicActivityResponseDTO pricingDto =
                event(SensitiveEconomicEventType.PRICING_OVERRIDE, newest, context());
        SensitiveEconomicActivityResponseDTO correctionDto =
                event(SensitiveEconomicEventType.AGREED_AMOUNT_CORRECTED, older, context());
        SensitiveEconomicActivityResponseDTO editDto =
                event(SensitiveEconomicEventType.PAYMENT_EDITED, older, context());
        SensitiveEconomicActivityResponseDTO annulmentDto =
                event(SensitiveEconomicEventType.PAYMENT_ANNULLED, older, context());
        SensitiveEconomicActivityResponseDTO removalDto =
                event(SensitiveEconomicEventType.PAYMENT_REMOVED, older, context());
        when(mapper.map(rate)).thenReturn(rateDto);
        when(mapper.map(pricing)).thenReturn(Optional.of(pricingDto));
        when(mapper.map(correction)).thenReturn(correctionDto);
        when(mapper.map(edit)).thenReturn(editDto);
        when(mapper.map(annulment)).thenReturn(annulmentDto);
        when(mapper.map(removal)).thenReturn(removalDto);

        List<SensitiveEconomicActivityResponseDTO> result =
                service.getActivity(null);

        assertEquals(List.of(
                SensitiveEconomicEventType.NIGHTLY_RATE_CHANGED,
                SensitiveEconomicEventType.PRICING_OVERRIDE,
                SensitiveEconomicEventType.AGREED_AMOUNT_CORRECTED,
                SensitiveEconomicEventType.PAYMENT_EDITED,
                SensitiveEconomicEventType.PAYMENT_ANNULLED,
                SensitiveEconomicEventType.PAYMENT_REMOVED
        ), result.stream().map(SensitiveEconomicActivityResponseDTO::eventType).toList());
        assertEquals(6, result.stream()
                .map(event -> event.eventType() + ":" + event.eventId())
                .distinct().count());
        verify(authorizationPolicy).authorizeRead(admin);
    }

    @Test
    void appliesConjunctiveInclusiveExclusiveContextFiltersWithoutDuplication() {
        UserAccount admin = user(UserRole.ADMIN);
        when(currentUserAccountService.getCurrentUserAccount()).thenReturn(admin);
        UUID actorId = UUID.randomUUID();
        UUID ownerId = UUID.randomUUID();
        UUID catId = UUID.randomUUID();
        UUID stayId = UUID.randomUUID();
        Instant occurred = Instant.parse("2026-08-02T12:00:00Z");
        SensitiveStayContextDTO context = new SensitiveStayContextDTO(
                stayId, LocalDateTime.now(), LocalDateTime.now().plusDays(1), null,
                new SensitiveOwnerContextDTO(ownerId, "Owner"),
                List.of(new SensitiveCatContextDTO(catId, "A"),
                        new SensitiveCatContextDTO(UUID.randomUUID(), "B")));
        StayPaymentRemoval removal = mock(StayPaymentRemoval.class);
        when(removalRepository.findAll()).thenReturn(List.of(removal, removal));
        SensitiveEconomicActivityResponseDTO dto = event(
                SensitiveEconomicEventType.PAYMENT_REMOVED,
                occurred, context, actorId);
        when(mapper.map(removal)).thenReturn(dto);

        List<SensitiveEconomicActivityResponseDTO> result = service.getActivity(
                new SensitiveEconomicActivityFilter(
                        actorId, occurred, occurred.plusSeconds(1),
                        SensitiveEconomicEventType.PAYMENT_REMOVED,
                        ownerId, catId, stayId));

        assertEquals(List.of(dto), result);
        assertTrue(service.getActivity(new SensitiveEconomicActivityFilter(
                null, null, occurred, null, null, null, null)).isEmpty());
    }

    @Test
    void rejectsInvalidRangeAndDelegatesPersistedRoleAuthorization() {
        UserAccount staff = user(UserRole.STAFF);
        when(currentUserAccountService.getCurrentUserAccount()).thenReturn(staff);
        doThrow(new ForbiddenException("admin only"))
                .when(authorizationPolicy).authorizeRead(staff);
        assertThrows(ForbiddenException.class, () -> service.getActivity(null));

        reset(authorizationPolicy);
        Instant instant = Instant.parse("2026-08-02T12:00:00Z");
        assertThrows(BadRequestException.class, () -> service.getActivity(
                new SensitiveEconomicActivityFilter(
                        null, instant, instant, null, null, null, null)));
        verifyNoInteractions(rateRepository, pricingRepository, correctionRepository,
                editRepository, annulmentRepository, removalRepository);
    }

    @Test
    void realAuthorizationPolicyAllowsOnlyPersistedAdminRole() {
        SensitiveEconomicActivityAuthorizationPolicy policy =
                new SensitiveEconomicActivityAuthorizationPolicy();
        assertDoesNotThrow(() -> policy.authorizeRead(user(UserRole.ADMIN)));
        assertThrows(ForbiddenException.class,
                () -> policy.authorizeRead(user(UserRole.STAFF)));
        assertThrows(ForbiddenException.class, () -> policy.authorizeRead(null));
    }

    @Test
    void mapperIncludesOnlyContextLinkedPricingOverrides() {
        SensitiveEconomicActivityMapper realMapper =
                new SensitiveEconomicActivityMapper();
        SensitiveStayContext sensitiveContext = sensitiveContext();

        Optional<SensitiveEconomicActivityResponseDTO> override = realMapper.map(
                pricingDecision(
                        new BigDecimal("10"),
                        2,
                        new BigDecimal("15"),
                        "Approved adjustment",
                        sensitiveContext
                )
        );

        assertTrue(override.isPresent());
        PricingOverrideActivityDTO overrideDto =
                assertInstanceOf(PricingOverrideActivityDTO.class, override.get());
        assertEquals(new BigDecimal("10"), overrideDto.retainedNightlyRate());
        assertEquals(new BigDecimal("15"), overrideDto.agreedAmount());
        assertEquals(sensitiveContext.getStayId(),
                overrideDto.affectedContext().stayId());

        assertTrue(realMapper.map(pricingDecision(
                new BigDecimal("10"),
                2,
                new BigDecimal("20.0"),
                null,
                sensitiveContext
        )).isEmpty());
        assertTrue(realMapper.map(pricingDecision(
                null,
                2,
                BigDecimal.ZERO,
                null,
                sensitiveContext
        )).isEmpty());
        assertTrue(realMapper.map(pricingDecision(
                new BigDecimal("10"),
                2,
                new BigDecimal("15"),
                "Legacy adjustment",
                null
        )).isEmpty());
    }

    private SensitiveEconomicActivityResponseDTO event(
            SensitiveEconomicEventType type,
            Instant occurredAt,
            SensitiveStayContextDTO context) {
        return event(type, occurredAt, context, UUID.randomUUID());
    }

    private SensitiveEconomicActivityResponseDTO event(
            SensitiveEconomicEventType type,
            Instant occurredAt,
            SensitiveStayContextDTO context,
            UUID actorId) {
        UUID eventId = UUID.randomUUID();
        SensitiveActorDTO actor = new SensitiveActorDTO(actorId, "actor");
        return switch (type) {
            case NIGHTLY_RATE_CHANGED -> new NightlyRateChangedActivityDTO(
                    eventId, type, occurredAt, actor, null,
                    NightlyReferenceRateCategory.ONE_CAT,
                    new BigDecimal("10"), new BigDecimal("11"));
            case PRICING_OVERRIDE -> new PricingOverrideActivityDTO(
                    eventId, type, occurredAt, actor, context,
                    new BigDecimal("10"), 2, new BigDecimal("15"), "Override");
            case AGREED_AMOUNT_CORRECTED -> new AgreedAmountCorrectedActivityDTO(
                    eventId, type, occurredAt, actor, context,
                    new BigDecimal("15"), new BigDecimal("16"), "Correction");
            case PAYMENT_EDITED -> new PaymentEditedActivityDTO(
                    eventId, type, occurredAt, actor, context, UUID.randomUUID(),
                    new BigDecimal("5"), new BigDecimal("6"), null, null,
                    actor, occurredAt.minusSeconds(10), "Edit");
            case PAYMENT_ANNULLED -> new PaymentAnnulledActivityDTO(
                    eventId, type, occurredAt, actor, context, UUID.randomUUID(),
                    new BigDecimal("5"), null, null, actor,
                    occurredAt.minusSeconds(10), "Annul");
            case PAYMENT_REMOVED -> new PaymentRemovedActivityDTO(
                    eventId, type, occurredAt, actor, context, UUID.randomUUID(),
                    new BigDecimal("5"), null, null, actor,
                    occurredAt.minusSeconds(10), false, "Remove");
        };
    }

    private SensitiveStayContextDTO context() {
        return new SensitiveStayContextDTO(
                UUID.randomUUID(), LocalDateTime.now(),
                LocalDateTime.now().plusDays(1), null,
                new SensitiveOwnerContextDTO(UUID.randomUUID(), "Owner"),
                List.of(new SensitiveCatContextDTO(UUID.randomUUID(), "Cat")));
    }

    private SensitiveStayContext sensitiveContext() {
        SensitiveStayContext context = SensitiveStayContext.builder()
                .id(UUID.randomUUID())
                .stayId(UUID.randomUUID())
                .ownerId(UUID.randomUUID())
                .ownerFullName("Owner")
                .stayStartAt(LocalDateTime.of(2026, 8, 10, 10, 0))
                .stayEndAt(LocalDateTime.of(2026, 8, 12, 10, 0))
                .build();
        context.addCat(UUID.randomUUID(), "Cat");
        return context;
    }

    private StayPricingDecision pricingDecision(
            BigDecimal retainedRate,
            long nights,
            BigDecimal agreedAmount,
            String reason,
            SensitiveStayContext sensitiveContext) {
        return StayPricingDecision.builder()
                .id(UUID.randomUUID())
                .stayId(UUID.randomUUID())
                .retainedNightlyRate(retainedRate)
                .newNumberOfNights(nights)
                .newAgreedAmount(agreedAmount)
                .decidedBy(user(UserRole.ADMIN))
                .decidedAt(Instant.parse("2026-08-02T12:00:00Z"))
                .reason(reason)
                .sensitiveContext(sensitiveContext)
                .build();
    }

    private UserAccount user(UserRole role) {
        return UserAccount.builder()
                .id(UUID.randomUUID()).username(role.name()).role(role).build();
    }
}
