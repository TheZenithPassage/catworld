package com.allegaeon.catworld.dto;

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
    public record AgendaMovement(AgendaMovementType type, LocalDateTime scheduledAt,
                                 boolean transferRequired, AgendaStay stay) {
    }

    public enum AgendaMovementType {
        ARRIVAL, DEPARTURE
    }

    public record AgendaStay(UUID stayId, UUID ownerId, String ownerName, List<StayCatSummaryDTO> cats,
                             LocalDateTime startAt, LocalDateTime endAt) {
    }

    public record AgendaDay(LocalDate date, List<AgendaMovement> movements) {
    }
}
