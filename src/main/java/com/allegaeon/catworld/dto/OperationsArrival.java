package com.allegaeon.catworld.dto;

import com.allegaeon.catworld.model.LitterPreference;
import com.allegaeon.catworld.model.StayStatus;
import com.fasterxml.jackson.annotation.JsonInclude;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public record OperationsArrival(UUID id, LocalDateTime startAt, LocalDateTime endAt,
                                OperationsStayOwner owner, List<ArrivalCat> cats, boolean transferRequired,
                                StayStatus status, boolean overdue, boolean canRecord) {
    public record ArrivalCat(UUID id, String name, String foodBrand, String litterBrand, LitterPreference litterChoice,
                             List<VaccineWarning> vaccineWarnings, List<String> missingProfileFields,
                             @JsonInclude(JsonInclude.Include.NON_NULL) List<PendingReview> pendingReviews) {}

    public record VaccineWarning(VaccineType vaccineType, VaccineConflictReason reason, LocalDate expiresOn) {}

    public record PendingReview(UUID id, Instant submittedAt) {}
}
