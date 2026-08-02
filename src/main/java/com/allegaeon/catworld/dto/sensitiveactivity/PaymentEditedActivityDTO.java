package com.allegaeon.catworld.dto.sensitiveactivity;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record PaymentEditedActivityDTO(
        UUID eventId,
        SensitiveEconomicEventType eventType,
        Instant occurredAt,
        SensitiveActorDTO actor,
        SensitiveStayContextDTO affectedContext,
        UUID paymentId,
        BigDecimal previousAmount,
        BigDecimal newAmount,
        LocalDate paymentDate,
        String note,
        SensitiveActorDTO registeredBy,
        Instant registeredAt,
        String reason)
        implements SensitiveEconomicActivityResponseDTO {
}
