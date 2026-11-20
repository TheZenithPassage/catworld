package com.allegaeon.catworld.dto;

import com.allegaeon.catworld.model.LitterChoice;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StayUpdateDTO {

    @NotNull(message = "startAt is required")
    private LocalDateTime startAt;

    @NotNull(message = "endAt is required")
    private LocalDateTime endAt;

    @Size(max = 10000, message = "Notes must not exceed 10000 characters")
    private String notes;

    private boolean overrideVaccineConflicts;
    private Boolean arrivalTransferRequired;
    private Boolean departureTransferRequired;
    private Boolean transferWaived;
    private Map<UUID, LitterChoice> litterChoices;

    @Valid
    private PricingDecisionRequestDTO pricingDecision;

    @Valid
    private ExistingStayPricingConfirmationDTO confirmation;

}
