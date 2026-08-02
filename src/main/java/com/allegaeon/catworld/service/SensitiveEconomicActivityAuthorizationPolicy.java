package com.allegaeon.catworld.service;

import com.allegaeon.catworld.exception.ForbiddenException;
import com.allegaeon.catworld.model.UserAccount;
import com.allegaeon.catworld.model.UserRole;
import org.springframework.stereotype.Service;

@Service
public class SensitiveEconomicActivityAuthorizationPolicy {

    public void authorizeRead(UserAccount currentUser) {
        if (currentUser == null || currentUser.getRole() != UserRole.ADMIN) {
            throw new ForbiddenException(
                    "Only administrators can view sensitive economic activity"
            );
        }
    }
}

