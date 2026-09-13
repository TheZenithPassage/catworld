package com.allegaeon.catworld.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;

@Getter @Builder
public class StayDatePricingPreviewResponseDTO {
    private boolean pricingDecisionRequired;
    private long currentNumberOfNights;
    @JsonFormat(shape = JsonFormat.Shape.STRING)
    private BigDecimal currentAgreedAmount;
    private long numberOfNights;
    @JsonFormat(shape = JsonFormat.Shape.STRING)
    private BigDecimal retainedNightlyRate;
    @JsonFormat(shape = JsonFormat.Shape.STRING)
    private BigDecimal accommodationSuggestedAmount;
    @JsonFormat(shape = JsonFormat.Shape.STRING)
    private BigDecimal suggestedAmount;
    private boolean arrivalTransferRequired;
    private boolean departureTransferRequired;
    private boolean transferWaived;
    @JsonFormat(shape = JsonFormat.Shape.STRING) private BigDecimal retainedTransferRate;
    @JsonFormat(shape = JsonFormat.Shape.STRING) private BigDecimal transferSuggestedAmount;
    private boolean transferRateUnavailable;
    private ExistingStayPricingConfirmationDTO confirmation;
}
