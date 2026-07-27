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

    @NotNull(message = "Nightly rate is required")
    @DecimalMin(
            value = "0.0",
            inclusive = false,
            message = "Nightly rate must be greater than zero"
    )
    @Digits(
            integer = 15,
            fraction = 4,
            message = "Nightly rate must have at most 15 integer and 4 fractional digits"
    )
    private BigDecimal nightlyRate;
}
