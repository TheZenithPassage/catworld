package com.allegaeon.catworld.service;

import com.allegaeon.catworld.dto.PricingDecisionRequestDTO;
import com.allegaeon.catworld.dto.StayCreationPricingPreviewRequestDTO;
import com.allegaeon.catworld.dto.StayDatePricingPreviewRequestDTO;
import com.allegaeon.catworld.dto.PaymentAnnulmentRequestDTO;
import com.allegaeon.catworld.dto.PaymentCondition;
import com.allegaeon.catworld.dto.PaymentEditRequestDTO;
import com.allegaeon.catworld.dto.PaymentRegistrationRequestDTO;
import com.allegaeon.catworld.dto.PaymentRemovalRequestDTO;
import com.allegaeon.catworld.dto.StayRequestDTO;
import com.allegaeon.catworld.dto.StayResponseDTO;
import com.allegaeon.catworld.dto.StayUpdateDTO;
import com.allegaeon.catworld.dto.VaccineConflictReason;
import com.allegaeon.catworld.dto.VaccineType;
import com.allegaeon.catworld.exception.BadRequestException;
import com.allegaeon.catworld.exception.ConflictException;
import com.allegaeon.catworld.exception.ForbiddenException;
import com.allegaeon.catworld.exception.ResourceNotFoundException;
import com.allegaeon.catworld.exception.StalePricingConfirmationException;
import com.allegaeon.catworld.exception.VaccineConflictException;
import com.allegaeon.catworld.mapper.StayMapper;
import com.allegaeon.catworld.model.Cat;
import com.allegaeon.catworld.model.NightlyReferenceRate;
import com.allegaeon.catworld.model.NightlyReferenceRateCategory;
import com.allegaeon.catworld.model.Owner;
import com.allegaeon.catworld.model.Stay;
import com.allegaeon.catworld.model.StayAgreedAmountCorrection;
import com.allegaeon.catworld.model.StayCat;
import com.allegaeon.catworld.model.StayPayment;
import com.allegaeon.catworld.model.StayPaymentAnnulment;
import com.allegaeon.catworld.model.StayPaymentEdit;
import com.allegaeon.catworld.model.StayPaymentRemoval;
import com.allegaeon.catworld.model.SensitiveStayContext;
import com.allegaeon.catworld.model.StayPricingDecision;
import com.allegaeon.catworld.model.UserAccount;
import com.allegaeon.catworld.model.UserRole;
import com.allegaeon.catworld.repository.CatRepository;
import com.allegaeon.catworld.repository.NightlyReferenceRateRepository;
import com.allegaeon.catworld.repository.StayAgreedAmountCorrectionRepository;
import com.allegaeon.catworld.repository.StayPaymentAnnulmentRepository;
import com.allegaeon.catworld.repository.StayPaymentEditRepository;
import com.allegaeon.catworld.repository.StayPaymentRepository;
import com.allegaeon.catworld.repository.StayPaymentRemovalRepository;
import com.allegaeon.catworld.repository.StayPricingDecisionRepository;
import com.allegaeon.catworld.repository.StayRepository;
import com.allegaeon.catworld.security.CurrentUserAccountService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.InjectMocks;
import org.mockito.InOrder;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.DataIntegrityViolationException;
import static org.mockito.Mockito.*;
import static org.junit.jupiter.api.Assertions.*;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@ExtendWith(MockitoExtension.class)
public class StayServiceTest {

    @Mock
    private StayRepository stayRepository;

    @Mock
    private StayMapper stayMapper;

    @Mock
    private CatRepository catRepository;

    @Mock
    private NightlyReferenceRateRepository nightlyReferenceRateRepository;

    @Mock
    private StayPricingDecisionRepository stayPricingDecisionRepository;

    @Mock
    private StayAgreedAmountCorrectionRepository
            stayAgreedAmountCorrectionRepository;

    @Mock
    private StayPaymentRepository stayPaymentRepository;

    @Mock
    private StayPaymentEditRepository stayPaymentEditRepository;

    @Mock
    private StayPaymentAnnulmentRepository stayPaymentAnnulmentRepository;

    @Mock
    private StayPaymentRemovalRepository stayPaymentRemovalRepository;

    @Mock
    private SensitiveStayContextFactory sensitiveStayContextFactory;

    @Mock
    private CurrentUserAccountService currentUserAccountService;

    @Mock
    private DeletionAuthorizationPolicy deletionAuthorizationPolicy;

    @Spy
    private StayPricingAuthorizationPolicy stayPricingAuthorizationPolicy =
            new StayPricingAuthorizationPolicy();

    @Spy
    private StayPaymentAuthorizationPolicy stayPaymentAuthorizationPolicy =
            new StayPaymentAuthorizationPolicy();

    @Mock
    private Clock clock;

    @InjectMocks
    private StayService service;

    @Captor
    private ArgumentCaptor<Stay> stayCaptor;

    @Captor
    private ArgumentCaptor<StayPricingDecision> pricingDecisionCaptor;

    @Captor
    private ArgumentCaptor<StayAgreedAmountCorrection> correctionCaptor;

    @BeforeEach
    void configurePricingDefaults() {
        lenient().when(nightlyReferenceRateRepository.findById(any()))
                .thenReturn(Optional.of(NightlyReferenceRate.builder()
                        .category(NightlyReferenceRateCategory.ONE_CAT)
                        .build()));
        lenient().when(nightlyReferenceRateRepository.findByCategoryForUpdate(any()))
                .thenReturn(Optional.of(NightlyReferenceRate.builder()
                        .category(NightlyReferenceRateCategory.ONE_CAT)
                        .build()));
        lenient().when(stayRepository.findByIdForUpdate(any()))
                .thenAnswer(invocation -> stayRepository.findById(invocation.getArgument(0)));
        lenient().when(stayMapper.calculateNumberOfNights(any(), any()))
                .thenCallRealMethod();
        lenient().when(stayMapper.calculateSuggestedAmount(
                        nullable(BigDecimal.class),
                        anyLong()))
                .thenCallRealMethod();
        lenient().when(clock.instant()).thenReturn(Instant.parse("2026-07-28T12:00:00Z"));
        lenient().when(stayPaymentRepository
                        .findAllByStay_IdOrderByCreatedAtAscIdAsc(any()))
                .thenReturn(List.of());
        lenient().when(stayPaymentRepository
                        .findAllByStay_IdInOrderByCreatedAtAscIdAsc(any()))
                .thenReturn(List.of());
    }

    @Nested
    class CreateStayTests {

        @Test
        public void shouldThrowBadRequest_whenEndDateIsNotAfterStartDate() {

            LocalDateTime startAt = LocalDateTime.now().plusDays(2);
            LocalDateTime endAt = startAt.minusDays(1);

            assertThrows(BadRequestException.class, () -> {
                service.createStay(StayRequestDTO.builder()
                        .startAt(startAt)
                        .endAt(endAt)
                        .catIds(Set.of(UUID.randomUUID()))
                        .build());
            });

        }

        @Test
        public void shouldThrowBadRequest_whenCatsHaveDifferentOwner() {

            LocalDateTime startAt = LocalDateTime.now().plusDays(2);
            LocalDateTime endAt = startAt.plusDays(7);

            Cat cat1 = Cat.builder()
                    .id(UUID.randomUUID())
                    .owner(Owner.builder()
                            .id(UUID.randomUUID())
                            .build())
                    .build();

            Cat cat2 = Cat.builder()
                    .id(UUID.randomUUID())
                    .owner(Owner.builder()
                            .id(UUID.randomUUID())
                            .build())
                    .build();

            when(catRepository.findById(cat1.getId())).thenReturn(Optional.of(cat1));
            when(catRepository.findById(cat2.getId())).thenReturn(Optional.of(cat2));

            assertThrows(BadRequestException.class, () -> {
                service.createStay(StayRequestDTO.builder()
                        .startAt(startAt)
                        .endAt(endAt)
                        .catIds(Set.of(cat1.getId(), cat2.getId()))
                        .build());
            });

        }

        @Test
        public void shouldThrowConflict_whenCatHasOverbooking() {

            LocalDateTime existingStartAt = LocalDateTime.now().plusDays(1);
            LocalDateTime existingEndAt = existingStartAt.plusDays(11);
            LocalDateTime requestedStartAt = existingStartAt.plusDays(8);
            LocalDateTime requestedEndAt = requestedStartAt.plusDays(7);

            Stay existingStay = Stay.builder()
                    .id(UUID.randomUUID())
                    .startAt(existingStartAt)
                    .endAt(existingEndAt)
                    .build();

            Cat cat = Cat.builder()
                    .id(UUID.randomUUID())
                    .name("Cat 1")
                    .owner(Owner.builder()
                            .id(UUID.randomUUID())
                            .build())
                    .build();

            linkStayAndCat(existingStay, cat);

            when(catRepository.findById(cat.getId())).thenReturn(Optional.of(cat));

            assertThrows(ConflictException.class, () -> {
                service.createStay(StayRequestDTO.builder()
                        .startAt(requestedStartAt)
                        .endAt(requestedEndAt)
                        .catIds(Set.of(cat.getId()))
                        .build());
            });

        }

        @Test
        public void shouldCreateStay_whenReceivingOnlyOneCat() {

            LocalDateTime startAt = LocalDateTime.now().plusDays(1);
            LocalDateTime endAt = startAt.plusDays(18);

            Owner owner = Owner.builder()
                    .id(UUID.randomUUID())
                    .fullName("Owner")
                    .build();

            Cat cat = Cat.builder()
                    .id(UUID.randomUUID())
                    .name("Cat")
                    .owner(owner)
                    .lastRabiesDate(endAt.toLocalDate())
                    .lastTripleFelineDate(endAt.toLocalDate())
                    .build();

            StayRequestDTO stayRequestDTO = StayRequestDTO.builder()
                    .startAt(startAt)
                    .endAt(endAt)
                    .catIds(Set.of(cat.getId()))
                    .pricingDecision(pricingDecision())
                    .build();

            Stay mappedStay = Stay.builder()
                    .startAt(stayRequestDTO.getStartAt())
                    .endAt(stayRequestDTO.getEndAt())
                    .build();

            StayResponseDTO expectedResponseDTO = new StayResponseDTO();
            UserAccount creator = UserAccount.builder()
                    .id(UUID.randomUUID())
                    .username("staff")
                    .role(UserRole.STAFF)
                    .build();

            when(stayRepository.save(any(Stay.class))).thenAnswer(i -> i.getArgument(0));
            when(catRepository.findById(cat.getId())).thenReturn(Optional.of(cat));
            when(stayMapper.toEntity(stayRequestDTO)).thenReturn(mappedStay);
            when(currentUserAccountService.getCurrentUserAccount()).thenReturn(creator);
            when(deletionAuthorizationPolicy.canDelete(any(), any())).thenReturn(true);
            when(stayMapper.toResponseDTO(any(Stay.class), eq(true))).thenReturn(expectedResponseDTO);

            confirmCreation(stayRequestDTO);
            StayResponseDTO result = service.createStay(stayRequestDTO);

            assertSame(expectedResponseDTO, result);

            verify(stayRepository).save(stayCaptor.capture());
            Stay savedStay = stayCaptor.getValue();

            assertEquals(stayRequestDTO.getStartAt(), savedStay.getStartAt());
            assertEquals(stayRequestDTO.getEndAt(), savedStay.getEndAt());
            assertEquals(owner.getId(), savedStay.getOwner().getId());
            assertSame(creator, savedStay.getCreatedBy());

            Set<UUID> savedCatIds = savedStay.getStayCats().stream().map(stayCat -> stayCat.getCat().getId()).collect(Collectors.toSet());

            assertEquals(Set.of(cat.getId()), savedCatIds);

        }

        @Test
        public void shouldCreateStay_whenReceivingMultipleCatsWithSameOwner() {

            LocalDateTime startAt = LocalDateTime.now().plusDays(1);
            LocalDateTime endAt = startAt.plusDays(18);

            Owner owner = Owner.builder()
                    .id(UUID.randomUUID())
                    .fullName("Owner")
                    .build();

            Cat cat1 = Cat.builder()
                    .id(UUID.randomUUID())
                    .name("Cat 1")
                    .owner(owner)
                    .lastRabiesDate(endAt.toLocalDate())
                    .lastTripleFelineDate(endAt.toLocalDate())
                    .build();

            Cat cat2 = Cat.builder()
                    .id(UUID.randomUUID())
                    .name("Cat 2")
                    .owner(owner)
                    .lastRabiesDate(endAt.toLocalDate())
                    .lastTripleFelineDate(endAt.toLocalDate())
                    .build();

            StayRequestDTO stayRequestDTO = StayRequestDTO.builder()
                    .startAt(startAt)
                    .endAt(endAt)
                    .catIds(Set.of(cat1.getId(), cat2.getId()))
                    .pricingDecision(pricingDecision())
                    .build();

            Stay mappedStay = Stay.builder()
                    .startAt(stayRequestDTO.getStartAt())
                    .endAt(stayRequestDTO.getEndAt())
                    .build();

            StayResponseDTO expectedResponseDTO = new StayResponseDTO();
            UserAccount creator = UserAccount.builder()
                    .id(UUID.randomUUID())
                    .username("staff")
                    .role(UserRole.STAFF)
                    .build();

            when(stayRepository.save(any(Stay.class))).thenAnswer(i -> i.getArgument(0));
            when(catRepository.findById(cat1.getId())).thenReturn(Optional.of(cat1));
            when(catRepository.findById(cat2.getId())).thenReturn(Optional.of(cat2));
            when(stayMapper.toEntity(stayRequestDTO)).thenReturn(mappedStay);
            when(currentUserAccountService.getCurrentUserAccount()).thenReturn(creator);
            when(deletionAuthorizationPolicy.canDelete(any(), any())).thenReturn(true);
            when(stayMapper.toResponseDTO(any(Stay.class), eq(true))).thenReturn(expectedResponseDTO);

            confirmCreation(stayRequestDTO);
            StayResponseDTO result = service.createStay(stayRequestDTO);

            assertSame(expectedResponseDTO, result);

            verify(stayRepository).save(stayCaptor.capture());
            Stay savedStay = stayCaptor.getValue();

            assertEquals(stayRequestDTO.getStartAt(), savedStay.getStartAt());
            assertEquals(stayRequestDTO.getEndAt(), savedStay.getEndAt());
            assertEquals(owner.getId(), savedStay.getOwner().getId());
            assertSame(creator, savedStay.getCreatedBy());

            Set<UUID> savedCatIds = savedStay.getStayCats().stream().map(stayCat -> stayCat.getCat().getId()).collect(Collectors.toSet());

            assertEquals(Set.of(cat1.getId(), cat2.getId()), savedCatIds);

        }

        @Test
        public void shouldCreateStay_whenOverlappingStayIsCancelled() {

            LocalDateTime requestedStartAt = LocalDateTime.now().plusDays(1);
            LocalDateTime requestedEndAt = requestedStartAt.plusDays(18);
            LocalDateTime cancelledStartAt = requestedStartAt.minusDays(1);
            LocalDateTime cancelledEndAt = requestedStartAt.plusDays(10);

            Owner owner = Owner.builder()
                    .id(UUID.randomUUID())
                    .fullName("Owner")
                    .build();

            Cat cat = Cat.builder()
                    .id(UUID.randomUUID())
                    .name("Cat")
                    .owner(owner)
                    .lastRabiesDate(requestedEndAt.toLocalDate())
                    .lastTripleFelineDate(requestedEndAt.toLocalDate())
                    .build();

            StayRequestDTO stayRequestDTO = StayRequestDTO.builder()
                    .startAt(requestedStartAt)
                    .endAt(requestedEndAt)
                    .catIds(Set.of(cat.getId()))
                    .pricingDecision(pricingDecision())
                    .build();

            Stay cancelledStay = Stay.builder()
                    .id(UUID.randomUUID())
                    .startAt(cancelledStartAt)
                    .endAt(cancelledEndAt)
                    .cancelledAt(LocalDateTime.now().minusDays(1))
                    .build();

            linkStayAndCat(cancelledStay, cat);

            Stay mappedStay = Stay.builder()
                    .startAt(stayRequestDTO.getStartAt())
                    .endAt(stayRequestDTO.getEndAt())
                    .build();

            StayResponseDTO expectedResponseDTO = new StayResponseDTO();
            UserAccount creator = UserAccount.builder()
                    .id(UUID.randomUUID())
                    .username("staff")
                    .role(UserRole.STAFF)
                    .build();

            when(stayRepository.save(any(Stay.class))).thenAnswer(i -> i.getArgument(0));
            when(catRepository.findById(cat.getId())).thenReturn(Optional.of(cat));
            when(stayMapper.toEntity(stayRequestDTO)).thenReturn(mappedStay);
            when(currentUserAccountService.getCurrentUserAccount()).thenReturn(creator);
            when(deletionAuthorizationPolicy.canDelete(any(), any())).thenReturn(true);
            when(stayMapper.toResponseDTO(any(Stay.class), eq(true))).thenReturn(expectedResponseDTO);

            confirmCreation(stayRequestDTO);
            StayResponseDTO result = assertDoesNotThrow(() -> service.createStay(stayRequestDTO));

            assertSame(expectedResponseDTO, result);

            verify(stayRepository).save(stayCaptor.capture());
            Stay savedStay = stayCaptor.getValue();

            assertEquals(stayRequestDTO.getStartAt(), savedStay.getStartAt());
            assertEquals(stayRequestDTO.getEndAt(), savedStay.getEndAt());
            assertEquals(owner.getId(), savedStay.getOwner().getId());
            assertSame(creator, savedStay.getCreatedBy());

            Set<UUID> savedCatIds = savedStay.getStayCats().stream().map(stayCat -> stayCat.getCat().getId()).collect(Collectors.toSet());

            assertEquals(Set.of(cat.getId()), savedCatIds);

        }

    }

    @Nested
    class StayPricingTests {

        @ParameterizedTest
        @CsvSource({
                "1, ONE_CAT",
                "2, TWO_CATS",
                "3, THREE_PLUS_CATS",
                "4, THREE_PLUS_CATS"
        })
        void creationSelectsActualCatCountCategoryAndRecordsExactInitialDecision(
                int catCount,
                NightlyReferenceRateCategory expectedCategory) {
            LocalDateTime startAt = LocalDateTime.of(2027, 8, 1, 12, 0);
            LocalDateTime endAt = LocalDateTime.of(2027, 8, 3, 12, 0);
            CreationFixture fixture = stubPricingCreation(
                    catCount,
                    startAt,
                    endAt,
                    new BigDecimal("25"),
                    PricingDecisionRequestDTO.builder()
                            .agreedAmount(new BigDecimal("50.0"))
                            .build()
            );

            service.createStay(fixture.request());

            verify(nightlyReferenceRateRepository)
                    .findByCategoryForUpdate(expectedCategory);
            assertEquals(new BigDecimal("25"), fixture.stay().getRetainedNightlyRate());
            assertEquals(new BigDecimal("50"), fixture.stay().getAgreedAmount());
            verify(stayPricingDecisionRepository).saveAndFlush(
                    pricingDecisionCaptor.capture()
            );
            StayPricingDecision event = pricingDecisionCaptor.getValue();
            assertEquals(fixture.stay().getId(), event.getStayId());
            assertEquals(new BigDecimal("25"), event.getRetainedNightlyRate());
            assertNull(event.getPreviousNumberOfNights());
            assertEquals(2, event.getNewNumberOfNights());
            assertNull(event.getPreviousAgreedAmount());
            assertEquals(new BigDecimal("50"), event.getNewAgreedAmount());
            assertSame(fixture.actor(), event.getDecidedBy());
            assertEquals(Instant.parse("2026-07-28T12:00:00Z"), event.getDecidedAt());
            assertNull(event.getReason());
        }

        @Test
        void creationWithoutConfiguredRateAllowsExplicitZeroAgreementForZeroNights() {
            LocalDateTime startAt = LocalDateTime.now().plusDays(2)
                    .withHour(8).withMinute(0).withSecond(0).withNano(0);
            LocalDateTime endAt = startAt.withHour(18);
            CreationFixture fixture = stubPricingCreation(
                    1,
                    startAt,
                    endAt,
                    null,
                    pricingDecision()
            );

            service.createStay(fixture.request());

            assertNull(fixture.stay().getRetainedNightlyRate());
            assertEquals(BigDecimal.ZERO, fixture.stay().getAgreedAmount());
            verify(stayPricingDecisionRepository).saveAndFlush(
                    pricingDecisionCaptor.capture()
            );
            assertEquals(0, pricingDecisionCaptor.getValue().getNewNumberOfNights());
            assertNull(pricingDecisionCaptor.getValue().getRetainedNightlyRate());
        }

        @Test
        void creationWithAvailableRateAllowsZeroAgreementForZeroNights() {
            LocalDateTime startAt = LocalDateTime.of(2027, 8, 1, 8, 0);
            LocalDateTime endAt = LocalDateTime.of(2027, 8, 1, 18, 0);
            CreationFixture fixture = stubPricingCreation(
                    1,
                    startAt,
                    endAt,
                    new BigDecimal("25"),
                    pricingDecision()
            );

            service.createStay(fixture.request());

            assertEquals(new BigDecimal("25"), fixture.stay().getRetainedNightlyRate());
            assertEquals(BigDecimal.ZERO, fixture.stay().getAgreedAmount());
            verify(stayPricingDecisionRepository).saveAndFlush(
                    pricingDecisionCaptor.capture()
            );
            assertEquals(0, pricingDecisionCaptor.getValue().getNewNumberOfNights());
            assertEquals(
                    new BigDecimal("25"),
                    pricingDecisionCaptor.getValue().getRetainedNightlyRate()
            );
        }

        @Test
        void creationRequiresNonBlankReasonWhenAgreementDiffersFromSuggestion() {
            LocalDateTime startAt = LocalDateTime.of(2027, 8, 1, 12, 0);
            LocalDateTime endAt = LocalDateTime.of(2027, 8, 3, 12, 0);
            CreationFixture fixture = stubPricingCreation(
                    1,
                    startAt,
                    endAt,
                    new BigDecimal("25"),
                    PricingDecisionRequestDTO.builder()
                            .agreedAmount(new BigDecimal("40"))
                            .reason("   ")
                            .build()
            );

            assertThrows(
                    BadRequestException.class,
                    () -> service.createStay(fixture.request())
            );

            verify(stayRepository, never()).save(any(Stay.class));
            verify(stayPricingDecisionRepository, never())
                    .saveAndFlush(any(StayPricingDecision.class));
        }

        @ParameterizedTest
        @ValueSource(strings = {
                "-1",
                "1.5",
                "100000000000000000000"
        })
        void creationRejectsUnsupportedAgreedAmountsAtServiceBoundary(String value) {
            LocalDateTime startAt = LocalDateTime.of(2027, 8, 1, 12, 0);
            LocalDateTime endAt = LocalDateTime.of(2027, 8, 2, 12, 0);
            CreationFixture fixture = stubPricingCreation(
                    1,
                    startAt,
                    endAt,
                    null,
                    PricingDecisionRequestDTO.builder()
                            .agreedAmount(new BigDecimal(value))
                            .build()
            );

            assertThrows(
                    BadRequestException.class,
                    () -> service.createStay(fixture.request())
            );

            verify(stayRepository, never()).save(any(Stay.class));
            verify(stayPricingDecisionRepository, never())
                    .saveAndFlush(any(StayPricingDecision.class));
        }

        @Test
        void adminNightCountChangeUsesRetainedRateAndRecordsPriorAndNewContext() {
            LocalDateTime startAt = LocalDateTime.of(2027, 8, 1, 12, 0);
            Stay stay = Stay.builder()
                    .id(UUID.randomUUID())
                    .startAt(startAt)
                    .endAt(startAt.plusDays(2))
                    .retainedNightlyRate(new BigDecimal("10"))
                    .agreedAmount(new BigDecimal("20"))
                    .build();
            StayUpdateDTO request = StayUpdateDTO.builder()
                    .startAt(startAt)
                    .endAt(startAt.plusDays(3))
                    .pricingDecision(PricingDecisionRequestDTO.builder()
                            .agreedAmount(new BigDecimal("20.0"))
                            .reason("Client agreement remains unchanged")
                            .build())
                    .build();
            UserAccount admin = user(UserRole.ADMIN);

            when(stayRepository.findById(stay.getId())).thenReturn(Optional.of(stay));
            when(currentUserAccountService.getCurrentUserAccount()).thenReturn(admin);
            when(stayMapper.updateEntity(stay, request)).thenAnswer(invocation -> {
                stay.setStartAt(request.getStartAt());
                stay.setEndAt(request.getEndAt());
                return stay;
            });
            when(stayRepository.save(stay)).thenReturn(stay);
            when(stayMapper.toResponseDTO(stay, false)).thenReturn(new StayResponseDTO());

            confirmDateChange(stay, request);
            service.updateStay(stay.getId(), request);

            assertEquals(new BigDecimal("10"), stay.getRetainedNightlyRate());
            assertEquals(new BigDecimal("20"), stay.getAgreedAmount());
            verify(stayRepository).findByIdForUpdate(stay.getId());
            verify(nightlyReferenceRateRepository, never()).findById(any());
            verify(stayPricingDecisionRepository).saveAndFlush(
                    pricingDecisionCaptor.capture()
            );
            StayPricingDecision event = pricingDecisionCaptor.getValue();
            assertEquals(2L, event.getPreviousNumberOfNights());
            assertEquals(3L, event.getNewNumberOfNights());
            assertEquals(new BigDecimal("20"), event.getPreviousAgreedAmount());
            assertEquals(new BigDecimal("20"), event.getNewAgreedAmount());
            assertEquals("Client agreement remains unchanged", event.getReason());
            assertSame(admin, event.getDecidedBy());
        }

        @Test
        void staffCannotCompleteNightCountChange() {
            LocalDateTime startAt = LocalDateTime.of(2027, 8, 1, 12, 0);
            Stay stay = Stay.builder()
                    .id(UUID.randomUUID())
                    .startAt(startAt)
                    .endAt(startAt.plusDays(2))
                    .agreedAmount(BigDecimal.ZERO)
                    .build();
            StayUpdateDTO request = StayUpdateDTO.builder()
                    .startAt(startAt)
                    .endAt(startAt.plusDays(3))
                    .pricingDecision(pricingDecision())
                    .build();

            when(stayRepository.findById(stay.getId())).thenReturn(Optional.of(stay));
            when(currentUserAccountService.getCurrentUserAccount())
                    .thenReturn(user(UserRole.STAFF));

            assertThrows(
                    ForbiddenException.class,
                    () -> service.updateStay(stay.getId(), request)
            );

            verify(stayMapper, never()).updateEntity(any(), any());
            verify(stayRepository, never()).save(any(Stay.class));
            verify(stayPricingDecisionRepository, never())
                    .saveAndFlush(any(StayPricingDecision.class));
        }

        @Test
        void nightCountChangeRequiresFreshDecisionAndNonBlankMismatchReason() {
            LocalDateTime startAt = LocalDateTime.of(2027, 8, 1, 12, 0);
            Stay stay = Stay.builder()
                    .id(UUID.randomUUID())
                    .startAt(startAt)
                    .endAt(startAt.plusDays(2))
                    .retainedNightlyRate(new BigDecimal("10"))
                    .agreedAmount(new BigDecimal("20"))
                    .build();
            StayUpdateDTO missingDecision = StayUpdateDTO.builder()
                    .startAt(startAt)
                    .endAt(startAt.plusDays(3))
                    .build();
            StayUpdateDTO blankReason = StayUpdateDTO.builder()
                    .startAt(startAt)
                    .endAt(startAt.plusDays(3))
                    .pricingDecision(PricingDecisionRequestDTO.builder()
                            .agreedAmount(new BigDecimal("20"))
                            .reason("   ")
                            .build())
                    .build();

            when(stayRepository.findById(stay.getId())).thenReturn(Optional.of(stay));
            when(currentUserAccountService.getCurrentUserAccount())
                    .thenReturn(user(UserRole.ADMIN));

            assertThrows(
                    BadRequestException.class,
                    () -> service.updateStay(stay.getId(), missingDecision)
            );
            assertThrows(
                    BadRequestException.class,
                    () -> service.updateStay(stay.getId(), blankReason)
            );

            verify(stayMapper, never()).updateEntity(any(), any());
            verify(stayRepository, never()).save(any(Stay.class));
            verify(stayPricingDecisionRepository, never())
                    .saveAndFlush(any(StayPricingDecision.class));
        }

        @Test
        void nightCountChangeWithoutRetainedRateDoesNotAdoptCurrentRate() {
            LocalDateTime startAt = LocalDateTime.of(2027, 8, 1, 12, 0);
            Stay stay = Stay.builder()
                    .id(UUID.randomUUID())
                    .startAt(startAt)
                    .endAt(startAt.plusDays(2))
                    .retainedNightlyRate(null)
                    .agreedAmount(new BigDecimal("20"))
                    .build();
            StayUpdateDTO request = StayUpdateDTO.builder()
                    .startAt(startAt)
                    .endAt(startAt.plusDays(3))
                    .pricingDecision(PricingDecisionRequestDTO.builder()
                            .agreedAmount(new BigDecimal("25"))
                            .build())
                    .build();
            UserAccount admin = user(UserRole.ADMIN);

            when(stayRepository.findById(stay.getId())).thenReturn(Optional.of(stay));
            when(currentUserAccountService.getCurrentUserAccount()).thenReturn(admin);
            when(stayMapper.updateEntity(stay, request)).thenAnswer(invocation -> {
                stay.setStartAt(request.getStartAt());
                stay.setEndAt(request.getEndAt());
                return stay;
            });
            when(stayRepository.save(stay)).thenReturn(stay);
            when(stayMapper.toResponseDTO(stay, false)).thenReturn(new StayResponseDTO());

            confirmDateChange(stay, request);
            service.updateStay(stay.getId(), request);

            assertNull(stay.getRetainedNightlyRate());
            assertEquals(new BigDecimal("25"), stay.getAgreedAmount());
            verify(nightlyReferenceRateRepository, never()).findById(any());
            verify(stayPricingDecisionRepository).saveAndFlush(
                    pricingDecisionCaptor.capture()
            );
            assertNull(pricingDecisionCaptor.getValue().getRetainedNightlyRate());
            assertNull(pricingDecisionCaptor.getValue().getReason());
        }

        @Test
        void equalNightCountDateShiftRequiresNoPricingDecisionOrEvent() {
            LocalDateTime startAt = LocalDateTime.of(2027, 8, 1, 12, 0);
            Stay stay = Stay.builder()
                    .id(UUID.randomUUID())
                    .startAt(startAt)
                    .endAt(startAt.plusDays(2))
                    .retainedNightlyRate(new BigDecimal("10"))
                    .agreedAmount(new BigDecimal("20"))
                    .build();
            StayUpdateDTO request = StayUpdateDTO.builder()
                    .startAt(startAt.plusDays(1))
                    .endAt(startAt.plusDays(3))
                    .build();

            when(stayRepository.findById(stay.getId())).thenReturn(Optional.of(stay));
            when(stayMapper.updateEntity(stay, request)).thenAnswer(invocation -> {
                stay.setStartAt(request.getStartAt());
                stay.setEndAt(request.getEndAt());
                return stay;
            });
            when(stayRepository.save(stay)).thenReturn(stay);
            when(stayMapper.toResponseDTO(stay, false)).thenReturn(new StayResponseDTO());

            service.updateStay(stay.getId(), request);

            verify(currentUserAccountService, never()).getCurrentUserAccount();
            verify(stayPricingDecisionRepository, never())
                    .saveAndFlush(any(StayPricingDecision.class));
            assertEquals(new BigDecimal("10"), stay.getRetainedNightlyRate());
            assertEquals(new BigDecimal("20"), stay.getAgreedAmount());
        }

        @Test
        void sameLocalDateTimeAndNotesChangeRequiresNoPricingDecisionOrEvent() {
            LocalDateTime startAt = LocalDateTime.now().plusDays(2)
                    .withHour(8).withMinute(0).withSecond(0).withNano(0);
            Stay stay = Stay.builder()
                    .id(UUID.randomUUID())
                    .startAt(startAt)
                    .endAt(startAt.withHour(18))
                    .retainedNightlyRate(new BigDecimal("10"))
                    .agreedAmount(BigDecimal.ZERO)
                    .build();
            StayUpdateDTO request = StayUpdateDTO.builder()
                    .startAt(startAt.withHour(9))
                    .endAt(startAt.withHour(19))
                    .notes("Updated operational note")
                    .build();

            when(stayRepository.findById(stay.getId())).thenReturn(Optional.of(stay));
            when(stayMapper.updateEntity(stay, request)).thenAnswer(invocation -> {
                stay.setStartAt(request.getStartAt());
                stay.setEndAt(request.getEndAt());
                stay.setNotes(request.getNotes());
                return stay;
            });
            when(stayRepository.save(stay)).thenReturn(stay);
            when(stayMapper.toResponseDTO(stay, false)).thenReturn(new StayResponseDTO());

            service.updateStay(stay.getId(), request);

            verify(currentUserAccountService, never()).getCurrentUserAccount();
            verify(stayPricingDecisionRepository, never())
                    .saveAndFlush(any(StayPricingDecision.class));
            assertEquals("Updated operational note", stay.getNotes());
            assertEquals(BigDecimal.ZERO, stay.getAgreedAmount());
        }

        @Test
        void creationPreviewReturnsExactStringsAndPerformsNoWrites() {
            LocalDateTime startAt = LocalDateTime.of(2027, 8, 1, 8, 0);
            CreationFixture fixture = stubPricingCreation(
                    3, startAt, startAt.plusDays(1),
                    new BigDecimal("9999999999999999999"),
                    PricingDecisionRequestDTO.builder()
                            .agreedAmount(BigDecimal.ZERO).build());

            var preview = service.previewCreationPricing(
                    StayCreationPricingPreviewRequestDTO.builder()
                            .startAt(startAt).endAt(startAt.plusDays(1))
                            .catIds(fixture.request().getCatIds()).build());

            assertEquals(1, preview.getNumberOfNights());
            assertEquals(0, new BigDecimal("9999999999999999999")
                    .compareTo(preview.getRetainedNightlyRate()));
            assertEquals(0, new BigDecimal("9999999999999999999")
                    .compareTo(preview.getSuggestedAmount()));
            assertNotNull(preview.getConfirmation());
            verify(stayRepository, never()).save(any());
            verify(stayPricingDecisionRepository, never()).saveAndFlush(any());
        }

        @Test
        void changedRateRejectsCreationConfirmationBeforeWrites() {
            LocalDateTime startAt = LocalDateTime.of(2027, 8, 1, 8, 0);
            CreationFixture fixture = stubPricingCreation(
                    1, startAt, startAt.plusDays(2), new BigDecimal("10"),
                    PricingDecisionRequestDTO.builder()
                            .agreedAmount(new BigDecimal("20")).build());
            when(nightlyReferenceRateRepository
                    .findByCategoryForUpdate(NightlyReferenceRateCategory.ONE_CAT))
                    .thenReturn(Optional.of(NightlyReferenceRate.builder()
                            .category(NightlyReferenceRateCategory.ONE_CAT)
                            .nightlyRate(new BigDecimal("11")).build()));

            assertThrows(StalePricingConfirmationException.class,
                    () -> service.createStay(fixture.request()));
            verify(stayRepository, never()).save(any());
            verify(stayPricingDecisionRepository, never()).saveAndFlush(any());
        }

        @ParameterizedTest
        @ValueSource(strings = {"numberOfNights", "retainedNightlyRate", "suggestedAmount"})
        void creationValidatesEveryConfirmationField(String field) {
            LocalDateTime startAt = LocalDateTime.of(2027, 8, 1, 8, 0);
            CreationFixture fixture = stubPricingCreation(
                    1, startAt, startAt.plusDays(2), new BigDecimal("10"),
                    PricingDecisionRequestDTO.builder()
                            .agreedAmount(new BigDecimal("20")).build());
            var confirmation = fixture.request().getConfirmation();
            switch (field) {
                case "numberOfNights" -> confirmation.setNumberOfNights(3L);
                case "retainedNightlyRate" ->
                        confirmation.setRetainedNightlyRate(new BigDecimal("11"));
                case "suggestedAmount" ->
                        confirmation.setSuggestedAmount(new BigDecimal("21"));
                default -> throw new IllegalArgumentException(field);
            }

            assertThrows(StalePricingConfirmationException.class,
                    () -> service.createStay(fixture.request()));
            verify(stayRepository, never()).save(any());
            verify(stayPricingDecisionRepository, never()).saveAndFlush(any());
        }

        @Test
        void existingPreviewUsesRetainedRateAndStaleBasisRejectsUpdate() {
            LocalDateTime startAt = LocalDateTime.of(2027, 8, 1, 8, 0);
            Stay stay = Stay.builder().id(UUID.randomUUID())
                    .startAt(startAt).endAt(startAt.plusDays(2))
                    .retainedNightlyRate(new BigDecimal("17"))
                    .agreedAmount(new BigDecimal("34")).build();
            when(stayRepository.findById(stay.getId())).thenReturn(Optional.of(stay));
            when(currentUserAccountService.getCurrentUserAccount())
                    .thenReturn(user(UserRole.ADMIN));
            var preview = service.previewDateChangePricing(
                    stay.getId(), StayDatePricingPreviewRequestDTO.builder()
                            .startAt(startAt).endAt(startAt.plusDays(3)).build());
            StayUpdateDTO request = StayUpdateDTO.builder()
                    .startAt(startAt).endAt(startAt.plusDays(3))
                    .pricingDecision(PricingDecisionRequestDTO.builder()
                            .agreedAmount(new BigDecimal("51"))
                            .build()).build();
            request.setConfirmation(preview.getConfirmation());
            stay.setAgreedAmount(new BigDecimal("35"));

            assertEquals(0, new BigDecimal("17")
                    .compareTo(preview.getRetainedNightlyRate()));
            assertEquals(0, new BigDecimal("51")
                    .compareTo(preview.getSuggestedAmount()));
            assertThrows(StalePricingConfirmationException.class,
                    () -> service.updateStay(stay.getId(), request));
            verify(stayRepository, never()).save(any());
            verify(stayPricingDecisionRepository, never()).saveAndFlush(any());
        }

        @ParameterizedTest
        @ValueSource(strings = {
                "previousNumberOfNights", "previousAgreedAmount",
                "numberOfNights", "retainedNightlyRate", "suggestedAmount"
        })
        void dateChangeValidatesEveryConfirmationField(String field) {
            LocalDateTime startAt = LocalDateTime.of(2027, 8, 1, 8, 0);
            Stay stay = Stay.builder().id(UUID.randomUUID())
                    .startAt(startAt).endAt(startAt.plusDays(2))
                    .retainedNightlyRate(new BigDecimal("17"))
                    .agreedAmount(new BigDecimal("34")).build();
            when(stayRepository.findById(stay.getId())).thenReturn(Optional.of(stay));
            when(currentUserAccountService.getCurrentUserAccount())
                    .thenReturn(user(UserRole.ADMIN));
            var preview = service.previewDateChangePricing(
                    stay.getId(), StayDatePricingPreviewRequestDTO.builder()
                            .startAt(startAt).endAt(startAt.plusDays(3)).build());
            var confirmation = preview.getConfirmation();
            switch (field) {
                case "previousNumberOfNights" -> confirmation.setPreviousNumberOfNights(1L);
                case "previousAgreedAmount" ->
                        confirmation.setPreviousAgreedAmount(new BigDecimal("35"));
                case "numberOfNights" -> confirmation.setNumberOfNights(4L);
                case "retainedNightlyRate" ->
                        confirmation.setRetainedNightlyRate(new BigDecimal("18"));
                case "suggestedAmount" ->
                        confirmation.setSuggestedAmount(new BigDecimal("52"));
                default -> throw new IllegalArgumentException(field);
            }
            StayUpdateDTO request = StayUpdateDTO.builder()
                    .startAt(startAt).endAt(startAt.plusDays(3))
                    .pricingDecision(PricingDecisionRequestDTO.builder()
                            .agreedAmount(new BigDecimal("51")).build())
                    .confirmation(confirmation).build();

            assertThrows(StalePricingConfirmationException.class,
                    () -> service.updateStay(stay.getId(), request));
            verify(stayRepository, never()).save(any());
            verify(stayPricingDecisionRepository, never()).saveAndFlush(any());
        }
    }

    @Nested
    class AgreedAmountCorrectionTests {

        @ParameterizedTest
        @ValueSource(strings = {
                "RESERVED",
                "CHECKED_IN",
                "CHECKED_OUT",
                "CANCELLED"
        })
        void adminCorrectsAgreementInEveryStayStatus(String status) {
            Stay stay = correctionStay(status, new BigDecimal("20"));
            UserAccount admin = user(UserRole.ADMIN);
            PricingDecisionRequestDTO request = correction(
                    new BigDecimal("25.0"),
                    "Administrative correction"
            );

            when(stayRepository.findById(stay.getId())).thenReturn(Optional.of(stay));
            when(currentUserAccountService.getCurrentUserAccount()).thenReturn(admin);
            when(stayRepository.save(stay)).thenReturn(stay);
            when(stayMapper.toResponseDTO(stay, false))
                    .thenReturn(StayResponseDTO.builder()
                            .stayId(stay.getId())
                            .agreedAmount(new BigDecimal("25"))
                            .build());

            StayResponseDTO response = service.correctAgreedAmount(
                    stay.getId(),
                    request
            );

            assertEquals(new BigDecimal("25"), response.getAgreedAmount());
            assertEquals(new BigDecimal("25"), stay.getAgreedAmount());
            verify(stayRepository).findByIdForUpdate(stay.getId());
            verify(stayAgreedAmountCorrectionRepository).saveAndFlush(
                    correctionCaptor.capture()
            );
            StayAgreedAmountCorrection event = correctionCaptor.getValue();
            assertEquals(stay.getId(), event.getStayId());
            assertEquals(new BigDecimal("20"), event.getPreviousAgreedAmount());
            assertEquals(new BigDecimal("25"), event.getNewAgreedAmount());
            assertSame(admin, event.getDecidedBy());
            assertEquals(
                    Instant.parse("2026-07-28T12:00:00Z"),
                    event.getDecidedAt()
            );
            assertEquals("Administrative correction", event.getReason());
        }

        @Test
        void adminInitializesLegacyNullAgreementWithExactAuditSnapshot() {
            Stay stay = correctionStay("CHECKED_OUT", null);
            UserAccount admin = user(UserRole.ADMIN);
            PricingDecisionRequestDTO request = correction(
                    new BigDecimal("1000000000000000000"),
                    "Recorded inherited client agreement"
            );

            when(stayRepository.findById(stay.getId())).thenReturn(Optional.of(stay));
            when(currentUserAccountService.getCurrentUserAccount()).thenReturn(admin);
            when(stayRepository.save(stay)).thenReturn(stay);
            when(stayMapper.toResponseDTO(stay, false)).thenReturn(new StayResponseDTO());

            service.correctAgreedAmount(stay.getId(), request);

            verify(stayAgreedAmountCorrectionRepository).saveAndFlush(
                    correctionCaptor.capture()
            );
            assertNull(correctionCaptor.getValue().getPreviousAgreedAmount());
            assertEquals(
                    new BigDecimal("1000000000000000000"),
                    correctionCaptor.getValue().getNewAgreedAmount()
            );
            assertEquals(
                    "Recorded inherited client agreement",
                    correctionCaptor.getValue().getReason()
            );
        }

        @Test
        void staffIsDeniedAfterLockedReloadBeforeCorrectionValidation() {
            Stay stay = correctionStay("RESERVED", new BigDecimal("20"));
            PricingDecisionRequestDTO invalidRequest = correction(
                    new BigDecimal("-1"),
                    null
            );

            when(stayRepository.findById(stay.getId())).thenReturn(Optional.of(stay));
            when(currentUserAccountService.getCurrentUserAccount())
                    .thenReturn(user(UserRole.STAFF));

            assertThrows(
                    ForbiddenException.class,
                    () -> service.correctAgreedAmount(stay.getId(), invalidRequest)
            );

            InOrder ordering = inOrder(
                    stayRepository,
                    currentUserAccountService,
                    stayPricingAuthorizationPolicy
            );
            ordering.verify(stayRepository).findByIdForUpdate(stay.getId());
            ordering.verify(currentUserAccountService).getCurrentUserAccount();
            ordering.verify(stayPricingAuthorizationPolicy)
                    .authorizeAgreedAmountCorrection(any(UserAccount.class));
            verify(stayRepository, never()).save(any(Stay.class));
            verify(stayAgreedAmountCorrectionRepository, never())
                    .saveAndFlush(any(StayAgreedAmountCorrection.class));
        }

        @ParameterizedTest
        @ValueSource(strings = {
                "-1",
                "1.5",
                "10000000000000000000",
                "1e2147483647"
        })
        void correctionRejectsUnsupportedAmounts(String value) {
            Stay stay = correctionStay("RESERVED", new BigDecimal("20"));
            when(stayRepository.findById(stay.getId())).thenReturn(Optional.of(stay));
            when(currentUserAccountService.getCurrentUserAccount())
                    .thenReturn(user(UserRole.ADMIN));

            assertThrows(
                    BadRequestException.class,
                    () -> service.correctAgreedAmount(
                            stay.getId(),
                            correction(new BigDecimal(value), "Reason")
                    )
            );

            verify(stayRepository, never()).save(any(Stay.class));
            verify(stayAgreedAmountCorrectionRepository, never())
                    .saveAndFlush(any(StayAgreedAmountCorrection.class));
        }

        @Test
        void realCorrectionRequiresNonBlankReason() {
            Stay stay = correctionStay("RESERVED", new BigDecimal("20"));
            when(stayRepository.findById(stay.getId())).thenReturn(Optional.of(stay));
            when(currentUserAccountService.getCurrentUserAccount())
                    .thenReturn(user(UserRole.ADMIN));

            assertThrows(
                    BadRequestException.class,
                    () -> service.correctAgreedAmount(
                            stay.getId(),
                            correction(new BigDecimal("25"), "   ")
                    )
            );

            assertEquals(new BigDecimal("20"), stay.getAgreedAmount());
            verify(stayRepository, never()).save(any(Stay.class));
            verify(stayAgreedAmountCorrectionRepository, never())
                    .saveAndFlush(any(StayAgreedAmountCorrection.class));
        }

        @Test
        void numericallyEqualCorrectionIsAuthorizedZeroWriteNoOp() {
            Stay stay = correctionStay("CANCELLED", new BigDecimal("20"));
            LocalDateTime originalStart = stay.getStartAt();
            LocalDateTime originalEnd = stay.getEndAt();
            LocalDateTime originalCancellation = stay.getCancelledAt();
            BigDecimal retainedRate = stay.getRetainedNightlyRate();
            UserAccount admin = user(UserRole.ADMIN);
            when(stayRepository.findById(stay.getId())).thenReturn(Optional.of(stay));
            when(currentUserAccountService.getCurrentUserAccount()).thenReturn(admin);
            when(stayMapper.toResponseDTO(stay, false)).thenReturn(new StayResponseDTO());

            service.correctAgreedAmount(
                    stay.getId(),
                    correction(new BigDecimal("20.0"), null)
            );

            verify(stayPricingAuthorizationPolicy)
                    .authorizeAgreedAmountCorrection(admin);
            verify(stayRepository, never()).save(any(Stay.class));
            verify(stayAgreedAmountCorrectionRepository, never())
                    .saveAndFlush(any(StayAgreedAmountCorrection.class));
            assertEquals(new BigDecimal("20"), stay.getAgreedAmount());
            assertEquals(retainedRate, stay.getRetainedNightlyRate());
            assertEquals(originalStart, stay.getStartAt());
            assertEquals(originalEnd, stay.getEndAt());
            assertEquals(originalCancellation, stay.getCancelledAt());
        }

        private Stay correctionStay(String status, BigDecimal agreedAmount) {
            LocalDateTime now = LocalDateTime.now();
            LocalDateTime startAt = switch (status) {
                case "RESERVED" -> now.plusDays(2);
                case "CHECKED_IN" -> now.minusDays(1);
                case "CHECKED_OUT", "CANCELLED" -> now.minusDays(3);
                default -> throw new IllegalArgumentException(status);
            };
            LocalDateTime endAt = switch (status) {
                case "RESERVED" -> now.plusDays(4);
                case "CHECKED_IN" -> now.plusDays(1);
                case "CHECKED_OUT", "CANCELLED" -> now.minusDays(1);
                default -> throw new IllegalArgumentException(status);
            };

            return Stay.builder()
                    .id(UUID.randomUUID())
                    .startAt(startAt)
                    .endAt(endAt)
                    .cancelledAt("CANCELLED".equals(status) ? now.minusHours(1) : null)
                    .retainedNightlyRate(new BigDecimal("10"))
                    .agreedAmount(agreedAmount)
                    .build();
        }

        private PricingDecisionRequestDTO correction(
                BigDecimal agreedAmount,
                String reason) {
            return PricingDecisionRequestDTO.builder()
                    .agreedAmount(agreedAmount)
                    .reason(reason)
                    .build();
        }
    }

    @Nested
    class StayPaymentTests {

        @Test
        void registersExactPaymentAndReturnsPartialEconomics() {
            Stay stay = paymentStay(new BigDecimal("100"), false);
            UserAccount admin = user(UserRole.ADMIN);
            List<StayPayment> storedPayments = new ArrayList<>();
            StayResponseDTO response = new StayResponseDTO();

            when(stayRepository.findById(stay.getId())).thenReturn(Optional.of(stay));
            when(currentUserAccountService.getCurrentUserAccount()).thenReturn(admin);
            when(stayPaymentRepository.sumActiveAmountByStayId(stay.getId()))
                    .thenAnswer(invocation -> storedPayments.stream()
                            .filter(payment -> !payment.isAnnulled())
                            .map(StayPayment::getAmount)
                            .reduce(BigDecimal.ZERO, BigDecimal::add));
            when(stayPaymentRepository.saveAndFlush(any(StayPayment.class)))
                    .thenAnswer(invocation -> {
                        StayPayment payment = invocation.getArgument(0);
                        storedPayments.add(payment);
                        return payment;
                    });
            when(stayPaymentRepository
                    .findAllByStay_IdOrderByCreatedAtAscIdAsc(stay.getId()))
                    .thenAnswer(invocation -> List.copyOf(storedPayments));
            when(stayMapper.toResponseDTO(stay, false)).thenReturn(response);

            StayResponseDTO actual = service.registerPayment(
                    stay.getId(),
                    PaymentRegistrationRequestDTO.builder()
                            .amount(new BigDecimal("70.0"))
                            .paymentDate(LocalDate.of(2026, 7, 30))
                            .note("Card")
                            .build()
            );

            ArgumentCaptor<StayPayment> paymentCaptor =
                    ArgumentCaptor.forClass(StayPayment.class);
            verify(stayPaymentRepository).saveAndFlush(paymentCaptor.capture());
            assertEquals(new BigDecimal("70"), paymentCaptor.getValue().getAmount());
            assertEquals(admin, paymentCaptor.getValue().getRegisteredBy());
            assertSame(response, actual);
            assertEquals(new BigDecimal("70"), actual.getTotalPaid());
            assertEquals(new BigDecimal("30"), actual.getRemainingAmount());
            assertEquals(PaymentCondition.PARTIAL_PAYMENT, actual.getPaymentCondition());
            assertTrue(actual.isOutstandingCollectionEligible());
        }

        @Test
        void rejectsUnsupportedPaymentAmountsWithoutWrites() {
            Stay stay = paymentStay(new BigDecimal("100"), false);
            when(stayRepository.findById(stay.getId())).thenReturn(Optional.of(stay));
            when(currentUserAccountService.getCurrentUserAccount())
                    .thenReturn(user(UserRole.ADMIN));

            for (BigDecimal amount : Arrays.asList(
                    null,
                    BigDecimal.ZERO,
                    new BigDecimal("-1"),
                    new BigDecimal("1.5"),
                    new BigDecimal("10000000000000000000"))) {
                PaymentRegistrationRequestDTO request =
                        PaymentRegistrationRequestDTO.builder()
                                .amount(amount)
                                .paymentDate(LocalDate.of(2026, 7, 30))
                                .build();
                assertThrows(
                        BadRequestException.class,
                        () -> service.registerPayment(stay.getId(), request)
                );
            }

            verify(stayPaymentRepository, never())
                    .saveAndFlush(any(StayPayment.class));
        }

        @Test
        void rejectsRegistrationAboveRemainingAmount() {
            Stay stay = paymentStay(new BigDecimal("100"), false);
            when(stayRepository.findById(stay.getId())).thenReturn(Optional.of(stay));
            when(currentUserAccountService.getCurrentUserAccount())
                    .thenReturn(user(UserRole.ADMIN));
            when(stayPaymentRepository.sumActiveAmountByStayId(stay.getId()))
                    .thenReturn(new BigDecimal("80"));

            assertThrows(
                    ConflictException.class,
                    () -> service.registerPayment(
                            stay.getId(),
                            PaymentRegistrationRequestDTO.builder()
                                    .amount(new BigDecimal("21"))
                                    .paymentDate(LocalDate.of(2026, 7, 30))
                                    .build()
                    )
            );

            verify(stayPaymentRepository, never())
                    .saveAndFlush(any(StayPayment.class));
        }

        @Test
        void inheritedNullAgreementIsReadableButRejectsPaymentMutation() {
            Stay stay = paymentStay(null, false);
            StayResponseDTO response = new StayResponseDTO();
            when(stayRepository.findById(stay.getId())).thenReturn(Optional.of(stay));
            when(stayMapper.toResponseDTO(stay, false)).thenReturn(response);

            StayResponseDTO actual = service.getStay(stay.getId());

            assertEquals(BigDecimal.ZERO, actual.getTotalPaid());
            assertNull(actual.getRemainingAmount());
            assertEquals(PaymentCondition.NO_PAYMENT, actual.getPaymentCondition());
            assertFalse(actual.isOutstandingCollectionEligible());
            assertTrue(actual.getPayments().isEmpty());

            when(currentUserAccountService.getCurrentUserAccount())
                    .thenReturn(user(UserRole.ADMIN));
            assertThrows(
                    ConflictException.class,
                    () -> service.registerPayment(
                            stay.getId(),
                            PaymentRegistrationRequestDTO.builder()
                                    .amount(BigDecimal.ONE)
                                    .paymentDate(LocalDate.of(2026, 7, 30))
                                    .build()
                    )
            );
        }

        @Test
        void derivesAggregateConditionAndOutstandingFromActivePayments() {
            Stay stay = paymentStay(new BigDecimal("100"), false);
            StayPayment first = payment(stay, "30", false);
            StayPayment second = payment(stay, "70", false);

            StayPaymentEconomics full = StayPaymentEconomics.calculate(
                    stay.getAgreedAmount(),
                    List.of(first, second),
                    false
            );
            assertEquals(new BigDecimal("100"), full.totalPaid());
            assertEquals(BigDecimal.ZERO, full.remainingAmount());
            assertEquals(PaymentCondition.FULL_PAYMENT, full.paymentCondition());
            assertFalse(full.outstandingCollectionEligible());

            second.annul();
            StayPaymentEconomics partial = StayPaymentEconomics.calculate(
                    stay.getAgreedAmount(),
                    List.of(first, second),
                    false
            );
            assertEquals(new BigDecimal("30"), partial.totalPaid());
            assertEquals(new BigDecimal("70"), partial.remainingAmount());
            assertEquals(PaymentCondition.PARTIAL_PAYMENT, partial.paymentCondition());
            assertTrue(partial.outstandingCollectionEligible());

            StayPaymentEconomics cancelled = StayPaymentEconomics.calculate(
                    stay.getAgreedAmount(),
                    List.of(first, second),
                    true
            );
            assertFalse(cancelled.outstandingCollectionEligible());

            StayPaymentEconomics zeroAgreement = StayPaymentEconomics.calculate(
                    BigDecimal.ZERO,
                    List.of(),
                    false
            );
            assertEquals(PaymentCondition.NO_PAYMENT, zeroAgreement.paymentCondition());
            assertEquals(BigDecimal.ZERO, zeroAgreement.remainingAmount());
            assertFalse(zeroAgreement.outstandingCollectionEligible());
        }

        @Test
        void staffCannotMutateCheckedOutStay() {
            Stay stay = paymentStay(new BigDecimal("100"), false);
            stay.setStartAt(LocalDateTime.now().minusDays(3));
            stay.setEndAt(LocalDateTime.now().minusDays(1));
            when(stayRepository.findById(stay.getId())).thenReturn(Optional.of(stay));
            when(currentUserAccountService.getCurrentUserAccount())
                    .thenReturn(user(UserRole.STAFF));

            assertThrows(
                    ForbiddenException.class,
                    () -> service.registerPayment(
                            stay.getId(),
                            PaymentRegistrationRequestDTO.builder()
                                    .amount(BigDecimal.ONE)
                                    .paymentDate(LocalDate.of(2026, 7, 30))
                                    .build()
                    )
            );
            verify(stayPaymentRepository, never())
                    .sumActiveAmountByStayId(any());
        }

        @Test
        void editsActivePaymentAndAppendsExactEvidence() {
            Stay stay = paymentStay(new BigDecimal("100"), false);
            StayPayment payment = payment(stay, "30", false);
            UserAccount admin = user(UserRole.ADMIN);
            StayResponseDTO response = new StayResponseDTO();
            when(stayRepository.findById(stay.getId())).thenReturn(Optional.of(stay));
            when(currentUserAccountService.getCurrentUserAccount()).thenReturn(admin);
            when(stayPaymentRepository.findByIdAndStay_Id(
                    payment.getId(),
                    stay.getId())).thenReturn(Optional.of(payment));
            when(stayPaymentRepository.sumActiveAmountByStayId(stay.getId()))
                    .thenReturn(new BigDecimal("30"));
            when(stayPaymentRepository.saveAndFlush(payment)).thenReturn(payment);
            when(stayPaymentRepository
                    .findAllByStay_IdOrderByCreatedAtAscIdAsc(stay.getId()))
                    .thenReturn(List.of(payment));
            when(stayMapper.toResponseDTO(stay, false)).thenReturn(response);

            service.editPayment(
                    stay.getId(),
                    payment.getId(),
                    PaymentEditRequestDTO.builder()
                            .amount(new BigDecimal("40.0"))
                            .reason("Correct entry")
                            .build()
            );

            ArgumentCaptor<StayPaymentEdit> editCaptor =
                    ArgumentCaptor.forClass(StayPaymentEdit.class);
            verify(stayPaymentEditRepository).saveAndFlush(editCaptor.capture());
            assertEquals(new BigDecimal("30"), editCaptor.getValue().getPreviousAmount());
            assertEquals(new BigDecimal("40"), editCaptor.getValue().getNewAmount());
            assertEquals(admin, editCaptor.getValue().getEditedBy());
            assertEquals("Correct entry", editCaptor.getValue().getReason());
            assertEquals(new BigDecimal("40"), payment.getAmount());
            assertEquals(new BigDecimal("40"), response.getTotalPaid());
        }

        @Test
        void editValidatesResultingAggregateAndRequiresRealReasonedChange() {
            Stay stay = paymentStay(new BigDecimal("100"), false);
            StayPayment payment = payment(stay, "30", false);
            when(stayRepository.findById(stay.getId())).thenReturn(Optional.of(stay));
            when(currentUserAccountService.getCurrentUserAccount())
                    .thenReturn(user(UserRole.ADMIN));
            when(stayPaymentRepository.findByIdAndStay_Id(
                    payment.getId(),
                    stay.getId())).thenReturn(Optional.of(payment));
            when(stayPaymentRepository.sumActiveAmountByStayId(stay.getId()))
                    .thenReturn(new BigDecimal("90"));

            assertThrows(
                    ConflictException.class,
                    () -> service.editPayment(
                            stay.getId(),
                            payment.getId(),
                            PaymentEditRequestDTO.builder()
                                    .amount(new BigDecimal("50"))
                                    .reason("Too high")
                                    .build()
                    )
            );
            assertThrows(
                    BadRequestException.class,
                    () -> service.editPayment(
                            stay.getId(),
                            payment.getId(),
                            PaymentEditRequestDTO.builder()
                                    .amount(new BigDecimal("30.0"))
                                    .reason("No change")
                                    .build()
                    )
            );
            assertThrows(
                    BadRequestException.class,
                    () -> service.editPayment(
                            stay.getId(),
                            payment.getId(),
                            PaymentEditRequestDTO.builder()
                                    .amount(new BigDecimal("20"))
                                    .reason("   ")
                                    .build()
                    )
            );
            verify(stayPaymentEditRepository, never())
                    .saveAndFlush(any(StayPaymentEdit.class));
        }

        @Test
        void annulsActivePaymentAndExcludesItFromEconomics() {
            Stay stay = paymentStay(new BigDecimal("100"), false);
            StayPayment payment = payment(stay, "100", false);
            UserAccount admin = user(UserRole.ADMIN);
            StayResponseDTO response = new StayResponseDTO();
            when(stayRepository.findById(stay.getId())).thenReturn(Optional.of(stay));
            when(currentUserAccountService.getCurrentUserAccount()).thenReturn(admin);
            when(stayPaymentRepository.findByIdAndStay_Id(
                    payment.getId(),
                    stay.getId())).thenReturn(Optional.of(payment));
            when(stayPaymentRepository.saveAndFlush(payment)).thenReturn(payment);
            when(stayPaymentRepository
                    .findAllByStay_IdOrderByCreatedAtAscIdAsc(stay.getId()))
                    .thenReturn(List.of(payment));
            when(stayMapper.toResponseDTO(stay, false)).thenReturn(response);

            service.annulPayment(
                    stay.getId(),
                    payment.getId(),
                    PaymentAnnulmentRequestDTO.builder()
                            .reason("Payment entered twice")
                            .build()
            );

            ArgumentCaptor<StayPaymentAnnulment> annulmentCaptor =
                    ArgumentCaptor.forClass(StayPaymentAnnulment.class);
            verify(stayPaymentAnnulmentRepository)
                    .saveAndFlush(annulmentCaptor.capture());
            assertTrue(payment.isAnnulled());
            assertEquals(admin, annulmentCaptor.getValue().getAnnulledBy());
            assertEquals("Payment entered twice", annulmentCaptor.getValue().getReason());
            assertEquals(BigDecimal.ZERO, response.getTotalPaid());
            assertEquals(PaymentCondition.NO_PAYMENT, response.getPaymentCondition());
            assertEquals(new BigDecimal("100"), response.getRemainingAmount());
        }

        @Test
        void blankAnnulmentReasonLeavesOperationalAndAuditStateUntouched() {
            Stay stay = paymentStay(new BigDecimal("100"), false);
            StayPayment payment = payment(stay, "40", false);
            when(stayRepository.findById(stay.getId())).thenReturn(Optional.of(stay));
            when(currentUserAccountService.getCurrentUserAccount())
                    .thenReturn(user(UserRole.ADMIN));
            when(stayPaymentRepository.findByIdAndStay_Id(
                    payment.getId(),
                    stay.getId())).thenReturn(Optional.of(payment));

            assertThrows(
                    BadRequestException.class,
                    () -> service.annulPayment(
                            stay.getId(),
                            payment.getId(),
                            PaymentAnnulmentRequestDTO.builder()
                                    .reason("   ")
                                    .build()
                    )
            );

            assertFalse(payment.isAnnulled());
            verify(stayPaymentRepository, never())
                    .saveAndFlush(any(StayPayment.class));
            verify(stayPaymentAnnulmentRepository, never())
                    .saveAndFlush(any(StayPaymentAnnulment.class));
        }

        @Test
        void rejectsAnnulledPaymentAndWrongStayIdentity() {
            Stay stay = paymentStay(new BigDecimal("100"), false);
            StayPayment annulled = payment(stay, "25", true);
            when(stayRepository.findById(stay.getId())).thenReturn(Optional.of(stay));
            when(currentUserAccountService.getCurrentUserAccount())
                    .thenReturn(user(UserRole.ADMIN));
            when(stayPaymentRepository.findByIdAndStay_Id(
                    annulled.getId(),
                    stay.getId())).thenReturn(Optional.of(annulled));

            assertThrows(
                    ConflictException.class,
                    () -> service.annulPayment(
                            stay.getId(),
                            annulled.getId(),
                            PaymentAnnulmentRequestDTO.builder()
                                    .reason("Again")
                                    .build()
                    )
            );

            UUID wrongPaymentId = UUID.randomUUID();
            when(stayPaymentRepository.findByIdAndStay_Id(
                    wrongPaymentId,
                    stay.getId())).thenReturn(Optional.empty());
            assertThrows(
                    ResourceNotFoundException.class,
                    () -> service.editPayment(
                            stay.getId(),
                            wrongPaymentId,
                            PaymentEditRequestDTO.builder()
                                    .amount(new BigDecimal("20"))
                                    .reason("Wrong stay")
                                    .build()
                    )
            );
        }

        @Test
        void agreementFloorBlocksCorrectionButPreservesNumericNoOp() {
            Stay stay = paymentStay(new BigDecimal("100"), true);
            UserAccount admin = user(UserRole.ADMIN);
            when(stayRepository.findById(stay.getId())).thenReturn(Optional.of(stay));
            when(currentUserAccountService.getCurrentUserAccount()).thenReturn(admin);
            when(stayPaymentRepository.sumActiveAmountByStayId(stay.getId()))
                    .thenReturn(new BigDecimal("60"));
            when(stayMapper.toResponseDTO(stay, false))
                    .thenReturn(new StayResponseDTO());

            assertThrows(
                    ConflictException.class,
                    () -> service.correctAgreedAmount(
                            stay.getId(),
                            PricingDecisionRequestDTO.builder()
                                    .agreedAmount(new BigDecimal("50"))
                                    .reason("Too low")
                                    .build()
                    )
            );
            clearInvocations(stayPaymentRepository);

            service.correctAgreedAmount(
                    stay.getId(),
                    PricingDecisionRequestDTO.builder()
                            .agreedAmount(new BigDecimal("100.0"))
                            .build()
            );

            verify(stayPaymentRepository, never()).sumActiveAmountByStayId(any());
            verify(stayAgreedAmountCorrectionRepository, never())
                    .saveAndFlush(any(StayAgreedAmountCorrection.class));
        }

        @Test
        void agreementFloorAlsoBlocksNightCountReconfirmation() {
            Stay stay = paymentStay(new BigDecimal("100"), false);
            LocalDateTime startAt = LocalDateTime.now().plusDays(2);
            stay.setStartAt(startAt);
            stay.setEndAt(startAt.plusDays(2));
            StayUpdateDTO request = StayUpdateDTO.builder()
                    .startAt(startAt)
                    .endAt(startAt.plusDays(3))
                    .pricingDecision(PricingDecisionRequestDTO.builder()
                            .agreedAmount(new BigDecimal("50"))
                            .reason("Shorter agreement")
                            .build())
                    .build();
            when(stayRepository.findById(stay.getId())).thenReturn(Optional.of(stay));
            when(currentUserAccountService.getCurrentUserAccount())
                    .thenReturn(user(UserRole.ADMIN));
            when(stayPaymentRepository.sumActiveAmountByStayId(stay.getId()))
                    .thenReturn(new BigDecimal("60"));

            confirmDateChange(stay, request);
            assertThrows(
                    ConflictException.class,
                    () -> service.updateStay(stay.getId(), request)
            );
            verify(stayMapper, never()).updateEntity(any(), any());
        }

        @ParameterizedTest
        @ValueSource(booleans = {false, true})
        void adminRemovesActiveOrAnnulledPaymentWithExactEvidence(
                boolean annulled) {
            Stay stay = paymentStay(new BigDecimal("100"), false);
            StayPayment payment = payment(stay, "40", annulled);
            UserAccount admin = user(UserRole.ADMIN);
            SensitiveStayContext context = SensitiveStayContext.builder()
                    .id(UUID.randomUUID())
                    .build();
            StayResponseDTO response = new StayResponseDTO();
            when(stayRepository.findById(stay.getId())).thenReturn(Optional.of(stay));
            when(currentUserAccountService.getCurrentUserAccount()).thenReturn(admin);
            when(stayPaymentRepository.findByIdAndStay_Id(
                    payment.getId(), stay.getId())).thenReturn(Optional.of(payment));
            when(sensitiveStayContextFactory.create(stay)).thenReturn(context);
            when(stayPaymentRepository
                    .findAllByStay_IdOrderByCreatedAtAscIdAsc(stay.getId()))
                    .thenReturn(List.of());
            when(stayMapper.toResponseDTO(stay, false)).thenReturn(response);
            when(clock.instant()).thenReturn(Instant.parse("2026-08-02T08:00:00Z"));

            StayResponseDTO actual = service.removePayment(
                    stay.getId(),
                    payment.getId(),
                    PaymentRemovalRequestDTO.builder()
                            .reason("Duplicate payment")
                            .build()
            );

            ArgumentCaptor<StayPaymentRemoval> removalCaptor =
                    ArgumentCaptor.forClass(StayPaymentRemoval.class);
            verify(stayPaymentRemovalRepository)
                    .saveAndFlush(removalCaptor.capture());
            StayPaymentRemoval removal = removalCaptor.getValue();
            assertSame(context, removal.getSensitiveContext());
            assertEquals(stay.getId(), removal.getStayId());
            assertEquals(payment.getId(), removal.getPaymentId());
            assertEquals(new BigDecimal("40"), removal.getAmount());
            assertEquals(payment.getPaymentDate(), removal.getPaymentDate());
            assertEquals(payment.getRegisteredBy(), removal.getRegisteredBy());
            assertEquals(payment.getCreatedAt(), removal.getRegisteredAt());
            assertEquals(admin, removal.getRemovedBy());
            assertEquals(annulled, removal.isAnnulled());
            assertEquals("Duplicate payment", removal.getReason());
            verify(stayPaymentRepository).delete(payment);
            verify(stayPaymentRepository).flush();
            assertSame(response, actual);
            assertEquals(BigDecimal.ZERO, actual.getTotalPaid());
        }

        @Test
        void removalRejectsStaffBlankReasonAndWrongStayWithoutWrites() {
            Stay stay = paymentStay(new BigDecimal("100"), false);
            StayPayment payment = payment(stay, "40", false);
            when(stayRepository.findById(stay.getId())).thenReturn(Optional.of(stay));
            when(currentUserAccountService.getCurrentUserAccount())
                    .thenReturn(user(UserRole.STAFF));

            assertThrows(ForbiddenException.class, () -> service.removePayment(
                    stay.getId(), payment.getId(),
                    PaymentRemovalRequestDTO.builder().reason("Valid reason").build()
            ));

            when(currentUserAccountService.getCurrentUserAccount())
                    .thenReturn(user(UserRole.ADMIN));
            when(stayPaymentRepository.findByIdAndStay_Id(
                    payment.getId(), stay.getId())).thenReturn(Optional.of(payment));
            assertThrows(BadRequestException.class, () -> service.removePayment(
                    stay.getId(), payment.getId(),
                    PaymentRemovalRequestDTO.builder().reason("   ").build()
            ));

            UUID unknownPayment = UUID.randomUUID();
            when(stayPaymentRepository.findByIdAndStay_Id(
                    unknownPayment, stay.getId())).thenReturn(Optional.empty());
            assertThrows(ResourceNotFoundException.class, () -> service.removePayment(
                    stay.getId(), unknownPayment,
                    PaymentRemovalRequestDTO.builder().reason("Wrong stay").build()
            ));

            verify(stayPaymentRemovalRepository, never())
                    .saveAndFlush(any(StayPaymentRemoval.class));
            verify(stayPaymentRepository, never()).delete(any());
            verify(stayPaymentRepository, never()).flush();
        }

        @Test
        void removalTranslatesPersistenceConflictWithoutDeletingPayment() {
            Stay stay = paymentStay(new BigDecimal("100"), false);
            StayPayment payment = payment(stay, "40", false);
            when(stayRepository.findById(stay.getId())).thenReturn(Optional.of(stay));
            when(currentUserAccountService.getCurrentUserAccount())
                    .thenReturn(user(UserRole.ADMIN));
            when(stayPaymentRepository.findByIdAndStay_Id(
                    payment.getId(), stay.getId())).thenReturn(Optional.of(payment));
            when(stayPaymentRemovalRepository.saveAndFlush(any()))
                    .thenThrow(new DataIntegrityViolationException("actor conflict"));

            ConflictException conflict = assertThrows(
                    ConflictException.class,
                    () -> service.removePayment(
                            stay.getId(),
                            payment.getId(),
                            PaymentRemovalRequestDTO.builder()
                                    .reason("Conflicting removal")
                                    .build()
                    )
            );

            assertEquals(
                    "Payment cannot be removed because of a data conflict",
                    conflict.getMessage()
            );
            verify(stayPaymentRepository, never()).delete(any());
            verify(stayPaymentRepository, never()).flush();
        }

        private Stay paymentStay(BigDecimal agreedAmount, boolean cancelled) {
            LocalDateTime now = LocalDateTime.now();
            Stay stay = Stay.builder()
                    .id(UUID.randomUUID())
                    .startAt(now.plusDays(2))
                    .endAt(now.plusDays(4))
                    .cancelledAt(cancelled ? now.minusHours(1) : null)
                    .retainedNightlyRate(new BigDecimal("50"))
                    .agreedAmount(agreedAmount)
                    .createdBy(user(UserRole.ADMIN))
                    .build();
            stay.setCreatedAt(Instant.parse("2026-07-28T12:00:00Z"));
            return stay;
        }

        private StayPayment payment(
                Stay stay,
                String amount,
                boolean annulled) {
            StayPayment payment = StayPayment.builder()
                    .id(UUID.randomUUID())
                    .stay(stay)
                    .amount(new BigDecimal(amount))
                    .paymentDate(LocalDate.of(2026, 7, 30))
                    .annulled(annulled)
                    .registeredBy(user(UserRole.ADMIN))
                    .build();
            payment.setCreatedAt(Instant.parse("2026-07-30T12:00:00Z"));
            payment.setUpdatedAt(Instant.parse("2026-07-30T12:00:00Z"));
            return payment;
        }
    }

    @Nested
    class CancelStayTests {

        @Test
        public void shouldCancelStaySuccessfully() {

            LocalDateTime startAt = LocalDateTime.now().plusDays(1);
            LocalDateTime endAt = startAt.plusDays(11);

            Stay stay = Stay.builder()
                    .id(UUID.randomUUID())
                    .startAt(startAt)
                    .endAt(endAt)
                    .retainedNightlyRate(new BigDecimal("10"))
                    .agreedAmount(new BigDecimal("110"))
                    .build();

            when(stayRepository.findById(stay.getId())).thenReturn(Optional.of(stay));

            service.cancelStay(stay.getId());

            assertNotNull(stay.getCancelledAt());
            assertEquals(new BigDecimal("10"), stay.getRetainedNightlyRate());
            assertEquals(new BigDecimal("110"), stay.getAgreedAmount());
            verify(stayRepository).findByIdForUpdate(stay.getId());

        }

        @Test
        public void shouldThrowConflict_whenStayIsAlreadyCancelled() {

            LocalDateTime startAt = LocalDateTime.now().plusDays(1);
            LocalDateTime endAt = startAt.plusDays(11);

            Stay stay = Stay.builder()
                    .id(UUID.randomUUID())
                    .startAt(startAt)
                    .endAt(endAt)
                    .cancelledAt(LocalDateTime.now().minusDays(1))
                    .build();

            when(stayRepository.findById(stay.getId())).thenReturn(Optional.of(stay));

            assertThrows(ConflictException.class, () -> service.cancelStay(stay.getId()));

        }

        @Test
        public void shouldThrowConflict_whenStayIsCheckedOut() {

            LocalDateTime startAt = LocalDateTime.now().minusDays(11);
            LocalDateTime endAt = startAt.plusDays(10);

            Stay stay = Stay.builder()
                    .id(UUID.randomUUID())
                    .startAt(startAt)
                    .endAt(endAt)
                    .build();

            when(stayRepository.findById(stay.getId())).thenReturn(Optional.of(stay));

            assertThrows(ConflictException.class, () -> service.cancelStay(stay.getId()));

        }

    }

    @Nested
    class DeleteStayTests {

        @Test
        void deleteStayAuthorizesBeforeDeletingStay() {

            Stay stay = stayWithCreator(
                    LocalDateTime.now().plusDays(1),
                    LocalDateTime.now().plusDays(5),
                    null);

            when(stayRepository.findById(stay.getId())).thenReturn(Optional.of(stay));
            UserAccount actor = user(UserRole.ADMIN);
            when(currentUserAccountService.getCurrentUserAccount()).thenReturn(actor);

            service.deleteStay(stay.getId());

            InOrder inOrder = inOrder(deletionAuthorizationPolicy, stayRepository);
            inOrder.verify(deletionAuthorizationPolicy)
                    .authorize(actor, stay.getCreatedBy(), stay.getCreatedAt());
            inOrder.verify(stayRepository).delete(stay);
            inOrder.verify(stayRepository).flush();

        }

        @Test
        void deleteStayDoesNotDeleteWhenAuthorizationFails() {

            Stay stay = stayWithCreator(
                    LocalDateTime.now().plusDays(1),
                    LocalDateTime.now().plusDays(5),
                    null);

            when(stayRepository.findById(stay.getId())).thenReturn(Optional.of(stay));
            UserAccount actor = user(UserRole.ADMIN);
            when(currentUserAccountService.getCurrentUserAccount()).thenReturn(actor);
            doThrow(new ForbiddenException("Forbidden"))
                    .when(deletionAuthorizationPolicy)
                    .authorize(actor, stay.getCreatedBy(), stay.getCreatedAt());

            assertThrows(ForbiddenException.class, () -> service.deleteStay(stay.getId()));

            verify(stayRepository, never()).delete(any(Stay.class));
            verify(stayRepository, never()).flush();

        }

        @Test
        void deleteStayTranslatesIntegrityConflict() {

            Stay stay = stayWithCreator(
                    LocalDateTime.now().plusDays(1),
                    LocalDateTime.now().plusDays(5),
                    null);

            when(stayRepository.findById(stay.getId())).thenReturn(Optional.of(stay));
            when(currentUserAccountService.getCurrentUserAccount())
                    .thenReturn(user(UserRole.ADMIN));
            doThrow(new DataIntegrityViolationException("constraint conflict")).when(stayRepository).flush();

            assertThrows(ConflictException.class, () -> service.deleteStay(stay.getId()));

            verify(stayRepository).delete(stay);
            verify(stayRepository).flush();

        }

        @Test
        void deleteStayAllowsAnyDynamicStatusWhenAuthorizationPasses() {

            LocalDateTime now = LocalDateTime.now();
            List<Stay> stays = List.of(
                    stayWithCreator(now.plusDays(1), now.plusDays(5), now.minusHours(1)),
                    stayWithCreator(now.plusDays(1), now.plusDays(5), null),
                    stayWithCreator(now.minusDays(1), now.plusDays(1), null),
                    stayWithCreator(now.minusDays(5), now.minusDays(1), null));

            for (Stay stay : stays) {
                when(stayRepository.findById(stay.getId())).thenReturn(Optional.of(stay));
            }
            UserAccount actor = user(UserRole.ADMIN);
            when(currentUserAccountService.getCurrentUserAccount()).thenReturn(actor);

            for (Stay stay : stays) {
                assertDoesNotThrow(() -> service.deleteStay(stay.getId()));
            }

            for (Stay stay : stays) {
                verify(stayRepository).delete(stay);
                verify(deletionAuthorizationPolicy)
                        .authorize(actor, stay.getCreatedBy(), stay.getCreatedAt());
            }
            verify(stayRepository, times(stays.size())).flush();

        }

        @Test
        void operationalPaymentBlocksDeletionAfterAuthorization() {
            Stay stay = stayWithCreator(
                    LocalDateTime.now().plusDays(1),
                    LocalDateTime.now().plusDays(5), null);
            UserAccount actor = user(UserRole.ADMIN);
            when(stayRepository.findById(stay.getId())).thenReturn(Optional.of(stay));
            when(currentUserAccountService.getCurrentUserAccount()).thenReturn(actor);
            when(stayPaymentRepository.existsByStay_Id(stay.getId()))
                    .thenReturn(true);

            assertThrows(ConflictException.class, () -> service.deleteStay(stay.getId()));

            InOrder order = inOrder(deletionAuthorizationPolicy, stayPaymentRepository);
            order.verify(deletionAuthorizationPolicy)
                    .authorize(actor, stay.getCreatedBy(), stay.getCreatedAt());
            order.verify(stayPaymentRepository).existsByStay_Id(stay.getId());
            verify(stayRepository, never()).delete(any());
        }

        @Test
        void historicalPaymentBlocksStaffButNotAdminAfterSafeRemoval() {
            Stay stay = stayWithCreator(
                    LocalDateTime.now().plusDays(1),
                    LocalDateTime.now().plusDays(5), null);
            when(stayRepository.findById(stay.getId())).thenReturn(Optional.of(stay));
            when(stayPaymentRemovalRepository.existsByStayId(stay.getId()))
                    .thenReturn(true);

            when(currentUserAccountService.getCurrentUserAccount())
                    .thenReturn(user(UserRole.STAFF));
            assertThrows(ForbiddenException.class, () -> service.deleteStay(stay.getId()));
            verify(stayRepository, never()).delete(any());

            clearInvocations(stayRepository, stayPaymentRepository,
                    stayPaymentRemovalRepository, deletionAuthorizationPolicy);
            UserAccount admin = user(UserRole.ADMIN);
            when(currentUserAccountService.getCurrentUserAccount()).thenReturn(admin);
            service.deleteStay(stay.getId());

            verify(stayRepository).findByIdForUpdate(stay.getId());
            verify(stayRepository).delete(stay);
            verify(stayRepository).flush();
        }

    }

    @Nested
    class ResponseCanDeleteTests {

        @Test
        void getStayPassesAllowedCanDeleteToMapper() {

            Stay stay = stayWithCreator(
                    LocalDateTime.now().plusDays(1),
                    LocalDateTime.now().plusDays(5),
                    null);
            StayResponseDTO expectedResponseDTO = new StayResponseDTO();

            when(stayRepository.findById(stay.getId())).thenReturn(Optional.of(stay));
            when(deletionAuthorizationPolicy.canDelete(stay.getCreatedBy(), stay.getCreatedAt())).thenReturn(true);
            when(stayMapper.toResponseDTO(stay, true)).thenReturn(expectedResponseDTO);

            StayResponseDTO result = service.getStay(stay.getId());

            assertSame(expectedResponseDTO, result);
            verify(stayMapper).toResponseDTO(stay, true);

        }

        @Test
        void getStayPassesDeniedCanDeleteToMapper() {

            Stay stay = stayWithCreator(
                    LocalDateTime.now().plusDays(1),
                    LocalDateTime.now().plusDays(5),
                    null);
            StayResponseDTO expectedResponseDTO = new StayResponseDTO();

            when(stayRepository.findById(stay.getId())).thenReturn(Optional.of(stay));
            when(deletionAuthorizationPolicy.canDelete(stay.getCreatedBy(), stay.getCreatedAt())).thenReturn(false);
            when(stayMapper.toResponseDTO(stay, false)).thenReturn(expectedResponseDTO);

            StayResponseDTO result = service.getStay(stay.getId());

            assertSame(expectedResponseDTO, result);
            verify(stayMapper).toResponseDTO(stay, false);
            verify(stayPaymentRemovalRepository, never()).existsByStayId(any());

        }

        @Test
        void getStayUsesLoadedPaymentsForDeletionHint() {
            Stay stay = stayWithCreator(
                    LocalDateTime.now().plusDays(1),
                    LocalDateTime.now().plusDays(5),
                    null);
            StayPayment payment = StayPayment.builder()
                    .id(UUID.randomUUID())
                    .stay(stay)
                    .amount(new BigDecimal("25"))
                    .paymentDate(LocalDate.of(2026, 8, 1))
                    .registeredBy(user(UserRole.ADMIN))
                    .build();
            stay.setAgreedAmount(new BigDecimal("100"));
            StayResponseDTO expectedResponseDTO = new StayResponseDTO();

            when(stayRepository.findById(stay.getId())).thenReturn(Optional.of(stay));
            when(stayPaymentRepository
                    .findAllByStay_IdOrderByCreatedAtAscIdAsc(stay.getId()))
                    .thenReturn(List.of(payment));
            when(deletionAuthorizationPolicy.canDelete(
                    stay.getCreatedBy(), stay.getCreatedAt())).thenReturn(true);
            when(stayMapper.toResponseDTO(stay, false))
                    .thenReturn(expectedResponseDTO);

            StayResponseDTO result = service.getStay(stay.getId());

            assertSame(expectedResponseDTO, result);
            verify(stayMapper).toResponseDTO(stay, false);
            verify(stayPaymentRepository, never()).existsByStay_Id(any());
        }

        @Test
        void getAllStaysCalculatesCanDeleteForEachStay() {

            Stay allowedStay = stayWithCreator(
                    LocalDateTime.now().plusDays(1),
                    LocalDateTime.now().plusDays(5),
                    null);
            Stay deniedStay = stayWithCreator(
                    LocalDateTime.now().plusDays(6),
                    LocalDateTime.now().plusDays(10),
                    null);
            StayResponseDTO allowedResponse = new StayResponseDTO();
            StayResponseDTO deniedResponse = new StayResponseDTO();

            when(stayRepository.findAll()).thenReturn(List.of(allowedStay, deniedStay));
            when(deletionAuthorizationPolicy.canDelete(allowedStay.getCreatedBy(), allowedStay.getCreatedAt())).thenReturn(true);
            when(deletionAuthorizationPolicy.canDelete(deniedStay.getCreatedBy(), deniedStay.getCreatedAt())).thenReturn(false);
            when(stayMapper.toResponseDTO(allowedStay, true)).thenReturn(allowedResponse);
            when(stayMapper.toResponseDTO(deniedStay, false)).thenReturn(deniedResponse);

            List<StayResponseDTO> result = service.getAllStays();

            assertEquals(List.of(allowedResponse, deniedResponse), result);
            verify(stayMapper).toResponseDTO(allowedStay, true);
            verify(stayMapper).toResponseDTO(deniedStay, false);
            verify(stayPaymentRemovalRepository)
                    .findStayIdsWithRemovalHistory(List.of(allowedStay.getId()));

        }

    }

    @Nested
    class UpdateStayTests {

        @Test
        public void shouldThrowBadRequest_whenEndDateIsNotAfterStartDate() {

            LocalDateTime startAt = LocalDateTime.now().plusDays(2);
            LocalDateTime endAt = startAt.minusDays(1);

            assertThrows(BadRequestException.class, () -> {
                service.updateStay(UUID.randomUUID(), StayUpdateDTO.builder()
                        .startAt(startAt)
                        .endAt(endAt)
                        .build());
            });

        }

        @Test
        public void shouldThrowConflict_whenStayIsCancelled() {

            LocalDateTime startAt = LocalDateTime.now().plusDays(1);
            LocalDateTime endAt = startAt.plusDays(4);
            LocalDateTime updateStartAt = endAt.plusDays(2);
            LocalDateTime updateEndAt = updateStartAt.plusDays(10);

            Stay stay = Stay.builder()
                    .id(UUID.randomUUID())
                    .startAt(startAt)
                    .endAt(endAt)
                    .cancelledAt(LocalDateTime.now().minusDays(1))
                    .build();

            StayUpdateDTO requestDto = StayUpdateDTO.builder()
                    .startAt(updateStartAt)
                    .endAt(updateEndAt)
                    .build();

            when(stayRepository.findById(stay.getId())).thenReturn(Optional.of(stay));

            assertThrows(ConflictException.class, () -> service.updateStay(stay.getId(), requestDto));

        }

        @Test
        public void shouldThrowConflict_whenStayIsCheckedOut() {

            LocalDateTime startAt = LocalDateTime.now().minusDays(10);
            LocalDateTime endAt = startAt.plusDays(5);
            LocalDateTime updateStartAt = LocalDateTime.now().plusDays(1);
            LocalDateTime updateEndAt = updateStartAt.plusDays(10);

            Stay stay = Stay.builder()
                    .id(UUID.randomUUID())
                    .startAt(startAt)
                    .endAt(endAt)
                    .build();

            StayUpdateDTO requestDto = StayUpdateDTO.builder()
                    .startAt(updateStartAt)
                    .endAt(updateEndAt)
                    .build();

            when(stayRepository.findById(stay.getId())).thenReturn(Optional.of(stay));

            assertThrows(ConflictException.class, () -> service.updateStay(stay.getId(), requestDto));

        }

        @Test
        public void shouldThrowConflict_whenCatHasOverbooking() {

            LocalDateTime overbookingStartAt = LocalDateTime.now().plusDays(10);
            LocalDateTime overbookingEndAt = overbookingStartAt.plusDays(11);
            LocalDateTime stayToModifyStartAt = overbookingEndAt.plusDays(10);
            LocalDateTime stayToModifyEndAt = stayToModifyStartAt.plusDays(11);
            LocalDateTime updateStartAt = overbookingStartAt.plusDays(8);
            LocalDateTime updateEndAt = updateStartAt.plusDays(7);

            Stay overbookingStay = Stay.builder()
                    .id(UUID.randomUUID())
                    .startAt(overbookingStartAt)
                    .endAt(overbookingEndAt)
                    .build();

            Stay stayToModify = Stay.builder()
                    .id(UUID.randomUUID())
                    .startAt(stayToModifyStartAt)
                    .endAt(stayToModifyEndAt)
                    .build();

            Cat cat = Cat.builder()
                    .id(UUID.randomUUID())
                    .name("Cat 1")
                    .owner(Owner.builder()
                            .id(UUID.randomUUID())
                            .build())
                    .lastRabiesDate(updateEndAt.toLocalDate())
                    .lastTripleFelineDate(updateEndAt.toLocalDate())
                    .build();

            StayUpdateDTO updateDto = StayUpdateDTO.builder()
                    .startAt(updateStartAt)
                    .endAt(updateEndAt)
                    .pricingDecision(pricingDecision())
                    .build();

            linkStayAndCat(overbookingStay, cat);
            linkStayAndCat(stayToModify, cat);

            when(stayRepository.findById(stayToModify.getId())).thenReturn(Optional.of(stayToModify));
            when(stayMapper.updateEntity(stayToModify, updateDto)).thenReturn(stayToModify);
            when(currentUserAccountService.getCurrentUserAccount())
                    .thenReturn(user(UserRole.ADMIN));

            confirmDateChange(stayToModify, updateDto);
            assertThrows(ConflictException.class, () -> {
                service.updateStay(stayToModify.getId(), updateDto);
            });

        }

        @Test
        public void shouldUpdateStaySuccessfully() {

            LocalDateTime startAt = LocalDateTime.now().plusDays(1);
            LocalDateTime endAt = startAt.plusDays(41);
            LocalDateTime updateStartAt = startAt.plusDays(8);
            LocalDateTime updateEndAt = updateStartAt.plusDays(7);

            Stay stay = Stay.builder()
                    .id(UUID.randomUUID())
                    .startAt(startAt)
                    .endAt(endAt)
                    .build();

            StayUpdateDTO updateDto = StayUpdateDTO.builder()
                    .startAt(updateStartAt)
                    .endAt(updateEndAt)
                    .notes("This is a note")
                    .pricingDecision(pricingDecision())
                    .build();

            Cat cat = Cat.builder()
                    .id(UUID.randomUUID())
                    .name("Cat 1")
                    .owner(Owner.builder()
                            .id(UUID.randomUUID())
                            .build())
                    .lastRabiesDate(updateEndAt.toLocalDate())
                    .lastTripleFelineDate(updateEndAt.toLocalDate())
                    .build();

            StayCat stayCat = linkStayAndCat(stay, cat);

            StayResponseDTO expectedResponseDTO = new StayResponseDTO();

            Stay updatedStay = Stay.builder()
                    .id(stay.getId())
                    .startAt(updateDto.getStartAt())
                    .endAt(updateDto.getEndAt())
                    .notes(updateDto.getNotes())
                    .stayCats(Set.of(stayCat))
                    .build();

            when(stayRepository.findById(stay.getId())).thenReturn(Optional.of(stay));
            when(currentUserAccountService.getCurrentUserAccount())
                    .thenReturn(user(UserRole.ADMIN));
            when(stayMapper.updateEntity(stay, updateDto)).thenReturn(updatedStay);
            when(stayRepository.save(updatedStay)).thenReturn(updatedStay);
            when(deletionAuthorizationPolicy.canDelete(any(), any())).thenReturn(true);
            when(stayMapper.toResponseDTO(updatedStay, true)).thenReturn(expectedResponseDTO);

            confirmDateChange(stay, updateDto);
            StayResponseDTO result = service.updateStay(stay.getId(), updateDto);

            assertSame(expectedResponseDTO, result);

            verify(stayMapper).updateEntity(stay, updateDto);
            verify(stayRepository).save(updatedStay);
            verify(stayMapper).toResponseDTO(updatedStay, true);

        }

        @Test
        public void shouldUpdateStay_whenOnlyOverlapIsSameStay() {

            LocalDateTime startAt = LocalDateTime.now().plusDays(1);
            LocalDateTime endAt = startAt.plusDays(41);
            LocalDateTime updateStartAt = startAt.plusDays(8);
            LocalDateTime updateEndAt = updateStartAt.plusDays(7);

            Stay stay = Stay.builder()
                    .id(UUID.randomUUID())
                    .startAt(startAt)
                    .endAt(endAt)
                    .build();

            Cat cat = Cat.builder()
                    .id(UUID.randomUUID())
                    .name("Cat 1")
                    .owner(Owner.builder()
                            .id(UUID.randomUUID())
                            .build())
                    .lastRabiesDate(updateEndAt.toLocalDate())
                    .lastTripleFelineDate(updateEndAt.toLocalDate())
                    .build();

            StayCat stayCat = linkStayAndCat(stay, cat);

            StayUpdateDTO updateDto = StayUpdateDTO.builder()
                    .startAt(updateStartAt)
                    .endAt(updateEndAt)
                    .pricingDecision(pricingDecision())
                    .build();

            StayResponseDTO expectedResponseDTO = new StayResponseDTO();

            Stay updatedStay = Stay.builder()
                    .id(stay.getId())
                    .startAt(updateDto.getStartAt())
                    .endAt(updateDto.getEndAt())
                    .notes(updateDto.getNotes())
                    .stayCats(Set.of(stayCat))
                    .build();

            when(stayRepository.findById(stay.getId())).thenReturn(Optional.of(stay));
            when(currentUserAccountService.getCurrentUserAccount())
                    .thenReturn(user(UserRole.ADMIN));
            when(stayMapper.updateEntity(stay, updateDto)).thenReturn(updatedStay);
            when(stayRepository.save(updatedStay)).thenReturn(updatedStay);
            when(deletionAuthorizationPolicy.canDelete(any(), any())).thenReturn(true);
            when(stayMapper.toResponseDTO(updatedStay, true)).thenReturn(expectedResponseDTO);

            confirmDateChange(stay, updateDto);
            StayResponseDTO result = assertDoesNotThrow(() -> service.updateStay(stay.getId(), updateDto));

            assertSame(expectedResponseDTO, result);

            verify(stayMapper).updateEntity(stay, updateDto);
            verify(stayRepository).save(updatedStay);
            verify(stayMapper).toResponseDTO(updatedStay, true);

        }

        @Test
        public void shouldUpdateStay_whenOverlappingStayIsCancelled() {

            LocalDateTime cancelledStartAt = LocalDateTime.now().plusDays(1);
            LocalDateTime cancelledEndAt = cancelledStartAt.plusDays(41);
            LocalDateTime activeStartAt = cancelledEndAt.plusDays(10);
            LocalDateTime activeEndAt = activeStartAt.plusDays(7);
            LocalDateTime updateStartAt = cancelledStartAt.plusDays(8);
            LocalDateTime updateEndAt = updateStartAt.plusDays(7);

            Stay cancelledStay = Stay.builder()
                    .id(UUID.randomUUID())
                    .startAt(cancelledStartAt)
                    .endAt(cancelledEndAt)
                    .cancelledAt(LocalDateTime.now().minusDays(1))
                    .build();

            Stay activeStay = Stay.builder()
                    .id(UUID.randomUUID())
                    .startAt(activeStartAt)
                    .endAt(activeEndAt)
                    .build();

            Cat cat = Cat.builder()
                    .id(UUID.randomUUID())
                    .name("Cat 1")
                    .owner(Owner.builder()
                            .id(UUID.randomUUID())
                            .build())
                    .lastRabiesDate(updateEndAt.toLocalDate())
                    .lastTripleFelineDate(updateEndAt.toLocalDate())
                    .build();

            linkStayAndCat(cancelledStay, cat);
            StayCat activeStayCat = linkStayAndCat(activeStay, cat);

            StayUpdateDTO updateDto = StayUpdateDTO.builder()
                    .startAt(updateStartAt)
                    .endAt(updateEndAt)
                    .build();

            StayResponseDTO expectedResponseDTO = new StayResponseDTO();

            Stay updatedStay = Stay.builder()
                    .id(activeStay.getId())
                    .startAt(updateDto.getStartAt())
                    .endAt(updateDto.getEndAt())
                    .notes(updateDto.getNotes())
                    .stayCats(Set.of(activeStayCat))
                    .build();

            when(stayRepository.findById(activeStay.getId())).thenReturn(Optional.of(activeStay));
            when(stayMapper.updateEntity(activeStay, updateDto)).thenReturn(updatedStay);
            when(stayRepository.save(updatedStay)).thenReturn(updatedStay);
            when(deletionAuthorizationPolicy.canDelete(any(), any())).thenReturn(true);
            when(stayMapper.toResponseDTO(updatedStay, true)).thenReturn(expectedResponseDTO);

            StayResponseDTO result = assertDoesNotThrow(() -> service.updateStay(activeStay.getId(), updateDto));

            assertSame(expectedResponseDTO, result);

            verify(stayMapper).updateEntity(activeStay, updateDto);
            verify(stayRepository).save(updatedStay);
            verify(stayMapper).toResponseDTO(updatedStay, true);

        }

    }

    @Nested
    class VaccineValidityTests {

        @Test
        void createAllowsVaccinesThatExpireAfterStayEnd() {

            LocalDateTime startAt = LocalDateTime.of(2027, 8, 1, 12, 0);
            LocalDateTime endAt = LocalDateTime.of(2027, 8, 5, 12, 0);
            LocalDate vaccinatedOn = endAt.toLocalDate().minusYears(1).plusDays(1);
            Cat cat = vaccineCat("Milo", vaccinatedOn, vaccinatedOn);
            StayRequestDTO request = createRequest(cat, startAt, endAt, false);

            stubCreateRequest(cat, request, UserRole.STAFF);
            stubSuccessfulCreate();

            assertDoesNotThrow(() -> service.createStay(request));

            verify(stayRepository).save(any(Stay.class));

        }

        @Test
        void createBlocksVaccinesThatExpireExactlyAtStayEnd() {

            LocalDateTime startAt = LocalDateTime.of(2027, 8, 1, 12, 0);
            LocalDateTime endAt = LocalDateTime.of(2027, 8, 5, 12, 0);
            LocalDate vaccinatedOn = endAt.toLocalDate().minusYears(1);
            Cat cat = vaccineCat("Milo", vaccinatedOn, vaccinatedOn);
            StayRequestDTO request = createRequest(cat, startAt, endAt, false);

            stubCreateRequest(cat, request, UserRole.STAFF);

            VaccineConflictException exception = assertThrows(
                    VaccineConflictException.class,
                    () -> service.createStay(request));

            assertEquals(2, exception.getViolations().size());
            assertTrue(exception.getViolations().stream()
                    .allMatch(violation -> violation.getReason() == VaccineConflictReason.EXPIRED));
            assertTrue(exception.getViolations().stream()
                    .allMatch(violation -> violation.getExpiresOn().equals(endAt.toLocalDate())));
            verify(stayRepository, never()).save(any(Stay.class));

        }

        @Test
        void createBlocksVaccinesThatExpireBeforeStayEnd() {

            LocalDateTime startAt = LocalDateTime.of(2027, 8, 1, 12, 0);
            LocalDateTime endAt = LocalDateTime.of(2027, 8, 5, 12, 0);
            LocalDate vaccinatedOn = endAt.toLocalDate().minusYears(1).minusDays(1);
            Cat cat = vaccineCat("Milo", vaccinatedOn, vaccinatedOn);
            StayRequestDTO request = createRequest(cat, startAt, endAt, false);

            stubCreateRequest(cat, request, UserRole.STAFF);

            VaccineConflictException exception = assertThrows(
                    VaccineConflictException.class,
                    () -> service.createStay(request));

            assertEquals(2, exception.getViolations().size());
            assertTrue(exception.getViolations().stream()
                    .allMatch(violation -> violation.getReason() == VaccineConflictReason.EXPIRED));
            verify(stayRepository, never()).save(any(Stay.class));

        }

        @Test
        void createReportsMissingVaccineDate() {

            LocalDateTime startAt = LocalDateTime.of(2027, 8, 1, 12, 0);
            LocalDateTime endAt = LocalDateTime.of(2027, 8, 5, 12, 0);
            Cat cat = vaccineCat("Milo", null, endAt.toLocalDate());
            StayRequestDTO request = createRequest(cat, startAt, endAt, false);

            stubCreateRequest(cat, request, UserRole.STAFF);

            VaccineConflictException exception = assertThrows(
                    VaccineConflictException.class,
                    () -> service.createStay(request));

            assertEquals(1, exception.getViolations().size());
            assertEquals(VaccineType.RABIES, exception.getViolations().get(0).getVaccineType());
            assertEquals(VaccineConflictReason.MISSING, exception.getViolations().get(0).getReason());
            assertNull(exception.getViolations().get(0).getVaccinatedOn());
            assertNull(exception.getViolations().get(0).getExpiresOn());

        }

        @Test
        void createReportsEveryConflictAcrossMultipleCats() {

            LocalDateTime startAt = LocalDateTime.of(2027, 8, 1, 12, 0);
            LocalDateTime endAt = LocalDateTime.of(2027, 8, 5, 12, 0);
            Owner owner = Owner.builder().id(UUID.randomUUID()).build();
            LocalDate expiredDate = endAt.toLocalDate().minusYears(1);
            LocalDate validDate = endAt.toLocalDate();
            Cat firstCat = vaccineCat("Milo", owner, null, expiredDate);
            Cat secondCat = vaccineCat("Luna", owner, validDate, null);
            StayRequestDTO request = StayRequestDTO.builder()
                    .startAt(startAt)
                    .endAt(endAt)
                    .catIds(Set.of(firstCat.getId(), secondCat.getId()))
                    .build();

            when(catRepository.findById(firstCat.getId())).thenReturn(Optional.of(firstCat));
            when(catRepository.findById(secondCat.getId())).thenReturn(Optional.of(secondCat));
            when(stayMapper.toEntity(request)).thenReturn(Stay.builder()
                    .startAt(startAt)
                    .endAt(endAt)
                    .build());
            when(currentUserAccountService.getCurrentUserAccount()).thenReturn(user(UserRole.STAFF));

            VaccineConflictException exception = assertThrows(
                    VaccineConflictException.class,
                    () -> service.createStay(request));

            Set<String> actualPairs = exception.getViolations().stream()
                    .map(violation -> violation.getCatId() + ":" + violation.getVaccineType())
                    .collect(Collectors.toSet());

            assertEquals(Set.of(
                    firstCat.getId() + ":" + VaccineType.RABIES,
                    firstCat.getId() + ":" + VaccineType.TRIPLE_FELINE,
                    secondCat.getId() + ":" + VaccineType.TRIPLE_FELINE), actualPairs);
            assertEquals(actualPairs.size(), exception.getViolations().size());

        }

        @Test
        void createAllowsExplicitAdminOverride() {

            LocalDateTime startAt = LocalDateTime.of(2027, 8, 1, 12, 0);
            LocalDateTime endAt = LocalDateTime.of(2027, 8, 5, 12, 0);
            Cat cat = vaccineCat("Milo", null, null);
            StayRequestDTO request = createRequest(cat, startAt, endAt, true);

            stubCreateRequest(cat, request, UserRole.ADMIN);
            stubSuccessfulCreate();

            assertDoesNotThrow(() -> service.createStay(request));

            verify(stayRepository).save(any(Stay.class));

        }

        @Test
        void createBlocksAdminWithoutExplicitOverride() {

            LocalDateTime startAt = LocalDateTime.of(2027, 8, 1, 12, 0);
            LocalDateTime endAt = LocalDateTime.of(2027, 8, 5, 12, 0);
            Cat cat = vaccineCat("Milo", null, null);
            StayRequestDTO request = createRequest(cat, startAt, endAt, false);

            stubCreateRequest(cat, request, UserRole.ADMIN);

            assertThrows(VaccineConflictException.class, () -> service.createStay(request));
            verify(stayRepository, never()).save(any(Stay.class));

        }

        @Test
        void createIgnoresStaffOverride() {

            LocalDateTime startAt = LocalDateTime.of(2027, 8, 1, 12, 0);
            LocalDateTime endAt = LocalDateTime.of(2027, 8, 5, 12, 0);
            Cat cat = vaccineCat("Milo", null, null);
            StayRequestDTO request = createRequest(cat, startAt, endAt, true);

            stubCreateRequest(cat, request, UserRole.STAFF);

            assertThrows(VaccineConflictException.class, () -> service.createStay(request));
            verify(stayRepository, never()).save(any(Stay.class));

        }

        @Test
        void updateSkipsVaccineRevalidationWhenEndIsUnchanged() {

            LocalDateTime persistedStartAt = LocalDateTime.of(2027, 8, 1, 12, 0);
            LocalDateTime persistedEndAt = LocalDateTime.of(2027, 8, 5, 12, 0);
            Cat cat = vaccineCat("Milo", null, null);
            Stay stay = Stay.builder()
                    .id(UUID.randomUUID())
                    .startAt(persistedStartAt)
                    .endAt(persistedEndAt)
                    .build();
            StayCat stayCat = linkStayAndCat(stay, cat);
            StayUpdateDTO request = StayUpdateDTO.builder()
                    .startAt(persistedStartAt.minusHours(1))
                    .endAt(persistedEndAt)
                    .notes("Updated notes")
                    .build();
            Stay updatedStay = Stay.builder()
                    .id(stay.getId())
                    .startAt(request.getStartAt())
                    .endAt(request.getEndAt())
                    .notes(request.getNotes())
                    .stayCats(Set.of(stayCat))
                    .build();
            StayResponseDTO response = new StayResponseDTO();

            when(stayRepository.findById(stay.getId())).thenReturn(Optional.of(stay));
            when(stayMapper.updateEntity(stay, request)).thenReturn(updatedStay);
            when(stayRepository.save(updatedStay)).thenReturn(updatedStay);
            when(stayMapper.toResponseDTO(updatedStay, false)).thenReturn(response);

            assertSame(response, service.updateStay(stay.getId(), request));

            verify(stayRepository).save(updatedStay);
            verify(currentUserAccountService, never()).getCurrentUserAccount();

        }

        @Test
        void updateSkipsVaccineRevalidationWhenEndIsShortened() {

            LocalDateTime persistedStartAt = LocalDateTime.of(2027, 8, 1, 12, 0);
            LocalDateTime persistedEndAt = LocalDateTime.of(2027, 8, 5, 12, 0);
            Cat cat = vaccineCat("Milo", null, null);
            Stay stay = Stay.builder()
                    .id(UUID.randomUUID())
                    .startAt(persistedStartAt)
                    .endAt(persistedEndAt)
                    .build();
            StayCat stayCat = linkStayAndCat(stay, cat);
            StayUpdateDTO request = StayUpdateDTO.builder()
                    .startAt(persistedStartAt)
                    .endAt(persistedEndAt.minusDays(1))
                    .pricingDecision(pricingDecision())
                    .build();
            Stay updatedStay = Stay.builder()
                    .id(stay.getId())
                    .startAt(request.getStartAt())
                    .endAt(request.getEndAt())
                    .stayCats(Set.of(stayCat))
                    .build();
            StayResponseDTO response = new StayResponseDTO();

            when(stayRepository.findById(stay.getId())).thenReturn(Optional.of(stay));
            when(currentUserAccountService.getCurrentUserAccount())
                    .thenReturn(user(UserRole.ADMIN));
            when(stayMapper.updateEntity(stay, request)).thenReturn(updatedStay);
            when(stayRepository.save(updatedStay)).thenReturn(updatedStay);
            when(stayMapper.toResponseDTO(updatedStay, false)).thenReturn(response);

            confirmDateChange(stay, request);
            assertSame(response, service.updateStay(stay.getId(), request));

            verify(stayRepository).save(updatedStay);
            verify(currentUserAccountService).getCurrentUserAccount();

        }

        @Test
        void updateAllowsCoveredExtensionWithoutOverride() {

            LocalDateTime startAt = LocalDateTime.of(2027, 8, 1, 12, 0);
            LocalDateTime persistedEndAt = LocalDateTime.of(2027, 8, 3, 12, 0);
            LocalDateTime requestedEndAt = LocalDateTime.of(2027, 8, 5, 12, 0);
            Cat cat = vaccineCat(
                    "Milo",
                    requestedEndAt.toLocalDate(),
                    requestedEndAt.toLocalDate());
            Stay stay = Stay.builder()
                    .id(UUID.randomUUID())
                    .startAt(startAt)
                    .endAt(persistedEndAt)
                    .build();
            StayCat stayCat = linkStayAndCat(stay, cat);
            StayUpdateDTO request = StayUpdateDTO.builder()
                    .startAt(startAt)
                    .endAt(requestedEndAt)
                    .pricingDecision(pricingDecision())
                    .build();
            Stay updatedStay = Stay.builder()
                    .id(stay.getId())
                    .startAt(request.getStartAt())
                    .endAt(request.getEndAt())
                    .stayCats(Set.of(stayCat))
                    .build();
            StayResponseDTO response = new StayResponseDTO();

            when(stayRepository.findById(stay.getId())).thenReturn(Optional.of(stay));
            when(currentUserAccountService.getCurrentUserAccount())
                    .thenReturn(user(UserRole.ADMIN));
            when(stayMapper.updateEntity(stay, request)).thenReturn(updatedStay);
            when(stayRepository.save(updatedStay)).thenReturn(updatedStay);
            when(stayMapper.toResponseDTO(updatedStay, false)).thenReturn(response);

            confirmDateChange(stay, request);
            assertSame(response, service.updateStay(stay.getId(), request));

            verify(stayRepository).save(updatedStay);
            verify(currentUserAccountService).getCurrentUserAccount();

        }

        @Test
        void updateBlocksConflictingStaffExtensionEvenWithOverrideIntent() {

            LocalDateTime startAt = LocalDateTime.of(2027, 8, 1, 12, 0);
            LocalDateTime persistedEndAt = LocalDateTime.of(2027, 8, 3, 12, 0);
            LocalDateTime requestedEndAt = LocalDateTime.of(2027, 8, 5, 12, 0);
            Cat cat = vaccineCat(
                    "Milo",
                    requestedEndAt.toLocalDate().minusYears(1),
                    requestedEndAt.toLocalDate());
            Stay stay = Stay.builder()
                    .id(UUID.randomUUID())
                    .startAt(startAt)
                    .endAt(persistedEndAt)
                    .build();
            linkStayAndCat(stay, cat);
            StayUpdateDTO request = StayUpdateDTO.builder()
                    .startAt(startAt)
                    .endAt(requestedEndAt)
                    .overrideVaccineConflicts(true)
                    .pricingDecision(pricingDecision())
                    .build();

            when(stayRepository.findById(stay.getId())).thenReturn(Optional.of(stay));
            when(currentUserAccountService.getCurrentUserAccount()).thenReturn(user(UserRole.STAFF));

            ForbiddenException exception = assertThrows(
                    ForbiddenException.class,
                    () -> service.updateStay(stay.getId(), request));

            assertEquals(
                    "Only administrators can change a stay's number of nights",
                    exception.getMessage()
            );
            verify(stayRepository, never()).save(any(Stay.class));

        }

        @Test
        void updateBlocksConflictingAdminExtensionWithoutExplicitOverride() {

            LocalDateTime startAt = LocalDateTime.of(2027, 8, 1, 12, 0);
            LocalDateTime persistedEndAt = LocalDateTime.of(2027, 8, 3, 12, 0);
            LocalDateTime requestedEndAt = LocalDateTime.of(2027, 8, 5, 12, 0);
            Cat cat = vaccineCat("Milo", null, null);
            Stay stay = Stay.builder()
                    .id(UUID.randomUUID())
                    .startAt(startAt)
                    .endAt(persistedEndAt)
                    .build();
            linkStayAndCat(stay, cat);
            StayUpdateDTO request = StayUpdateDTO.builder()
                    .startAt(startAt)
                    .endAt(requestedEndAt)
                    .pricingDecision(pricingDecision())
                    .build();

            when(stayRepository.findById(stay.getId())).thenReturn(Optional.of(stay));
            when(stayMapper.updateEntity(stay, request)).thenReturn(stay);
            when(currentUserAccountService.getCurrentUserAccount()).thenReturn(user(UserRole.ADMIN));

            confirmDateChange(stay, request);
            assertThrows(VaccineConflictException.class, () -> service.updateStay(stay.getId(), request));
            verify(stayRepository, never()).save(any(Stay.class));

        }

        @Test
        void updateAllowsExplicitAdminOverrideForConflictingExtension() {

            LocalDateTime startAt = LocalDateTime.of(2027, 8, 1, 12, 0);
            LocalDateTime persistedEndAt = LocalDateTime.of(2027, 8, 3, 12, 0);
            LocalDateTime requestedEndAt = LocalDateTime.of(2027, 8, 5, 12, 0);
            Cat cat = vaccineCat("Milo", null, null);
            Stay stay = Stay.builder()
                    .id(UUID.randomUUID())
                    .startAt(startAt)
                    .endAt(persistedEndAt)
                    .build();
            StayCat stayCat = linkStayAndCat(stay, cat);
            StayUpdateDTO request = StayUpdateDTO.builder()
                    .startAt(startAt)
                    .endAt(requestedEndAt)
                    .overrideVaccineConflicts(true)
                    .pricingDecision(pricingDecision())
                    .build();
            Stay updatedStay = Stay.builder()
                    .id(stay.getId())
                    .startAt(startAt)
                    .endAt(requestedEndAt)
                    .stayCats(Set.of(stayCat))
                    .build();
            StayResponseDTO response = new StayResponseDTO();

            when(stayRepository.findById(stay.getId())).thenReturn(Optional.of(stay));
            when(stayMapper.updateEntity(stay, request)).thenReturn(updatedStay);
            when(currentUserAccountService.getCurrentUserAccount()).thenReturn(user(UserRole.ADMIN));
            when(stayRepository.save(updatedStay)).thenReturn(updatedStay);
            when(stayMapper.toResponseDTO(updatedStay, false)).thenReturn(response);

            confirmDateChange(stay, request);
            assertSame(response, service.updateStay(stay.getId(), request));

            verify(stayRepository).save(updatedStay);

        }

    }

    private StayCat linkStayAndCat(Stay stay, Cat cat) {

        StayCat stayCat = StayCat.builder()
                .stay(stay)
                .cat(cat)
                .build();

        stay.getStayCats().add(stayCat);
        cat.getStayCats().add(stayCat);

        return stayCat;

    }

    private Cat vaccineCat(String name, LocalDate rabiesDate, LocalDate tripleFelineDate) {
        return vaccineCat(
                name,
                Owner.builder().id(UUID.randomUUID()).build(),
                rabiesDate,
                tripleFelineDate);
    }

    private Cat vaccineCat(
            String name,
            Owner owner,
            LocalDate rabiesDate,
            LocalDate tripleFelineDate) {

        return Cat.builder()
                .id(UUID.randomUUID())
                .name(name)
                .owner(owner)
                .lastRabiesDate(rabiesDate)
                .lastTripleFelineDate(tripleFelineDate)
                .build();
    }

    private StayRequestDTO createRequest(
            Cat cat,
            LocalDateTime startAt,
            LocalDateTime endAt,
            boolean overrideVaccineConflicts) {

        return StayRequestDTO.builder()
                .startAt(startAt)
                .endAt(endAt)
                .catIds(Set.of(cat.getId()))
                .overrideVaccineConflicts(overrideVaccineConflicts)
                .pricingDecision(pricingDecision())
                .build();
    }

    private void stubCreateRequest(Cat cat, StayRequestDTO request, UserRole role) {
        when(catRepository.findById(cat.getId())).thenReturn(Optional.of(cat));
        when(stayMapper.toEntity(request)).thenReturn(Stay.builder()
                .startAt(request.getStartAt())
                .endAt(request.getEndAt())
                .build());
        when(currentUserAccountService.getCurrentUserAccount()).thenReturn(user(role));
        request.setConfirmation(
                service.previewCreationPricing(
                        StayCreationPricingPreviewRequestDTO.builder()
                                .startAt(request.getStartAt())
                                .endAt(request.getEndAt())
                                .catIds(request.getCatIds())
                                .build())
                        .getConfirmation());
        clearInvocations(catRepository, nightlyReferenceRateRepository,
                currentUserAccountService);
    }

    private void stubSuccessfulCreate() {
        when(stayRepository.save(any(Stay.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(stayMapper.toResponseDTO(any(Stay.class), eq(false))).thenReturn(new StayResponseDTO());
    }

    private PricingDecisionRequestDTO pricingDecision() {
        return PricingDecisionRequestDTO.builder()
                .agreedAmount(BigDecimal.ZERO)
                .build();
    }

    private CreationFixture stubPricingCreation(
            int catCount,
            LocalDateTime startAt,
            LocalDateTime endAt,
            BigDecimal nightlyRate,
            PricingDecisionRequestDTO pricingDecision) {
        Owner owner = Owner.builder()
                .id(UUID.randomUUID())
                .fullName("Owner")
                .build();
        Set<UUID> catIds = new HashSet<>();
        for (int index = 0; index < catCount; index++) {
            Cat cat = vaccineCat(
                    "Cat " + index,
                    owner,
                    endAt.toLocalDate(),
                    endAt.toLocalDate()
            );
            catIds.add(cat.getId());
            when(catRepository.findById(cat.getId())).thenReturn(Optional.of(cat));
        }

        StayRequestDTO request = StayRequestDTO.builder()
                .startAt(startAt)
                .endAt(endAt)
                .catIds(catIds)
                .pricingDecision(pricingDecision)
                .build();
        Stay stay = Stay.builder()
                .startAt(startAt)
                .endAt(endAt)
                .build();
        UserAccount actor = user(UserRole.STAFF);
        NightlyReferenceRateCategory category = NightlyReferenceRateCategory
                .fromActualCatCount(catCount)
                .orElseThrow();

        lenient().when(stayMapper.toEntity(request)).thenReturn(stay);
        when(currentUserAccountService.getCurrentUserAccount()).thenReturn(actor);
        NightlyReferenceRate configuredRate = NightlyReferenceRate.builder()
                .category(category)
                .nightlyRate(nightlyRate)
                .build();
        when(nightlyReferenceRateRepository.findById(category))
                .thenReturn(Optional.of(configuredRate));
        lenient().when(nightlyReferenceRateRepository.findByCategoryForUpdate(category))
                .thenReturn(Optional.of(configuredRate));
        lenient().when(stayRepository.save(stay)).thenAnswer(invocation -> {
            if (stay.getId() == null) {
                stay.setId(UUID.randomUUID());
            }
            return stay;
        });
        lenient().when(stayMapper.toResponseDTO(stay, false))
                .thenReturn(new StayResponseDTO());

        request.setConfirmation(
                service.previewCreationPricing(
                        StayCreationPricingPreviewRequestDTO.builder()
                                .startAt(startAt)
                                .endAt(endAt)
                                .catIds(catIds)
                                .build())
                        .getConfirmation());
        clearInvocations(catRepository, nightlyReferenceRateRepository,
                currentUserAccountService);

        return new CreationFixture(request, stay, actor);
    }

    private record CreationFixture(
            StayRequestDTO request,
            Stay stay,
            UserAccount actor) {
    }

    private void confirmDateChange(Stay stay, StayUpdateDTO request) {
        request.setConfirmation(
                service.previewDateChangePricing(
                        stay.getId(), StayDatePricingPreviewRequestDTO.builder()
                                .startAt(request.getStartAt())
                                .endAt(request.getEndAt())
                                .build())
                        .getConfirmation());
        clearInvocations(stayRepository, currentUserAccountService);
    }

    private void confirmCreation(StayRequestDTO request) {
        request.setConfirmation(
                service.previewCreationPricing(
                        StayCreationPricingPreviewRequestDTO.builder()
                                .startAt(request.getStartAt())
                                .endAt(request.getEndAt())
                                .catIds(request.getCatIds())
                                .build())
                        .getConfirmation());
        clearInvocations(catRepository, nightlyReferenceRateRepository,
                currentUserAccountService);
    }

    private UserAccount user(UserRole role) {
        return UserAccount.builder()
                .id(UUID.randomUUID())
                .username(role.name().toLowerCase(Locale.ROOT))
                .role(role)
                .build();
    }

    private Stay stayWithCreator(LocalDateTime startAt, LocalDateTime endAt, LocalDateTime cancelledAt) {

        Stay stay = Stay.builder()
                .id(UUID.randomUUID())
                .startAt(startAt)
                .endAt(endAt)
                .cancelledAt(cancelledAt)
                .createdBy(UserAccount.builder()
                        .id(UUID.randomUUID())
                        .username("creator")
                        .build())
                .build();
        stay.setCreatedAt(Instant.now());

        return stay;

    }

}
