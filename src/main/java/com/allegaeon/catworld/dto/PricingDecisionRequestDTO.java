package com.allegaeon.catworld.dto;

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

    private static final int MAX_MONETARY_INTEGER_DIGITS = 19;

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

        BigDecimal normalized = agreedAmount.stripTrailingZeros();
        int fractionalDigits = Math.max(normalized.scale(), 0);
        int integerDigits = Math.max(
                normalized.precision() - normalized.scale(),
                0
        );
        return fractionalDigits == 0
                && integerDigits <= MAX_MONETARY_INTEGER_DIGITS;
    }
}
