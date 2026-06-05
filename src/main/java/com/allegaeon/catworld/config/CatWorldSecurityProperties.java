package com.allegaeon.catworld.config;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

import java.util.List;

@Validated
@ConfigurationProperties(prefix = "catworld.security")
public record CatWorldSecurityProperties(
        @NotBlank String username,
        @NotBlank String password,
        @NotEmpty List<String> corsAllowedOrigins
) {
}