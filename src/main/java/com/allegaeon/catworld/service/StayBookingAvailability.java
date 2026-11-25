package com.allegaeon.catworld.service;

import com.allegaeon.catworld.exception.StayBookingConflictException;
import com.allegaeon.catworld.model.Cat;
import com.allegaeon.catworld.model.Stay;
import com.allegaeon.catworld.model.StayCat;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.UUID;

import static com.allegaeon.catworld.model.StayMovementType.ARRIVAL;
import static com.allegaeon.catworld.model.StayMovementType.DEPARTURE;

final class StayBookingAvailability {
    private StayBookingAvailability() {}

    // The caller holds the cat's write lock when checking a change to its booking interval.
    static void requireAvailable(Cat cat, UUID excludedStayId,
                                 LocalDateTime start, LocalDateTime end, ZoneId zone) {
        if (start.equals(end)) return;
        for (StayCat link : cat.getStayCats()) {
            Stay other = link.getStay();
            if (other.getCancelledAt() != null || other.getId().equals(excludedStayId)) continue;
            LocalDateTime otherStart = other.effectiveTime(ARRIVAL, zone);
            LocalDateTime otherEnd = other.effectiveTime(DEPARTURE, zone);
            if (!otherStart.equals(otherEnd) && end.isAfter(otherStart) && start.isBefore(otherEnd)) {
                throw new StayBookingConflictException(cat.getName());
            }
        }
    }
}
