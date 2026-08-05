package com.allegaeon.catworld.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class StayDatePricingPreviewRequestDTO {
    @NotNull(message = "startAt is required")
    private LocalDateTime startAt;
    @NotNull(message = "endAt is required")
    private LocalDateTime endAt;
}
