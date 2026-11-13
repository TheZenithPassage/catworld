package com.allegaeon.catworld.dto;

import com.allegaeon.catworld.validation.WholeMonetaryAmount;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.DecimalMin;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PricingDecisionRequestDTO {

    @DecimalMin(
            value = "0",
            message = "Agreed amount must be a non-negative whole number"
    )
    private BigDecimal agreedAmount;

    @Getter(AccessLevel.NONE)
    private Boolean pricePending;
    private String reason;

    public boolean isPricePending() {
        return Boolean.TRUE.equals(pricePending);
    }

    @AssertTrue(message = "Choose either an agreed amount or a pending price")
    @JsonIgnore
    public boolean isPriceChoiceValid() {
        return isPricePending() == (agreedAmount == null);
    }

    @AssertTrue(
            message = "Agreed amount must be a non-negative whole number with at most 19 digits"
    )
    @JsonIgnore
    public boolean isAgreedAmountSupported() {
        if (agreedAmount == null) {
            return true;
        }

        return WholeMonetaryAmount.isSupported(agreedAmount);
    }
}
