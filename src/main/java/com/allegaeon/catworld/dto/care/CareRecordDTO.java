package com.allegaeon.catworld.dto.care;

import com.allegaeon.catworld.model.CareMode;
import com.allegaeon.catworld.model.CareRoutineSeed;
import com.allegaeon.catworld.model.CareShift;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record CareRecordDTO(
        UUID id,
        UUID stayId,
        UUID catId,
        String catName,
        LocalDate businessDate,
        Instant recordedAt,
        UUID routineId,
        String routineName,
        CareRoutineSeed routineSeedKey,
        CareMode mode,
        CareShift shift,
        String note,
        UUID authorId,
        String authorUsername,
        Instant annulledAt,
        UUID annulledById,
        String annulledByUsername
) {}
