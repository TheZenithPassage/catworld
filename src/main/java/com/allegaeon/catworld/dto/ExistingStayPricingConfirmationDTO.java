package com.allegaeon.catworld.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class ExistingStayPricingConfirmationDTO {
    @NotNull(message = "previousNumberOfNights is required")
    private Long previousNumberOfNights;
    @JsonFormat(shape = JsonFormat.Shape.STRING)
    private BigDecimal previousAgreedAmount;
    @NotNull(message = "numberOfNights is required")
    private Long numberOfNights;
    @JsonFormat(shape = JsonFormat.Shape.STRING)
    private BigDecimal retainedNightlyRate;
    @JsonFormat(shape = JsonFormat.Shape.STRING)
    private BigDecimal suggestedAmount;
    private Boolean arrivalTransferRequired;
    private Boolean departureTransferRequired;
    private Boolean transferWaived;
    @JsonFormat(shape = JsonFormat.Shape.STRING) private BigDecimal retainedTransferRate;
    @JsonFormat(shape = JsonFormat.Shape.STRING) private BigDecimal selectedTransferRate;
    @JsonFormat(shape = JsonFormat.Shape.STRING) private BigDecimal transferSuggestedAmount;
}
