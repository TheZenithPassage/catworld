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
import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PaymentRegistrationRequestDTO {

    @NotNull(message = "Payment amount is required")
    @DecimalMin(
            value = "0",
            inclusive = false,
            message = "Payment amount must be greater than zero"
    )
    private BigDecimal amount;

    @NotNull(message = "Payment date is required")
    private LocalDate paymentDate;

    private String note;

    @AssertTrue(
            message = "Payment amount must be a positive whole number with at most 19 digits"
    )
    @JsonIgnore
    public boolean isAmountSupported() {
        return amount == null || WholeMonetaryAmount.isSupported(amount);
    }
}
