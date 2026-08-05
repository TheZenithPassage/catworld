package com.allegaeon.catworld.dto.sensitiveactivity;

import com.fasterxml.jackson.annotation.JsonFormat;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record AgreedAmountCorrectedActivityDTO(
        UUID eventId,
        SensitiveEconomicEventType eventType,
        Instant occurredAt,
        SensitiveActorDTO actor,
        SensitiveStayContextDTO affectedContext,
        @JsonFormat(shape = JsonFormat.Shape.STRING) BigDecimal previousAgreedAmount,
        @JsonFormat(shape = JsonFormat.Shape.STRING) BigDecimal newAgreedAmount,
        String reason)
        implements SensitiveEconomicActivityResponseDTO {
}
