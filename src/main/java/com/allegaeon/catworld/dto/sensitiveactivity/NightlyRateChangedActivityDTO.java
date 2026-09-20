package com.allegaeon.catworld.dto.sensitiveactivity;

import com.allegaeon.catworld.model.NightlyReferenceRateKey;
import com.fasterxml.jackson.annotation.JsonFormat;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record NightlyRateChangedActivityDTO(
        UUID eventId,
        SensitiveEconomicEventType eventType,
        Instant occurredAt,
        SensitiveActorDTO actor,
        SensitiveStayContextDTO affectedContext,
        NightlyReferenceRateKey category,
        @JsonFormat(shape = JsonFormat.Shape.STRING) BigDecimal previousRate,
        @JsonFormat(shape = JsonFormat.Shape.STRING) BigDecimal newRate)
        implements SensitiveEconomicActivityResponseDTO {
}
