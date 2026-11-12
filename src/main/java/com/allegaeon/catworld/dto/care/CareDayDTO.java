package com.allegaeon.catworld.dto.care;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public record CareDayDTO(LocalDate date, LocalDate businessToday, List<CareRoutineDTO> routines, List<Cat> cats) {

    public record Cat(
            UUID stayId,
            UUID catId,
            String catName,
            String foodBrand,
            String litterBrand,
            LocalDateTime stayStartAt,
            LocalDateTime stayEndAt,
            List<CareRecordDTO> records
    ) {}
}
