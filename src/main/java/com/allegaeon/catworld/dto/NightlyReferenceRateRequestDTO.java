package com.allegaeon.catworld.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
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
public class NightlyReferenceRateRequestDTO {

    @NotNull(message = "Nightly rate is required and must be a positive whole number")
    @DecimalMin(
            value = "0",
            inclusive = false,
            message = "Nightly rate must be a positive whole number"
    )
    @Digits(
            integer = 19,
            fraction = 0,
            message = "Nightly rate must be a positive whole number with at most 19 digits"
    )
    private BigDecimal nightlyRate;
}
