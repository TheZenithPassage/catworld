package com.allegaeon.catworld.dto;

import com.allegaeon.catworld.model.UserRole;

public record AuthUserResponseDTO(String username, UserRole role) {
}
