package com.allegaeon.catworld.dto.sensitiveactivity;

import com.fasterxml.jackson.annotation.JsonFormat;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record PaymentRemovedActivityDTO(
        UUID eventId,
        SensitiveEconomicEventType eventType,
        Instant occurredAt,
        SensitiveActorDTO actor,
        SensitiveStayContextDTO affectedContext,
        UUID paymentId,
        @JsonFormat(shape = JsonFormat.Shape.STRING) BigDecimal amount,
        LocalDate paymentDate,
        String note,
        SensitiveActorDTO registeredBy,
        Instant registeredAt,
        boolean annulled,
        String reason)
        implements SensitiveEconomicActivityResponseDTO {
}
