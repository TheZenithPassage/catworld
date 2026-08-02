package com.allegaeon.catworld.dto.sensitiveactivity;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record AgreedAmountCorrectedActivityDTO(
        UUID eventId,
        SensitiveEconomicEventType eventType,
        Instant occurredAt,
        SensitiveActorDTO actor,
        SensitiveStayContextDTO affectedContext,
        BigDecimal previousAgreedAmount,
        BigDecimal newAgreedAmount,
        String reason)
        implements SensitiveEconomicActivityResponseDTO {
}
