package com.allegaeon.catworld.dto;

import com.allegaeon.catworld.exception.BadRequestException;
import java.time.LocalDate;

public record StayDateFilter(LocalDate dateFrom, LocalDate dateTo, StayDateMatchMode dateMatchMode) {
    public StayDateFilter {
        if ((dateFrom != null || dateTo != null) && dateMatchMode == null) {
            throw new BadRequestException("A date match mode is required for date filters");
        }
        if (dateFrom != null && dateTo != null && dateFrom.isAfter(dateTo)) {
            throw new BadRequestException("Date from must not be after date to");
        }
    }

    public boolean active() {
        return dateFrom != null || dateTo != null;
    }
}
