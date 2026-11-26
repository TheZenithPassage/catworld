package com.allegaeon.catworld.dto;

import com.allegaeon.catworld.model.StayStatus;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public record OperationsDeparture(UUID id, LocalDateTime startAt, LocalDateTime endAt,
                                  OperationsStayOwner owner, List<DepartureCat> cats, boolean transferRequired,
                                  StayStatus status, boolean overdue, boolean canRecord) {
    public record DepartureCat(UUID id, String name) {}
}
