package com.allegaeon.catworld.dto;

import com.allegaeon.catworld.model.LitterChoice;

import java.util.Map;
import java.util.UUID;

public record PendingPricePreviewRequestDTO(Map<UUID, LitterChoice> litterChoices, Boolean adoptCurrentLitterRate) {
    public boolean adoptsCurrentLitterRate() {
        return Boolean.TRUE.equals(adoptCurrentLitterRate);
    }
}
