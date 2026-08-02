package com.allegaeon.catworld.dto.sensitiveactivity;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record PricingOverrideActivityDTO(
        UUID eventId,
        SensitiveEconomicEventType eventType,
        Instant occurredAt,
        SensitiveActorDTO actor,
        SensitiveStayContextDTO affectedContext,
        BigDecimal retainedNightlyRate,
        long numberOfNights,
        BigDecimal agreedAmount,
        String reason)
        implements SensitiveEconomicActivityResponseDTO {
}
