package com.allegaeon.catworld.repository;

import com.allegaeon.catworld.dto.StayDateFilter;
import com.allegaeon.catworld.model.Stay;
import com.allegaeon.catworld.model.StayActualMovement;
import com.allegaeon.catworld.model.StayMovementType;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Path;
import jakarta.persistence.criteria.CriteriaBuilder;
import java.time.ZoneId;
import java.time.ZoneOffset;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

final class StayDatePredicates {
    private StayDatePredicates() {}

    static List<Predicate> matching(CriteriaBuilder cb, Root<Stay> stay, StayDateFilter filter) {
        return matching(cb, stay, filter, null);
    }

    static List<Predicate> matching(CriteriaBuilder cb, Root<Stay> stay, StayDateFilter filter, ZoneId zone) {
        List<Predicate> result = new ArrayList<>();
        if (!filter.active()) return result;
        Bound start = bound(cb, stay, "startAt", StayMovementType.ARRIVAL, zone);
        Bound end = bound(cb, stay, "endAt", StayMovementType.DEPARTURE, zone);
        LocalDate from = filter.dateFrom();
        LocalDate to = filter.dateTo();
        switch (filter.dateMatchMode()) {
            case OVERLAPS -> {
                if (from != null) result.add(end.atOrAfter(cb, from));
                if (to != null) result.add(start.onOrBefore(cb, to));
            }
            case STAY_WITHIN_RANGE -> {
                if (from != null) result.add(start.atOrAfter(cb, from));
                if (to != null) result.add(end.onOrBefore(cb, to));
            }
            case RANGE_WITHIN_STAY -> {
                result.add(start.onOrBefore(cb, from != null ? from : to));
                result.add(end.atOrAfter(cb, to != null ? to : from));
            }
        }
        return result;
    }

    private static Bound bound(CriteriaBuilder cb, Root<Stay> stay, String field, StayMovementType type, ZoneId zone) {
        if (zone == null) return new Bound(stay.get(field), null, null);
        Join<Stay, StayActualMovement> movement = stay.join("actualMovements", JoinType.LEFT);
        movement.on(cb.equal(movement.get("id").get("type"), type));
        return new Bound(stay.get(field), movement.get("occurredAtUtc"), zone);
    }

    private record Bound(Path<LocalDateTime> planned, Path<LocalDateTime> actual, ZoneId zone) {
        Predicate atOrAfter(CriteriaBuilder cb, LocalDate date) {
            Predicate scheduled = cb.greaterThanOrEqualTo(planned, date.atStartOfDay());
            if (actual == null) return scheduled;
            return cb.or(cb.and(cb.isNull(actual), scheduled), cb.greaterThanOrEqualTo(actual, utcStart(date)));
        }

        Predicate onOrBefore(CriteriaBuilder cb, LocalDate date) {
            if (date.equals(LocalDate.MAX)) return cb.conjunction();
            LocalDate next = date.plusDays(1);
            Predicate scheduled = cb.lessThan(planned, next.atStartOfDay());
            if (actual == null) return scheduled;
            return cb.or(cb.and(cb.isNull(actual), scheduled), cb.lessThan(actual, utcStart(next)));
        }

        private LocalDateTime utcStart(LocalDate date) {
            return LocalDateTime.ofInstant(date.atStartOfDay(zone).toInstant(), ZoneOffset.UTC);
        }
    }
}
