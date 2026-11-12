package com.allegaeon.catworld.dto.operations;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record OperationsTaskResponse(
        UUID id,
        String description,
        LocalDate dueDate,
        UUID stayId,
        Bucket bucket,
        long revision,
        Attribution created,
        Attribution lastTransition
) {
    public enum Bucket {
        OVERDUE, TODAY, UPCOMING, UNDATED, RESOLVED
    }

    public record Attribution(UUID actorId, String username, Instant at) {
    }
}
