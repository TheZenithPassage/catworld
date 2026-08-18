package com.allegaeon.catworld.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
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

    private int minimumCatCount;
    @JsonFormat(shape = JsonFormat.Shape.STRING)
    private BigDecimal nightlyRate;
}
