package com.allegaeon.catworld.service;

import com.allegaeon.catworld.dto.VaccineConflictReason;
import com.allegaeon.catworld.dto.VaccineType;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

final class StayVaccineCoverage {
    private StayVaccineCoverage() {}

    static List<Conflict> findConflicts(LocalDate lastRabiesDate, LocalDate lastTripleFelineDate,
                                        LocalDate stayEndDate) {
        List<Conflict> conflicts = new ArrayList<>(2);
        addConflict(conflicts, VaccineType.RABIES, lastRabiesDate, stayEndDate);
        addConflict(conflicts, VaccineType.TRIPLE_FELINE, lastTripleFelineDate, stayEndDate);
        return conflicts;
    }

    private static void addConflict(List<Conflict> conflicts, VaccineType vaccineType,
                                    LocalDate vaccinatedOn, LocalDate stayEndDate) {
        LocalDate expiresOn = vaccinatedOn == null ? null : vaccinatedOn.plusYears(1);
        if (expiresOn != null && stayEndDate.isBefore(expiresOn)) {
            return;
        }
        VaccineConflictReason reason = vaccinatedOn == null ? VaccineConflictReason.MISSING : VaccineConflictReason.EXPIRED;
        conflicts.add(new Conflict(vaccineType, reason, vaccinatedOn, expiresOn));
    }

    record Conflict(VaccineType vaccineType, VaccineConflictReason reason, LocalDate vaccinatedOn, LocalDate expiresOn) {}
}
