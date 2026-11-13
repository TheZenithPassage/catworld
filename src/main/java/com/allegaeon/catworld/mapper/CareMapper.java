package com.allegaeon.catworld.mapper;

import com.allegaeon.catworld.dto.care.CareRecordDTO;
import com.allegaeon.catworld.dto.care.CareRoutineDTO;
import com.allegaeon.catworld.model.CareRecord;
import com.allegaeon.catworld.model.CareRoutine;

public final class CareMapper {

    private CareMapper() {}

    public static CareRecordDTO toDTO(CareRecord record) {
        return new CareRecordDTO(
                record.getId(), record.getStay().getId(), record.getCatId(), record.getCatName(),
                record.getBusinessDate(), record.getRecordedAt(), record.getRoutineId(),
                record.getRoutineName(), record.getRoutineSeedKey(), record.getMode(), record.getShift(),
                record.getNote(), record.getAuthorId(), record.getAuthorUsername(), record.getAnnulledAt(),
                record.getAnnulledById(), record.getAnnulledByUsername()
        );
    }

    public static CareRoutineDTO toDTO(CareRoutine routine) {
        return new CareRoutineDTO(routine.getId(), routine.getName(), routine.getMode(),
                routine.getSeedKey(), routine.isActive());
    }
}
