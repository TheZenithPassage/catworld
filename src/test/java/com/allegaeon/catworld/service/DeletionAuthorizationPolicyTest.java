package com.allegaeon.catworld.service;

import com.allegaeon.catworld.exception.ForbiddenException;
import com.allegaeon.catworld.model.UserAccount;
import com.allegaeon.catworld.model.UserRole;
import com.allegaeon.catworld.security.CurrentUserAccountService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.UUID;
import java.util.stream.Stream;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

class DeletionAuthorizationPolicyTest {

    private static final Instant NOW = Instant.parse("2026-07-05T12:00:00Z");
    private static final UUID CURRENT_USER_ID = UUID.fromString("00000000-0000-0000-0000-000000000001");
    private static final UUID OTHER_USER_ID = UUID.fromString("00000000-0000-0000-0000-000000000002");

    private final CurrentUserAccountService currentUserAccountService = mock(CurrentUserAccountService.class);
    private final DeletionAuthorizationPolicy policy = new DeletionAuthorizationPolicy(
            currentUserAccountService,
            Clock.fixed(NOW, ZoneOffset.UTC));

    @ParameterizedTest(name = "{0}")
    @MethodSource("authorizationCases")
    void authorizeAppliesSharedDeletionMatrix(
            String description,
            UserAccount currentUser,
            UserAccount creator,
            Instant createdAt,
            boolean authorized) {
        when(currentUserAccountService.getCurrentUserAccount()).thenReturn(currentUser);

        assertEquals(authorized, policy.canDelete(creator, createdAt), description);

        if (authorized) {
            assertDoesNotThrow(() -> policy.authorize(creator, createdAt), description);
        } else {
            assertThrows(ForbiddenException.class, () -> policy.authorize(creator, createdAt), description);
        }
    }

    @Test
    void authorizeAllowsAdminEvenWhenCreatorAndCreatedAtAreUnavailable() {
        when(currentUserAccountService.getCurrentUserAccount()).thenReturn(account(CURRENT_USER_ID, UserRole.ADMIN));

        assertTrue(policy.canDelete(null, null));
        assertDoesNotThrow(() -> policy.authorize(null, null));
    }

    @Test
    void canDeleteWithResolvedCurrentUserDoesNotPerformAnotherAccountLookup() {
        UserAccount currentUser = account(CURRENT_USER_ID, UserRole.STAFF);
        UserAccount creator = account(CURRENT_USER_ID, UserRole.STAFF);

        assertTrue(policy.canDelete(
                currentUser,
                creator,
                NOW.minus(Duration.ofMinutes(14))));

        verifyNoInteractions(currentUserAccountService);
    }

    private static Stream<Arguments> authorizationCases() {
        UserAccount admin = account(CURRENT_USER_ID, UserRole.ADMIN);
        UserAccount staff = account(CURRENT_USER_ID, UserRole.STAFF);
        UserAccount creator = account(CURRENT_USER_ID, UserRole.STAFF);
        UserAccount otherCreator = account(OTHER_USER_ID, UserRole.STAFF);

        return Stream.of(
                Arguments.of(
                        "ADMIN is authorized regardless of creator and expired age",
                        admin,
                        otherCreator,
                        NOW.minus(Duration.ofHours(1)),
                        true),
                Arguments.of(
                        "STAFF is authorized for own record before the 15-minute boundary",
                        staff,
                        creator,
                        NOW.minus(Duration.ofMinutes(14)).minusSeconds(59),
                        true),
                Arguments.of(
                        "STAFF is denied for a different creator inside the window",
                        staff,
                        otherCreator,
                        NOW.minus(Duration.ofMinutes(1)),
                        false),
                Arguments.of(
                        "STAFF is denied at exactly the 15-minute boundary",
                        staff,
                        creator,
                        NOW.minus(Duration.ofMinutes(15)),
                        false),
                Arguments.of(
                        "STAFF is denied after the 15-minute boundary",
                        staff,
                        creator,
                        NOW.minus(Duration.ofMinutes(15)).minusSeconds(1),
                        false));
    }

    private static UserAccount account(UUID id, UserRole role) {
        return UserAccount.builder()
                .id(id)
                .username(id.toString())
                .role(role)
                .build();
    }
}
