package com.allegaeon.catworld.service;

import com.allegaeon.catworld.dto.UserAccountCreateRequestDTO;
import com.allegaeon.catworld.dto.UserAccountResponseDTO;
import com.allegaeon.catworld.exception.BadRequestException;
import com.allegaeon.catworld.exception.ConflictException;
import com.allegaeon.catworld.exception.ForbiddenException;
import com.allegaeon.catworld.exception.ResourceNotFoundException;
import com.allegaeon.catworld.mapper.UserAccountMapper;
import com.allegaeon.catworld.model.UserAccount;
import com.allegaeon.catworld.model.UserRole;
import com.allegaeon.catworld.repository.CatRepository;
import com.allegaeon.catworld.repository.OwnerRepository;
import com.allegaeon.catworld.repository.StayRepository;
import com.allegaeon.catworld.repository.UserAccountRepository;
import com.allegaeon.catworld.repository.VetRepository;
import com.allegaeon.catworld.security.CurrentUserAccountService;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Locale;
import java.util.Objects;
import java.util.UUID;

@RequiredArgsConstructor
@Service
public class UserAccountService implements IUserAccountService {

    private final UserAccountRepository userAccountRepository;
    private final UserAccountMapper userAccountMapper;
    private final PasswordEncoder passwordEncoder;
    private final CurrentUserAccountService currentUserAccountService;
    private final OwnerRepository ownerRepository;
    private final CatRepository catRepository;
    private final VetRepository vetRepository;
    private final StayRepository stayRepository;

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
        getEntity(id);
        if (role == UserRole.STAFF) {
            validateAnotherEnabledAdminExists(id);
        }

        userAccountRepository.updateRole(id, role, Instant.now());
        return userAccountMapper.toResponseDTO(getEntity(id));
    }

    @Override
    @Transactional
    public UserAccountResponseDTO changeEnabled(UUID id, boolean enabled) {
        getEntity(id);
        if (!enabled) {
            validateAnotherEnabledAdminExists(id);
        }

        userAccountRepository.updateEnabled(id, enabled, Instant.now());
        return userAccountMapper.toResponseDTO(getEntity(id));
    }

    @Override
    @Transactional
    public void deleteUser(UUID id) {
        UserAccount target = getEntity(id);
        UserAccount currentUser = currentUserAccountService.getCurrentUserAccount();

        if (Objects.equals(target.getId(), currentUser.getId())) {
            throw new ForbiddenException("Administrators cannot delete their own account");
        }

        if (hasCreatorReferences(id)) {
            throw new ConflictException("User account cannot be deleted while operational records reference it");
        }

        validateAnotherEnabledAdminExists(target.getId());

        try {
            userAccountRepository.delete(target);
            userAccountRepository.flush();
        } catch (DataIntegrityViolationException | OptimisticLockingFailureException exception) {
            throw new ConflictException("User account cannot be deleted because of a data conflict");
        }
    }

    private UserAccount getEntity(UUID id) {
        return userAccountRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User account", id));
    }

    private void validateAnotherEnabledAdminExists(UUID targetId) {
        boolean anotherEnabledAdminExists =
                userAccountRepository.findEnabledByRoleForUpdate(UserRole.ADMIN).stream()
                        .anyMatch(administrator -> !Objects.equals(administrator.getId(), targetId));

        if (!anotherEnabledAdminExists) {
            throw new ConflictException("At least one enabled ADMIN account is required");
        }
    }

    private boolean hasCreatorReferences(UUID id) {
        return ownerRepository.existsByCreatedBy_Id(id)
                || catRepository.existsByCreatedBy_Id(id)
                || vetRepository.existsByCreatedBy_Id(id)
                || stayRepository.existsByCreatedBy_Id(id);
    }

    private String normalizeUsername(String username) {
        if (username == null || username.isBlank()) {
            throw new BadRequestException("Username is required");
        }
        return username.trim().toLowerCase(Locale.ROOT);
    }
}
