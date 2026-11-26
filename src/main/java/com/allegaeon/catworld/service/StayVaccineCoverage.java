package com.allegaeon.catworld.service;

import com.allegaeon.catworld.dto.VaccineConflictReason;
import com.allegaeon.catworld.dto.VaccineType;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

final class StayVaccineCoverage {
    private StayVaccineCoverage() {}

    static List<Conflict> findConflicts(LocalDate lastRabiesDate, LocalDate lastTripleFelineDate,
                                        LocalDate arrival, LocalDate departure) {
        List<Conflict> conflicts = new ArrayList<>(2);
        addConflict(conflicts, VaccineType.RABIES, lastRabiesDate, arrival, departure);
        addConflict(conflicts, VaccineType.TRIPLE_FELINE, lastTripleFelineDate, arrival, departure);
        return conflicts;
    }

    private static void addConflict(List<Conflict> conflicts, VaccineType vaccineType,
                                    LocalDate vaccinatedOn, LocalDate arrival, LocalDate departure) {
        if (vaccinatedOn == null) {
            conflicts.add(new Conflict(vaccineType, VaccineConflictReason.MISSING, null, null));
            return;
        }
        LocalDate expiresOn = vaccinatedOn.plusYears(1);
        if (departure.isBefore(expiresOn)) return;

        VaccineConflictReason reason = arrival.isBefore(expiresOn)
                ? VaccineConflictReason.EXPIRES_DURING_STAY : VaccineConflictReason.EXPIRED_BY_ARRIVAL;
        conflicts.add(new Conflict(vaccineType, reason, vaccinatedOn, expiresOn));
    }

    record Conflict(VaccineType vaccineType, VaccineConflictReason reason, LocalDate vaccinatedOn, LocalDate expiresOn) {}
}
