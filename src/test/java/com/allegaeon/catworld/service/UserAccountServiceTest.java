package com.allegaeon.catworld.service;

import com.allegaeon.catworld.dto.UserAccountCreateRequestDTO;
import com.allegaeon.catworld.dto.UserAccountResponseDTO;
import com.allegaeon.catworld.exception.BadRequestException;
import com.allegaeon.catworld.exception.ConflictException;
import com.allegaeon.catworld.exception.ResourceNotFoundException;
import com.allegaeon.catworld.mapper.UserAccountMapper;
import com.allegaeon.catworld.model.UserAccount;
import com.allegaeon.catworld.model.UserRole;
import com.allegaeon.catworld.repository.UserAccountRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.factory.PasswordEncoderFactories;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UserAccountServiceTest {

    @Mock
    private UserAccountRepository userAccountRepository;

    private final PasswordEncoder passwordEncoder = PasswordEncoderFactories.createDelegatingPasswordEncoder();
    private UserAccountService userAccountService;

    @BeforeEach
    void setUp() {
        userAccountService = new UserAccountService(
                userAccountRepository,
                new UserAccountMapper(),
                passwordEncoder
        );
    }

    @Test
    void createsEnabledUserWithNormalizedUsernameAndEncodedPassword() {
        UserAccountCreateRequestDTO request = UserAccountCreateRequestDTO.builder()
                .username(" New.Staff ")
                .password("plain-password")
                .role(UserRole.STAFF)
                .build();
        when(userAccountRepository.existsByUsername("new.staff")).thenReturn(false);
        when(userAccountRepository.saveAndFlush(any(UserAccount.class))).thenAnswer(invocation -> {
            UserAccount account = invocation.getArgument(0);
            account.setId(UUID.randomUUID());
            return account;
        });

        UserAccountResponseDTO response = userAccountService.createUser(request);

        ArgumentCaptor<UserAccount> accountCaptor = ArgumentCaptor.forClass(UserAccount.class);
        verify(userAccountRepository).saveAndFlush(accountCaptor.capture());
        UserAccount storedAccount = accountCaptor.getValue();
        assertEquals("new.staff", storedAccount.getUsername());
        assertEquals(UserRole.STAFF, storedAccount.getRole());
        assertTrue(storedAccount.isEnabled());
        assertNotEquals("plain-password", storedAccount.getPasswordHash());
        assertTrue(passwordEncoder.matches("plain-password", storedAccount.getPasswordHash()));
        assertEquals("new.staff", response.getUsername());
    }

    @Test
    void rejectsDuplicateNormalizedUsername() {
        UserAccountCreateRequestDTO request = UserAccountCreateRequestDTO.builder()
                .username(" Existing-User ")
                .password("password")
                .role(UserRole.STAFF)
                .build();
        when(userAccountRepository.existsByUsername("existing-user")).thenReturn(true);

        assertThrows(ConflictException.class, () -> userAccountService.createUser(request));

        verify(userAccountRepository, never()).saveAndFlush(any(UserAccount.class));
    }

    @Test
    void rejectsBlankUsernameAtServiceBoundary() {
        UserAccountCreateRequestDTO request = UserAccountCreateRequestDTO.builder()
                .username("   ")
                .password("password")
                .role(UserRole.STAFF)
                .build();

        assertThrows(BadRequestException.class, () -> userAccountService.createUser(request));

        verify(userAccountRepository, never()).existsByUsername(any());
    }

    @Test
    void preventsDemotingLastEnabledAdmin() {
        UserAccount administrator = account(UserRole.ADMIN, true);
        when(userAccountRepository.findById(administrator.getId())).thenReturn(Optional.of(administrator));
        when(userAccountRepository.findEnabledByRoleForUpdate(UserRole.ADMIN)).thenReturn(List.of(administrator));

        assertThrows(ConflictException.class,
                () -> userAccountService.changeRole(administrator.getId(), UserRole.STAFF));

        assertEquals(UserRole.ADMIN, administrator.getRole());
    }

    @Test
    void allowsDemotingAdminWhenAnotherEnabledAdminExists() {
        UserAccount administrator = account(UserRole.ADMIN, true);
        UserAccount otherAdministrator = account(UserRole.ADMIN, true);
        when(userAccountRepository.findById(administrator.getId())).thenReturn(Optional.of(administrator));
        when(userAccountRepository.findEnabledByRoleForUpdate(UserRole.ADMIN))
                .thenReturn(List.of(administrator, otherAdministrator));

        UserAccountResponseDTO response = userAccountService.changeRole(administrator.getId(), UserRole.STAFF);

        assertEquals(UserRole.STAFF, administrator.getRole());
        assertEquals(UserRole.STAFF, response.getRole());
    }

    @Test
    void preventsDisablingLastEnabledAdmin() {
        UserAccount administrator = account(UserRole.ADMIN, true);
        when(userAccountRepository.findById(administrator.getId())).thenReturn(Optional.of(administrator));
        when(userAccountRepository.findEnabledByRoleForUpdate(UserRole.ADMIN)).thenReturn(List.of(administrator));

        assertThrows(ConflictException.class,
                () -> userAccountService.changeEnabled(administrator.getId(), false));

        assertTrue(administrator.isEnabled());
    }

    @Test
    void allowsDisablingAdminWhenAnotherEnabledAdminExists() {
        UserAccount administrator = account(UserRole.ADMIN, true);
        UserAccount otherAdministrator = account(UserRole.ADMIN, true);
        when(userAccountRepository.findById(administrator.getId())).thenReturn(Optional.of(administrator));
        when(userAccountRepository.findEnabledByRoleForUpdate(UserRole.ADMIN))
                .thenReturn(List.of(administrator, otherAdministrator));

        UserAccountResponseDTO response = userAccountService.changeEnabled(administrator.getId(), false);

        assertFalse(administrator.isEnabled());
        assertFalse(response.isEnabled());
    }

    @Test
    void roleAndEnabledChangesReturnNotFoundForUnknownUser() {
        UUID missingId = UUID.randomUUID();
        when(userAccountRepository.findById(missingId)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class,
                () -> userAccountService.changeRole(missingId, UserRole.ADMIN));
        assertThrows(ResourceNotFoundException.class,
                () -> userAccountService.changeEnabled(missingId, true));
    }

    private UserAccount account(UserRole role, boolean enabled) {
        return UserAccount.builder()
                .id(UUID.randomUUID())
                .username(UUID.randomUUID().toString())
                .passwordHash("encoded-password")
                .role(role)
                .enabled(enabled)
                .build();
    }
}
