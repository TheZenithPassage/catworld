package com.allegaeon.catworld.dto;

import com.allegaeon.catworld.validation.WholeMonetaryAmount;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
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

    @NotNull(message = "Agreed amount is required and must be a non-negative whole number")
    @DecimalMin(
            value = "0",
            message = "Agreed amount must be a non-negative whole number"
    )
    private BigDecimal agreedAmount;

    private String reason;

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
