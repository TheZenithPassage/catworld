package com.allegaeon.catworld.service;

import com.allegaeon.catworld.exception.ForbiddenException;
import com.allegaeon.catworld.model.UserAccount;
import com.allegaeon.catworld.model.UserRole;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;

import java.util.stream.Stream;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class NightlyReferenceRateAuthorizationPolicyTest {

    private final NightlyReferenceRateAuthorizationPolicy policy =
            new NightlyReferenceRateAuthorizationPolicy();

    @ParameterizedTest(name = "{0}")
    @MethodSource("authorizationCases")
    void appliesCompleteReadAndMutationMatrix(
            String description,
            UserAccount currentUser,
            boolean readAllowed,
            boolean mutationAllowed) {
        assertEquals(readAllowed, policy.canRead(currentUser), description);
        assertEquals(mutationAllowed, policy.canMutate(currentUser), description);

        if (readAllowed) {
            assertDoesNotThrow(() -> policy.authorizeRead(currentUser), description);
        } else {
            assertThrows(ForbiddenException.class, () -> policy.authorizeRead(currentUser), description);
        }

        if (mutationAllowed) {
            assertDoesNotThrow(() -> policy.authorizeMutation(currentUser), description);
        } else {
            assertThrows(
                    ForbiddenException.class,
                    () -> policy.authorizeMutation(currentUser),
                    description
            );
        }
    }

    private static Stream<Arguments> authorizationCases() {
        return Stream.of(
                Arguments.of("ADMIN can read and mutate", account(UserRole.ADMIN), true, true),
                Arguments.of("STAFF can read but cannot mutate", account(UserRole.STAFF), true, false),
                Arguments.of("missing account cannot read or mutate", null, false, false)
        );
    }

    private static UserAccount account(UserRole role) {
        return UserAccount.builder()
                .username(role.name().toLowerCase())
                .role(role)
                .build();
    }
}
