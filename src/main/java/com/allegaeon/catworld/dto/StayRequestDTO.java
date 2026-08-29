package com.allegaeon.catworld.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.time.LocalDateTime;
import java.util.Set;
import java.util.UUID;

@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StayRequestDTO {

    @NotNull(message = "startAt is required")
    private LocalDateTime startAt;

    @NotNull(message = "endAt is required")
    private LocalDateTime endAt;

    @Size(max = 10000, message = "Notes must not exceed 10000 characters")
    private String notes;

    @NotEmpty(message = "At least one cat id is required")
    private Set<UUID> catIds;

    private boolean overrideVaccineConflicts;

    @Valid
    @NotNull(message = "pricingDecision is required")
    private PricingDecisionRequestDTO pricingDecision;

    @Valid
    @NotNull(message = "confirmation is required")
    private CreationPricingConfirmationDTO confirmation;

}
