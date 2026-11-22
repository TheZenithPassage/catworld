package com.allegaeon.catworld.dto;

import com.allegaeon.catworld.model.StayStatus;

import java.time.Instant;
import java.time.LocalDateTime;

public record StayActualMovementsDTO(
        LocalDateTime startAt,
        LocalDateTime endAt,
        boolean cancelled,
        StayStatus status,
        long revision,
        ActualMovement arrival,
        ActualMovement departure,
        boolean canRecordArrival,
        boolean canRecordDeparture,
        boolean canResetArrival,
        boolean arrivalAllowsNow,
        Instant arrivalResetUntil,
        boolean departureAllowsNow
) {
    public record ActualMovement(Instant occurredAt, long revision, String recordedBy,
                                 String correctedBy, boolean canEdit) {
    }
}
