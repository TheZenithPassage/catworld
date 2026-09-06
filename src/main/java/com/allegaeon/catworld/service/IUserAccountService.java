package com.allegaeon.catworld.service;

import com.allegaeon.catworld.dto.lookup.*;

import com.allegaeon.catworld.dto.UserAccountCreateRequestDTO;
import com.allegaeon.catworld.dto.UserAccountResponseDTO;
import com.allegaeon.catworld.model.UserRole;

import java.util.List;
import java.util.UUID;

public interface IUserAccountService {

    LookupPage<AccountLookupItem> searchUsers(String query, int page);
    AccountLookupItem getUserLookup(UUID id);
    List<UserAccountResponseDTO> getAllUsers();
    UserAccountResponseDTO createUser(UserAccountCreateRequestDTO request);
    UserAccountResponseDTO changeRole(UUID id, UserRole role);
    UserAccountResponseDTO changeEnabled(UUID id, boolean enabled);
    void deleteUser(UUID id);
}
