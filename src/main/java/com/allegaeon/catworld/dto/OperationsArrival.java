package com.allegaeon.catworld.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public record OperationsArrival(UUID id, LocalDateTime startAt, LocalDateTime endAt,
                                ArrivalOwner owner, List<ArrivalCat> cats) {
    public record ArrivalOwner(UUID id, String fullName) {}

    public record ArrivalCat(UUID id, String name, String foodBrand, String litterBrand,
                             List<VaccineWarning> vaccineWarnings,
                             @JsonInclude(JsonInclude.Include.NON_NULL) List<PendingReview> pendingReviews) {}

    public record VaccineWarning(VaccineType vaccineType, VaccineConflictReason reason) {}

    public record PendingReview(UUID id, Instant submittedAt) {}
}
