package com.allegaeon.catworld.mapper;

import com.allegaeon.catworld.dto.UserAccountCreateRequestDTO;
import com.allegaeon.catworld.dto.UserAccountResponseDTO;
import com.allegaeon.catworld.model.UserAccount;
import org.springframework.stereotype.Component;

@Component
public class UserAccountMapper {

    public UserAccount toEntity(
            UserAccountCreateRequestDTO request,
            String normalizedUsername,
            String encodedPassword) {
        return UserAccount.builder()
                .username(normalizedUsername)
                .passwordHash(encodedPassword)
                .role(request.getRole())
                .enabled(true)
                .build();
    }

    public UserAccountResponseDTO toResponseDTO(UserAccount userAccount) {
        return UserAccountResponseDTO.builder()
                .id(userAccount.getId())
                .username(userAccount.getUsername())
                .role(userAccount.getRole())
                .enabled(userAccount.isEnabled())
                .build();
    }
}
