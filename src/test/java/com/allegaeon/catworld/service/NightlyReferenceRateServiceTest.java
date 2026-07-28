package com.allegaeon.catworld.service;

import com.allegaeon.catworld.exception.BadRequestException;
import com.allegaeon.catworld.mapper.NightlyReferenceRateMapper;
import com.allegaeon.catworld.model.NightlyReferenceRate;
import com.allegaeon.catworld.model.NightlyReferenceRateCategory;
import com.allegaeon.catworld.model.NightlyReferenceRateChange;
import com.allegaeon.catworld.model.UserAccount;
import com.allegaeon.catworld.model.UserRole;
import com.allegaeon.catworld.repository.NightlyReferenceRateChangeRepository;
import com.allegaeon.catworld.repository.NightlyReferenceRateRepository;
import com.allegaeon.catworld.security.CurrentUserAccountService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class NightlyReferenceRateServiceTest {

    private static final Instant CHANGED_AT = Instant.parse("2026-07-27T12:00:00Z");

    @Mock
    private NightlyReferenceRateRepository nightlyReferenceRateRepository;

    @Mock
    private NightlyReferenceRateChangeRepository nightlyReferenceRateChangeRepository;

    @Mock
    private CurrentUserAccountService currentUserAccountService;

    @Mock
    private NightlyReferenceRateAuthorizationPolicy authorizationPolicy;

    private UserAccount administrator;
    private NightlyReferenceRateService service;

    @BeforeEach
    void setUp() {
        administrator = UserAccount.builder()
                .id(UUID.fromString("00000000-0000-0000-0000-000000000001"))
                .username("admin")
                .role(UserRole.ADMIN)
                .build();
        service = new NightlyReferenceRateService(
                nightlyReferenceRateRepository,
                nightlyReferenceRateChangeRepository,
                new NightlyReferenceRateMapper(),
                currentUserAccountService,
                authorizationPolicy,
                Clock.fixed(CHANGED_AT, ZoneOffset.UTC)
        );
    }

    @Test
    void readsExactlyThreeIndependentCategoriesInMinimumCatCountOrder() {
        when(currentUserAccountService.getCurrentUserAccount()).thenReturn(administrator);
        when(nightlyReferenceRateRepository.findAll()).thenReturn(List.of(
                rate(NightlyReferenceRateCategory.THREE_PLUS_CATS, new BigDecimal("30")),
                rate(NightlyReferenceRateCategory.ONE_CAT, new BigDecimal("12")),
                rate(NightlyReferenceRateCategory.TWO_CATS, null)
        ));

        var response = service.getCurrentRates();

        assertEquals(
                List.of(1, 2, 3),
                response.stream().map(item -> item.getMinimumCatCount()).toList()
        );
        assertEquals(0, response.get(0).getNightlyRate().compareTo(new BigDecimal("12")));
        assertNull(response.get(1).getNightlyRate());
        assertEquals(0, response.get(2).getNightlyRate().compareTo(new BigDecimal("30")));
        verify(authorizationPolicy).authorizeRead(administrator);
        verifyNoInteractions(nightlyReferenceRateChangeRepository);
    }

    @ParameterizedTest
    @EnumSource(NightlyReferenceRateCategory.class)
    void configuresOnlySelectedCategoryAndCreatesExactAudit(
            NightlyReferenceRateCategory category) {
        BigDecimal newRate = new BigDecimal("24");
        NightlyReferenceRate currentRate = rate(category, null);
        prepareAdminMutation(category, currentRate);
        when(nightlyReferenceRateRepository.saveAndFlush(currentRate)).thenReturn(currentRate);
        when(nightlyReferenceRateChangeRepository.saveAndFlush(any(NightlyReferenceRateChange.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        var response = service.configureRate(category.getMinimumCatCount(), newRate);

        assertEquals(category.getMinimumCatCount(), response.getMinimumCatCount());
        assertEquals(0, newRate.compareTo(response.getNightlyRate()));
        verify(nightlyReferenceRateRepository).findByCategoryForUpdate(category);
        verify(nightlyReferenceRateRepository).saveAndFlush(currentRate);

        ArgumentCaptor<NightlyReferenceRateChange> auditCaptor =
                ArgumentCaptor.forClass(NightlyReferenceRateChange.class);
        verify(nightlyReferenceRateChangeRepository).saveAndFlush(auditCaptor.capture());
        NightlyReferenceRateChange change = auditCaptor.getValue();
        assertEquals(category, change.getCategory());
        assertNull(change.getPreviousNightlyRate());
        assertEquals(0, newRate.compareTo(change.getNewNightlyRate()));
        assertEquals(administrator, change.getChangedBy());
        assertEquals(CHANGED_AT, change.getChangedAt());
        verify(authorizationPolicy).authorizeMutation(administrator);
    }

    @Test
    void replacesConfiguredValueAndPreservesExactPreviousAndNewAuditValues() {
        NightlyReferenceRate currentRate = rate(
                NightlyReferenceRateCategory.TWO_CATS,
                new BigDecimal("19")
        );
        prepareAdminMutation(NightlyReferenceRateCategory.TWO_CATS, currentRate);

        service.configureRate(2, new BigDecimal("21"));

        ArgumentCaptor<NightlyReferenceRateChange> auditCaptor =
                ArgumentCaptor.forClass(NightlyReferenceRateChange.class);
        verify(nightlyReferenceRateChangeRepository).saveAndFlush(auditCaptor.capture());
        assertEquals(
                0,
                auditCaptor.getValue().getPreviousNightlyRate().compareTo(new BigDecimal("19"))
        );
        assertEquals(
                0,
                auditCaptor.getValue().getNewNightlyRate().compareTo(new BigDecimal("21"))
        );
    }

    @Test
    void clearsConfiguredCategoryAndAuditsTransitionToUnavailable() {
        NightlyReferenceRate currentRate = rate(
                NightlyReferenceRateCategory.THREE_PLUS_CATS,
                new BigDecimal("40")
        );
        prepareAdminMutation(NightlyReferenceRateCategory.THREE_PLUS_CATS, currentRate);

        service.clearRate(3);

        assertNull(currentRate.getNightlyRate());
        ArgumentCaptor<NightlyReferenceRateChange> auditCaptor =
                ArgumentCaptor.forClass(NightlyReferenceRateChange.class);
        verify(nightlyReferenceRateChangeRepository).saveAndFlush(auditCaptor.capture());
        assertEquals(
                0,
                auditCaptor.getValue().getPreviousNightlyRate().compareTo(new BigDecimal("40"))
        );
        assertNull(auditCaptor.getValue().getNewNightlyRate());
    }

    @Test
    void numericReplacementAndAlreadyUnavailableClearAreNoOps() {
        NightlyReferenceRate configured = rate(
                NightlyReferenceRateCategory.ONE_CAT,
                new BigDecimal("12")
        );
        prepareAdminMutation(NightlyReferenceRateCategory.ONE_CAT, configured);

        service.configureRate(1, new BigDecimal("12.0"));

        NightlyReferenceRate unavailable = rate(NightlyReferenceRateCategory.TWO_CATS, null);
        when(nightlyReferenceRateRepository.findByCategoryForUpdate(
                NightlyReferenceRateCategory.TWO_CATS
        )).thenReturn(Optional.of(unavailable));
        service.clearRate(2);

        verify(nightlyReferenceRateRepository, never()).saveAndFlush(any());
        verifyNoInteractions(nightlyReferenceRateChangeRepository);
    }

    @ParameterizedTest
    @ValueSource(strings = {"0", "-1", "1.5", "10000000000000000000"})
    void rejectsNonPositiveFractionalOrOutOfCapacityValuesWithoutPersistence(String value) {
        when(currentUserAccountService.getCurrentUserAccount()).thenReturn(administrator);

        assertThrows(BadRequestException.class, () -> service.configureRate(1, new BigDecimal(value)));

        verify(authorizationPolicy).authorizeMutation(administrator);
        verifyNoInteractions(nightlyReferenceRateRepository, nightlyReferenceRateChangeRepository);
    }

    @Test
    void rejectsNullRateWithoutPersistence() {
        when(currentUserAccountService.getCurrentUserAccount()).thenReturn(administrator);

        assertThrows(BadRequestException.class, () -> service.configureRate(1, null));

        verify(authorizationPolicy).authorizeMutation(administrator);
        verifyNoInteractions(nightlyReferenceRateRepository, nightlyReferenceRateChangeRepository);
    }

    @ParameterizedTest
    @ValueSource(strings = {"1", "9999999999999999999"})
    void acceptsPositiveWholeNumberCapacityBoundaries(String value) {
        BigDecimal nightlyRate = new BigDecimal(value);
        NightlyReferenceRate currentRate = rate(NightlyReferenceRateCategory.ONE_CAT, null);
        prepareAdminMutation(NightlyReferenceRateCategory.ONE_CAT, currentRate);

        var response = service.configureRate(1, nightlyRate);

        assertEquals(0, nightlyRate.compareTo(response.getNightlyRate()));
        verify(nightlyReferenceRateRepository).saveAndFlush(currentRate);
        verify(nightlyReferenceRateChangeRepository)
                .saveAndFlush(any(NightlyReferenceRateChange.class));
    }

    @Test
    void minimumCatCountThreeResolvesExactlyToThreePlusCats() {
        assertEquals(
                Optional.of(NightlyReferenceRateCategory.THREE_PLUS_CATS),
                NightlyReferenceRateCategory.fromMinimumCatCount(3)
        );
    }

    @Test
    void rejectsUnsupportedMinimumCatCountThresholdWithoutPersistence() {
        when(currentUserAccountService.getCurrentUserAccount()).thenReturn(administrator);

        assertThrows(
                BadRequestException.class,
                () -> service.configureRate(4, new BigDecimal("10"))
        );

        verifyNoInteractions(nightlyReferenceRateRepository, nightlyReferenceRateChangeRepository);
    }

    @Test
    void staffAuthorizationStopsMutationBeforeValidationOrPersistence() {
        UserAccount staff = UserAccount.builder().username("staff").role(UserRole.STAFF).build();
        when(currentUserAccountService.getCurrentUserAccount()).thenReturn(staff);
        org.mockito.Mockito.doThrow(new com.allegaeon.catworld.exception.ForbiddenException("denied"))
                .when(authorizationPolicy).authorizeMutation(staff);

        assertThrows(
                com.allegaeon.catworld.exception.ForbiddenException.class,
                () -> service.configureRate(1, BigDecimal.ZERO)
        );

        verifyNoInteractions(nightlyReferenceRateRepository, nightlyReferenceRateChangeRepository);
    }

    private void prepareAdminMutation(
            NightlyReferenceRateCategory category,
            NightlyReferenceRate currentRate) {
        when(currentUserAccountService.getCurrentUserAccount()).thenReturn(administrator);
        when(nightlyReferenceRateRepository.findByCategoryForUpdate(category))
                .thenReturn(Optional.of(currentRate));
    }

    private NightlyReferenceRate rate(
            NightlyReferenceRateCategory category,
            BigDecimal nightlyRate) {
        return NightlyReferenceRate.builder()
                .category(category)
                .nightlyRate(nightlyRate)
                .build();
    }
}
