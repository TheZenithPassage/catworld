package com.allegaeon.catworld.service;

import com.allegaeon.catworld.exception.ForbiddenException;
import com.allegaeon.catworld.model.UserAccount;
import com.allegaeon.catworld.model.UserRole;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class StayPricingAuthorizationPolicyTest {

    private final StayPricingAuthorizationPolicy policy =
            new StayPricingAuthorizationPolicy();

    @Test
    void adminAndStaffCanConfirmPricingAtCreation() {
        assertTrue(policy.canCreate(account(UserRole.ADMIN)));
        assertTrue(policy.canCreate(account(UserRole.STAFF)));
        assertDoesNotThrow(() -> policy.authorizeCreation(account(UserRole.ADMIN)));
        assertDoesNotThrow(() -> policy.authorizeCreation(account(UserRole.STAFF)));
        assertFalse(policy.canCreate(null));
        assertThrows(ForbiddenException.class, () -> policy.authorizeCreation(null));
    }

    @Test
    void onlyAdminCanCompleteNightCountChange() {
        assertTrue(policy.canChangeNightCount(account(UserRole.ADMIN)));
        assertFalse(policy.canChangeNightCount(account(UserRole.STAFF)));
        assertFalse(policy.canChangeNightCount(null));
        assertDoesNotThrow(
                () -> policy.authorizeNightCountChange(account(UserRole.ADMIN))
        );
        assertThrows(
                ForbiddenException.class,
                () -> policy.authorizeNightCountChange(account(UserRole.STAFF))
        );
        assertThrows(
                ForbiddenException.class,
                () -> policy.authorizeNightCountChange(null)
        );
    }

    @Test
    void onlyAdminCanCorrectAgreedAmount() {
        assertTrue(policy.canCorrectAgreedAmount(account(UserRole.ADMIN)));
        assertFalse(policy.canCorrectAgreedAmount(account(UserRole.STAFF)));
        assertFalse(policy.canCorrectAgreedAmount(null));
        assertDoesNotThrow(
                () -> policy.authorizeAgreedAmountCorrection(account(UserRole.ADMIN))
        );
        assertThrows(
                ForbiddenException.class,
                () -> policy.authorizeAgreedAmountCorrection(account(UserRole.STAFF))
        );
        assertThrows(
                ForbiddenException.class,
                () -> policy.authorizeAgreedAmountCorrection(null)
        );
    }

    private UserAccount account(UserRole role) {
        return UserAccount.builder().role(role).build();
    }
}
