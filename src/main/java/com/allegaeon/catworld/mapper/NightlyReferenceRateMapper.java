package com.allegaeon.catworld.mapper;

import com.allegaeon.catworld.dto.NightlyReferenceRateResponseDTO;
import com.allegaeon.catworld.model.NightlyReferenceRate;
import org.springframework.stereotype.Component;

@Component
public class NightlyReferenceRateMapper {

    public NightlyReferenceRateResponseDTO toResponseDTO(NightlyReferenceRate rate) {
        return NightlyReferenceRateResponseDTO.builder()
                .key(rate.getKey())
                .nightlyRate(rate.getNightlyRate())
                .build();
    }
}
