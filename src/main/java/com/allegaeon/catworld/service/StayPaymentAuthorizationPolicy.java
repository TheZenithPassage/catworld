package com.allegaeon.catworld.service;

import com.allegaeon.catworld.exception.ForbiddenException;
import com.allegaeon.catworld.model.StayStatus;
import com.allegaeon.catworld.model.UserAccount;
import com.allegaeon.catworld.model.UserRole;
import org.springframework.stereotype.Service;

@Service
public class StayPaymentAuthorizationPolicy {

    public void authorizeMutation(
            UserAccount currentUser,
            StayStatus stayStatus) {
        if (!canMutate(currentUser, stayStatus)) {
            throw new ForbiddenException(
                    "Current user cannot change payments for this stay status"
            );
        }
    }

    public boolean canMutate(
            UserAccount currentUser,
            StayStatus stayStatus) {
        if (currentUser == null || stayStatus == null) {
            return false;
        }
        if (currentUser.getRole() == UserRole.ADMIN) {
            return true;
        }
        return currentUser.getRole() == UserRole.STAFF
                && (stayStatus == StayStatus.RESERVED
                || stayStatus == StayStatus.CHECKED_IN);
    }
}
