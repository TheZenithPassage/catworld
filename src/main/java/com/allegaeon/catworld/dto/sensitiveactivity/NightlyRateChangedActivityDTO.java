package com.allegaeon.catworld.dto.sensitiveactivity;

import com.allegaeon.catworld.model.NightlyReferenceRateCategory;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record NightlyRateChangedActivityDTO(
        UUID eventId,
        SensitiveEconomicEventType eventType,
        Instant occurredAt,
        SensitiveActorDTO actor,
        SensitiveStayContextDTO affectedContext,
        NightlyReferenceRateCategory category,
        BigDecimal previousRate,
        BigDecimal newRate)
        implements SensitiveEconomicActivityResponseDTO {
}

