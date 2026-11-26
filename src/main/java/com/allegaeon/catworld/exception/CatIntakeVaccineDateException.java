package com.allegaeon.catworld.exception;

import com.allegaeon.catworld.dto.CatIntakeDtos.VaccineDateRange;
import lombok.Getter;

@Getter
public class CatIntakeVaccineDateException extends BadRequestException {
    private final int catIndex;
    private final String field;
    private final VaccineDateRange vaccineDateRange;

    public CatIntakeVaccineDateException(int catIndex, String field, VaccineDateRange vaccineDateRange) {
        super("Vaccination date is outside the household submission window");
        this.catIndex = catIndex;
        this.field = field;
        this.vaccineDateRange = vaccineDateRange;
    }
}
