package com.allegaeon.catworld.dto;

import java.time.Instant;
import java.time.LocalDateTime;

public record StayActualMovementsDTO(
        LocalDateTime startAt,
        LocalDateTime endAt,
        boolean cancelled,
        ActualMovement arrival,
        ActualMovement departure
) {
    public record ActualMovement(Instant occurredAt, long revision, String recordedBy,
                                 String correctedBy, boolean canEdit) {
    }
}
