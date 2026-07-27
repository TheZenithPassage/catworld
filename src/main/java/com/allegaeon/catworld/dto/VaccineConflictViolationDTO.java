package com.allegaeon.catworld.dto;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDate;
import java.util.UUID;

@Getter
@Builder
public class VaccineConflictViolationDTO {

    private final UUID catId;
    private final String catName;
    private final VaccineType vaccineType;
    private final VaccineConflictReason reason;
    private final LocalDate vaccinatedOn;
    private final LocalDate expiresOn;

}
