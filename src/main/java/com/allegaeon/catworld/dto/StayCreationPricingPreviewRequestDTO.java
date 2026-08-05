package com.allegaeon.catworld.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.Set;
import java.util.UUID;

@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class StayCreationPricingPreviewRequestDTO {
    @NotNull(message = "startAt is required")
    private LocalDateTime startAt;
    @NotNull(message = "endAt is required")
    private LocalDateTime endAt;
    @NotEmpty(message = "At least one cat id is required")
    private Set<UUID> catIds;
}
