package com.allegaeon.catworld.dto;

import jakarta.validation.constraints.NotNull;
import com.fasterxml.jackson.annotation.JsonFormat;
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
    private Boolean arrivalTransferRequired;
    private Boolean departureTransferRequired;
    private Boolean transferWaived;
    @JsonFormat(shape = JsonFormat.Shape.STRING)
    private java.math.BigDecimal selectedNightlyRate;
    @JsonFormat(shape = JsonFormat.Shape.STRING)
    private java.math.BigDecimal selectedTransferRate;
}
