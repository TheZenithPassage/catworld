package com.allegaeon.catworld.service;

import com.allegaeon.catworld.exception.ForbiddenException;
import com.allegaeon.catworld.model.UserAccount;
import com.allegaeon.catworld.model.UserRole;
import org.springframework.stereotype.Service;

@Service
public class StayPricingAuthorizationPolicy {

    public void authorizeCreation(UserAccount currentUser) {
        if (!canCreate(currentUser)) {
            throw new ForbiddenException("Current user cannot confirm stay pricing");
        }
    }

    public void authorizeNightCountChange(UserAccount currentUser) {
        if (!canChangeNightCount(currentUser)) {
            throw new ForbiddenException(
                    "Only administrators can change a stay's number of nights"
            );
        }
    }

    public void authorizeAgreedAmountCorrection(UserAccount currentUser) {
        if (!canCorrectAgreedAmount(currentUser)) {
            throw new ForbiddenException(
                    "Only administrators can correct a stay's agreed amount"
            );
        }
    }

    public boolean canCreate(UserAccount currentUser) {
        return currentUser != null
                && (currentUser.getRole() == UserRole.ADMIN
                || currentUser.getRole() == UserRole.STAFF);
    }

    public boolean canChangeNightCount(UserAccount currentUser) {
        return currentUser != null && currentUser.getRole() == UserRole.ADMIN;
    }

    public boolean canCorrectAgreedAmount(UserAccount currentUser) {
        return currentUser != null && currentUser.getRole() == UserRole.ADMIN;
    }
}
