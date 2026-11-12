package com.allegaeon.catworld.dto;

import com.allegaeon.catworld.model.StayMovementType;
import com.fasterxml.jackson.annotation.JsonInclude;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public record OperationsAgendaDTO(
        LocalDate date,
        LocalDate businessDate,
        List<AgendaMovement> movements,
        List<AgendaStay> boardingStays,
        List<AgendaDay> upcomingDays
) {
    public record AgendaMovement(StayMovementType type, LocalDateTime scheduledAt,
                                 boolean transferRequired, AgendaStay stay,
                                 @JsonInclude(JsonInclude.Include.NON_NULL) Instant actualAt) {
    }

    public record AgendaStay(UUID stayId, UUID ownerId, String ownerName, List<StayCatSummaryDTO> cats,
                             LocalDateTime startAt, LocalDateTime endAt) {
    }

    public record AgendaDay(LocalDate date, List<AgendaMovement> movements) {
    }
}
