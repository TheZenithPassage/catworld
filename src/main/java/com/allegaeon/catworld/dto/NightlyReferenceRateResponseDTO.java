package com.allegaeon.catworld.dto;

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
public class NightlyReferenceRateResponseDTO {

    private int catCount;
    private BigDecimal nightlyRate;
}
