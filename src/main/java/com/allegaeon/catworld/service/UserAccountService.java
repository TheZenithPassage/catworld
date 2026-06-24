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
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Locale;
import java.util.UUID;

@RequiredArgsConstructor
@Service
public class UserAccountService implements IUserAccountService {

    private final UserAccountRepository userAccountRepository;
    private final UserAccountMapper userAccountMapper;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional(readOnly = true)
    public List<UserAccountResponseDTO> getAllUsers() {
        return userAccountRepository.findAll().stream()
                .map(userAccountMapper::toResponseDTO)
                .toList();
    }

    @Override
    @Transactional
    public UserAccountResponseDTO createUser(UserAccountCreateRequestDTO request) {
        String username = normalizeUsername(request.getUsername());
        if (userAccountRepository.existsByUsername(username)) {
            throw new ConflictException("User account with username " + username + " already exists");
        }

        UserAccount userAccount = userAccountMapper.toEntity(
                request,
                username,
                passwordEncoder.encode(request.getPassword())
        );

        try {
            return userAccountMapper.toResponseDTO(userAccountRepository.saveAndFlush(userAccount));
        } catch (DataIntegrityViolationException exception) {
            throw new ConflictException("User account with username " + username + " already exists");
        }
    }

    @Override
    @Transactional
    public UserAccountResponseDTO changeRole(UUID id, UserRole role) {
        UserAccount userAccount = getEntity(id);
        if (userAccount.getRole() == UserRole.ADMIN && userAccount.isEnabled() && role == UserRole.STAFF) {
            validateAnotherEnabledAdminExists();
        }

        userAccount.setRole(role);
        return userAccountMapper.toResponseDTO(userAccount);
    }

    @Override
    @Transactional
    public UserAccountResponseDTO changeEnabled(UUID id, boolean enabled) {
        UserAccount userAccount = getEntity(id);
        if (userAccount.getRole() == UserRole.ADMIN && userAccount.isEnabled() && !enabled) {
            validateAnotherEnabledAdminExists();
        }

        userAccount.setEnabled(enabled);
        return userAccountMapper.toResponseDTO(userAccount);
    }

    private UserAccount getEntity(UUID id) {
        return userAccountRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User account", id));
    }

    private void validateAnotherEnabledAdminExists() {
        if (userAccountRepository.findEnabledByRoleForUpdate(UserRole.ADMIN).size() <= 1) {
            throw new ConflictException("At least one enabled ADMIN account is required");
        }
    }

    private String normalizeUsername(String username) {
        if (username == null || username.isBlank()) {
            throw new BadRequestException("Username is required");
        }
        return username.trim().toLowerCase(Locale.ROOT);
    }
}
