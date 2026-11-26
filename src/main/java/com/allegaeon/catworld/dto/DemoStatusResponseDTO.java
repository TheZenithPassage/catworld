package com.allegaeon.catworld.dto;

import java.time.Instant;

public record DemoStatusResponseDTO(
        boolean hasAdditionalAccounts,
        Instant nextScheduledCheckAt,
        ResetState resetState,
        Instant resetAvailableAt
) {
    public enum ResetState {
        AVAILABLE, CLEAN, QUEUED, COOLDOWN, LIMIT_REACHED
    }
}
