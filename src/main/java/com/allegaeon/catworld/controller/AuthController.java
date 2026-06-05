package com.allegaeon.catworld.controller;

import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class AuthController {

    @PostMapping("/api/auth/login")
    public AuthUserResponse login(Authentication authentication) {
        return new AuthUserResponse(authentication.getName());
    }

    public record AuthUserResponse(String username) {
    }
}