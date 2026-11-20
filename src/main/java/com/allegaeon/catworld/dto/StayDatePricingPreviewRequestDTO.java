package com.allegaeon.catworld.dto;

import com.allegaeon.catworld.model.LitterChoice;
import jakarta.validation.constraints.NotNull;
import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class StayDatePricingPreviewRequestDTO {
    @NotNull(message = "startAt is required")
    private LocalDateTime startAt;
    @NotNull(message = "endAt is required")
    private LocalDateTime endAt;
    private Boolean arrivalTransferRequired;
    private Boolean departureTransferRequired;
    private Boolean transferWaived;
    private Map<UUID, LitterChoice> litterChoices;
    @JsonFormat(shape = JsonFormat.Shape.STRING)
    private java.math.BigDecimal selectedNightlyRate;
    @JsonFormat(shape = JsonFormat.Shape.STRING)
    private java.math.BigDecimal selectedTransferRate;
}
