package com.allegaeon.catworld.service;

import com.allegaeon.catworld.dto.NightlyReferenceRateResponseDTO;

import java.math.BigDecimal;
import java.util.List;

public interface INightlyReferenceRateService {

    List<NightlyReferenceRateResponseDTO> getCurrentRates();

    NightlyReferenceRateResponseDTO configureRate(
            int minimumCatCount,
            BigDecimal nightlyRate);

    void clearRate(int minimumCatCount);
}
