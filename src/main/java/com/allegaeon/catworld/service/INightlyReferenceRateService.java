package com.allegaeon.catworld.service;

import com.allegaeon.catworld.dto.NightlyReferenceRateResponseDTO;
import com.allegaeon.catworld.model.NightlyReferenceRateKey;

import java.math.BigDecimal;
import java.util.List;

public interface INightlyReferenceRateService {

    List<NightlyReferenceRateResponseDTO> getCurrentRates();

    NightlyReferenceRateResponseDTO configureRate(
            NightlyReferenceRateKey key,
            BigDecimal nightlyRate);

    void clearRate(NightlyReferenceRateKey key);
}
