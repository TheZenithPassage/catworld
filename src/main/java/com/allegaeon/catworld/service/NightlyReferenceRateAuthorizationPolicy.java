package com.allegaeon.catworld.service;

import com.allegaeon.catworld.exception.ForbiddenException;
import com.allegaeon.catworld.model.UserAccount;
import com.allegaeon.catworld.model.UserRole;
import org.springframework.stereotype.Service;

@Service
public class NightlyReferenceRateAuthorizationPolicy {

    public void authorizeRead(UserAccount currentUser) {
        if (!canRead(currentUser)) {
            throw new ForbiddenException("Current user cannot read nightly reference rates");
        }
    }

    public void authorizeMutation(UserAccount currentUser) {
        if (!canMutate(currentUser)) {
            throw new ForbiddenException("Only administrators can change nightly reference rates");
        }
    }

    public boolean canRead(UserAccount currentUser) {
        return currentUser != null
                && (currentUser.getRole() == UserRole.ADMIN || currentUser.getRole() == UserRole.STAFF);
    }

    public boolean canMutate(UserAccount currentUser) {
        return currentUser != null && currentUser.getRole() == UserRole.ADMIN;
    }
}
