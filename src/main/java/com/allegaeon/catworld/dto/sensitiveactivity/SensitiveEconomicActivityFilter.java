package com.allegaeon.catworld.dto.sensitiveactivity;

import java.time.Instant;
import java.util.UUID;

public record SensitiveEconomicActivityFilter(
        UUID actorId,
        Instant occurredFrom,
        Instant occurredTo,
        SensitiveEconomicEventType eventType,
        UUID ownerId,
        UUID catId,
        UUID stayId) {
}

