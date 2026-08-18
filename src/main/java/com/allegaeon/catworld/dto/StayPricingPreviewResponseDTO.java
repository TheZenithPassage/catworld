package com.allegaeon.catworld.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;

@Getter
@Builder
public class StayPricingPreviewResponseDTO {
    private long numberOfNights;
    @JsonFormat(shape = JsonFormat.Shape.STRING)
    private BigDecimal retainedNightlyRate;
    @JsonFormat(shape = JsonFormat.Shape.STRING)
    private BigDecimal suggestedAmount;
    private CreationPricingConfirmationDTO confirmation;
}
