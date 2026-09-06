package com.allegaeon.catworld.dto.sensitiveactivity;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record SensitiveEconomicActivityFilter(
        UUID actorId,
        Instant occurredFrom,
        Instant occurredTo,
        SensitiveEconomicEventType eventType,
        UUID ownerId,
        UUID catId,
        UUID stayId,
        LocalDate stayFrom,
        LocalDate stayTo) {
    public SensitiveEconomicActivityFilter(UUID actorId, Instant occurredFrom, Instant occurredTo,
            SensitiveEconomicEventType eventType, UUID ownerId, UUID catId, UUID stayId) {
        this(actorId, occurredFrom, occurredTo, eventType, ownerId, catId, stayId, null, null);
    }
}
