package com.allegaeon.catworld.controller;

import com.allegaeon.catworld.dto.AuthUserResponseDTO;
import com.allegaeon.catworld.model.UserRole;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Arrays;

@RestController
public class AuthController {

    @PostMapping("/api/auth/login")
    public AuthUserResponseDTO login(Authentication authentication) {
        UserRole role = Arrays.stream(UserRole.values())
                .filter(candidate -> authentication.getAuthorities().stream()
                        .anyMatch(authority -> authority.getAuthority().equals("ROLE_" + candidate.name())))
                .findFirst()
                .orElseThrow(() -> new IllegalStateException("Authenticated user has no supported role"));

        return new AuthUserResponseDTO(authentication.getName(), role);
    }
}
