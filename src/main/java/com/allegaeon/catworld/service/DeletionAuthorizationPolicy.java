package com.allegaeon.catworld.service;

import com.allegaeon.catworld.exception.ForbiddenException;
import com.allegaeon.catworld.model.UserAccount;
import com.allegaeon.catworld.model.UserRole;
import com.allegaeon.catworld.security.CurrentUserAccountService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;

@RequiredArgsConstructor
@Service
public class DeletionAuthorizationPolicy {

    private static final Duration STAFF_DELETION_WINDOW = Duration.ofMinutes(15);

    private final CurrentUserAccountService currentUserAccountService;
    private final Clock clock;

    public void authorize(UserAccount creator, Instant createdAt) {
        UserAccount currentUser = currentUserAccountService.getCurrentUserAccount();

        if (currentUser.getRole() == UserRole.ADMIN) {
            return;
        }

        if (currentUser.getRole() == UserRole.STAFF
                && isSameAccount(currentUser, creator)
                && createdAt != null
                && createdAt.plus(STAFF_DELETION_WINDOW).isAfter(Instant.now(clock))) {
            return;
        }

        throw new ForbiddenException("Deletion is not allowed for this record");
    }

    private boolean isSameAccount(UserAccount currentUser, UserAccount creator) {
        return currentUser.getId() != null
                && creator != null
                && currentUser.getId().equals(creator.getId());
    }
}
