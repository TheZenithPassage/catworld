package com.allegaeon.catworld.service;

import com.allegaeon.catworld.dto.sensitiveactivity.SensitiveEconomicActivityFilter;
import com.allegaeon.catworld.dto.sensitiveactivity.SensitiveEconomicActivityResponseDTO;
import com.allegaeon.catworld.dto.sensitiveactivity.SensitiveEconomicEventType;
import com.allegaeon.catworld.dto.sensitiveactivity.NightlyRateChangedActivityDTO;
import com.allegaeon.catworld.dto.sensitiveactivity.SensitiveActorDTO;
import com.allegaeon.catworld.exception.BadRequestException;
import com.allegaeon.catworld.exception.ForbiddenException;
import com.allegaeon.catworld.mapper.SensitiveEconomicActivityMapper;
import com.allegaeon.catworld.model.UserAccount;
import com.allegaeon.catworld.model.UserRole;
import com.allegaeon.catworld.model.NightlyReferenceRateCategory;
import com.allegaeon.catworld.repository.SensitiveEconomicActivityProjection;
import com.allegaeon.catworld.repository.SensitiveEconomicActivityReadRepository;
import com.allegaeon.catworld.security.CurrentUserAccountService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SensitiveEconomicActivityServiceTest {

    @Mock SensitiveEconomicActivityReadRepository readRepository;
    @Mock SensitiveEconomicActivityMapper mapper;
    @Mock CurrentUserAccountService currentUserAccountService;
    @Mock SensitiveEconomicActivityAuthorizationPolicy authorizationPolicy;
    @InjectMocks SensitiveEconomicActivityService service;

    @Test
    void authorizesAndDelegatesDefaultFilterToDatabaseQuery() {
        UserAccount admin = user(UserRole.ADMIN);
        SensitiveEconomicActivityProjection projection =
                mock(SensitiveEconomicActivityProjection.class);
        SensitiveEconomicActivityResponseDTO response = response();
        when(currentUserAccountService.getCurrentUserAccount())
                .thenReturn(admin);
        when(readRepository.findActivity(
                new SensitiveEconomicActivityFilter(
                        null, null, null, null, null, null, null
                )
        )).thenReturn(List.of(projection));
        when(mapper.map(projection)).thenReturn(response);

        List<SensitiveEconomicActivityResponseDTO> result =
                service.getActivity(null);

        assertEquals(List.of(response), result);
        verify(authorizationPolicy).authorizeRead(admin);
    }

    @Test
    void passesEveryApprovedFilterToRepositoryWithoutJavaFilteringOrSorting() {
        UserAccount admin = user(UserRole.ADMIN);
        SensitiveEconomicActivityFilter filter =
                new SensitiveEconomicActivityFilter(
                        UUID.randomUUID(),
                        Instant.parse("2026-08-02T12:00:00Z"),
                        Instant.parse("2026-08-02T13:00:00Z"),
                        SensitiveEconomicEventType.PAYMENT_REMOVED,
                        UUID.randomUUID(),
                        UUID.randomUUID(),
                        UUID.randomUUID()
                );
        SensitiveEconomicActivityProjection first =
                mock(SensitiveEconomicActivityProjection.class);
        SensitiveEconomicActivityProjection second =
                mock(SensitiveEconomicActivityProjection.class);
        SensitiveEconomicActivityResponseDTO firstResponse = response();
        SensitiveEconomicActivityResponseDTO secondResponse = response();
        when(currentUserAccountService.getCurrentUserAccount())
                .thenReturn(admin);
        when(readRepository.findActivity(filter))
                .thenReturn(List.of(first, second));
        when(mapper.map(first)).thenReturn(firstResponse);
        when(mapper.map(second)).thenReturn(secondResponse);

        List<SensitiveEconomicActivityResponseDTO> result =
                service.getActivity(filter);

        assertEquals(List.of(firstResponse, secondResponse), result);
        ArgumentCaptor<SensitiveEconomicActivityFilter> captor =
                ArgumentCaptor.forClass(SensitiveEconomicActivityFilter.class);
        verify(readRepository).findActivity(captor.capture());
        assertSame(filter, captor.getValue());
    }

    @Test
    void rejectsAuthorizationAndInvalidRangesBeforeRepositoryDelegation() {
        UserAccount staff = user(UserRole.STAFF);
        when(currentUserAccountService.getCurrentUserAccount())
                .thenReturn(staff);
        doThrow(new ForbiddenException("admin only"))
                .when(authorizationPolicy).authorizeRead(staff);

        assertThrows(ForbiddenException.class, () -> service.getActivity(null));
        verifyNoInteractions(readRepository);

        UserAccount admin = user(UserRole.ADMIN);
        when(currentUserAccountService.getCurrentUserAccount())
                .thenReturn(admin);
        Instant instant = Instant.parse("2026-08-02T12:00:00Z");

        assertThrows(BadRequestException.class, () -> service.getActivity(
                new SensitiveEconomicActivityFilter(
                        null, instant, instant, null, null, null, null
                )
        ));
        verify(readRepository, never()).findActivity(
                new SensitiveEconomicActivityFilter(
                        null, instant, instant, null, null, null, null
                )
        );
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

    private UserAccount user(UserRole role) {
        return UserAccount.builder()
                .id(UUID.randomUUID())
                .username(role.name())
                .role(role)
                .build();
    }

    private SensitiveEconomicActivityResponseDTO response() {
        return new NightlyRateChangedActivityDTO(
                UUID.randomUUID(),
                SensitiveEconomicEventType.NIGHTLY_RATE_CHANGED,
                Instant.parse("2026-08-02T12:00:00Z"),
                new SensitiveActorDTO(UUID.randomUUID(), "admin"),
                null,
                NightlyReferenceRateCategory.ONE_CAT,
                new BigDecimal("10"),
                new BigDecimal("11")
        );
    }
}
