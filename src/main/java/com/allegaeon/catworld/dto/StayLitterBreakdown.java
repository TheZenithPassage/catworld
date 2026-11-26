package com.allegaeon.catworld.dto;

import com.allegaeon.catworld.model.LitterChoice;
import com.fasterxml.jackson.annotation.JsonFormat;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public record StayLitterBreakdown(
        @JsonFormat(shape = JsonFormat.Shape.STRING) BigDecimal ratePerKg,
        @JsonFormat(shape = JsonFormat.Shape.STRING) BigDecimal subtotal,
        boolean rateUnavailable,
        List<CatLitter> cats) {

    public record CatLitter(
            UUID catId,
            LitterChoice choice,
            @JsonFormat(shape = JsonFormat.Shape.STRING) BigDecimal kgPerDay,
            @JsonFormat(shape = JsonFormat.Shape.STRING) BigDecimal totalKg,
            @JsonFormat(shape = JsonFormat.Shape.STRING) BigDecimal suggestedAmount) {}
}
