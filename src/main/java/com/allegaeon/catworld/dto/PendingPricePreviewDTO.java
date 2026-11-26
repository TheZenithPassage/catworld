package com.allegaeon.catworld.dto;

import com.fasterxml.jackson.annotation.JsonFormat;

import java.math.BigDecimal;

public record PendingPricePreviewDTO(
        String version,
        boolean previouslyAgreed,
        long numberOfNights,
        @JsonFormat(shape = JsonFormat.Shape.STRING) BigDecimal retainedNightlyRate,
        @JsonFormat(shape = JsonFormat.Shape.STRING) BigDecimal accommodationSuggestedAmount,
        boolean arrivalTransferRequired,
        boolean departureTransferRequired,
        boolean transferWaived,
        @JsonFormat(shape = JsonFormat.Shape.STRING) BigDecimal retainedTransferRate,
        @JsonFormat(shape = JsonFormat.Shape.STRING) BigDecimal transferSuggestedAmount,
        @JsonFormat(shape = JsonFormat.Shape.STRING) BigDecimal suggestedAmount,
        StayLitterBreakdown litter
) {}
