package com.allegaeon.catworld.dto;

import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
public class VaccineConflictResponseDTO {

    public static final String CODE = "VACCINE_VALIDITY_CONFLICT";

    private final String code;
    private final List<VaccineConflictViolationDTO> violations;

}
