package com.allegaeon.catworld.repository;

import com.allegaeon.catworld.dto.StayDateFilter;
import com.allegaeon.catworld.model.Stay;
import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

final class StayDatePredicates {
    private StayDatePredicates() {}

    static List<Predicate> matching(CriteriaBuilder cb, Root<Stay> stay, StayDateFilter filter) {
        List<Predicate> result = new ArrayList<>();
        if (!filter.active()) return result;
        LocalDate from = filter.dateFrom();
        LocalDate to = filter.dateTo();
        switch (filter.dateMatchMode()) {
            case OVERLAPS -> {
                if (from != null) result.add(cb.greaterThanOrEqualTo(stay.get("endAt"), from.atStartOfDay()));
                if (to != null) result.add(onOrBefore(cb, stay, "startAt", to));
            }
            case STAY_WITHIN_RANGE -> {
                if (from != null) result.add(cb.greaterThanOrEqualTo(stay.get("startAt"), from.atStartOfDay()));
                if (to != null) result.add(onOrBefore(cb, stay, "endAt", to));
            }
            case RANGE_WITHIN_STAY -> {
                result.add(onOrBefore(cb, stay, "startAt", from != null ? from : to));
                result.add(cb.greaterThanOrEqualTo(stay.get("endAt"), (to != null ? to : from).atStartOfDay()));
            }
        }
        return result;
    }

    private static Predicate onOrBefore(CriteriaBuilder cb, Root<Stay> stay, String field, LocalDate date) {
        // Comparing before the next midnight includes every stored precision on the boundary day.
        if (date.equals(LocalDate.MAX)) {
            return cb.lessThanOrEqualTo(stay.<LocalDateTime>get(field), date.atTime(LocalTime.MAX));
        }
        return cb.lessThan(stay.<LocalDateTime>get(field), date.plusDays(1).atStartOfDay());
    }
}
