package com.allegaeon.catworld.service;

import com.allegaeon.catworld.exception.ForbiddenException;
import com.allegaeon.catworld.model.StayStatus;
import com.allegaeon.catworld.model.UserAccount;
import com.allegaeon.catworld.model.UserRole;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.junit.jupiter.api.Test;

import java.util.stream.Stream;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class StayPaymentAuthorizationPolicyTest {

    private final StayPaymentAuthorizationPolicy policy =
            new StayPaymentAuthorizationPolicy();

    @ParameterizedTest
    @MethodSource("roleStatusMatrix")
    void mutationPolicyOwnsCompleteRoleStatusMatrix(
            UserRole role,
            StayStatus status,
            boolean expected) {
        UserAccount account = UserAccount.builder().role(role).build();

        assertEquals(expected, policy.canMutate(account, status));
        if (expected) {
            assertDoesNotThrow(() -> policy.authorizeMutation(account, status));
        } else {
            assertThrows(
                    ForbiddenException.class,
                    () -> policy.authorizeMutation(account, status)
            );
        }
    }

    private static Stream<Arguments> roleStatusMatrix() {
        return Stream.of(UserRole.values())
                .flatMap(role -> Stream.of(StayStatus.values())
                        .map(status -> Arguments.of(
                                role,
                                status,
                                role == UserRole.ADMIN
                                        || status == StayStatus.RESERVED
                                        || status == StayStatus.CHECKED_IN
                        )));
    }

    @Test
    void onlyAdministratorsMayPermanentlyRemovePayments() {
        UserAccount admin = UserAccount.builder().role(UserRole.ADMIN).build();
        UserAccount staff = UserAccount.builder().role(UserRole.STAFF).build();

        assertDoesNotThrow(() -> policy.authorizeRemoval(admin));
        assertThrows(ForbiddenException.class, () -> policy.authorizeRemoval(staff));
        assertThrows(ForbiddenException.class, () -> policy.authorizeRemoval(null));
    }
}
