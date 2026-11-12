package com.allegaeon.catworld.dto.care;

import com.allegaeon.catworld.model.CareMode;
import com.allegaeon.catworld.model.CareShift;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.util.UUID;

public record CareRecordRequestDTO(
        @NotNull UUID stayId,
        @NotNull UUID catId,
        @NotNull LocalDate businessDate,
        UUID routineId,
        CareMode expectedMode,
        CareShift shift,
        @Size(max = 10000) String note
) {}
