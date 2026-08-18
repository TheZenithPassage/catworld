package com.allegaeon.catworld.dto.sensitiveactivity;

import com.fasterxml.jackson.annotation.JsonFormat;
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
        @JsonFormat(shape = JsonFormat.Shape.STRING) BigDecimal previousRate,
        @JsonFormat(shape = JsonFormat.Shape.STRING) BigDecimal newRate)
        implements SensitiveEconomicActivityResponseDTO {
}
