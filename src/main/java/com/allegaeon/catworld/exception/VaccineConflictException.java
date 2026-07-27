package com.allegaeon.catworld.exception;

import com.allegaeon.catworld.dto.VaccineConflictViolationDTO;

import java.util.List;

public class VaccineConflictException extends ConflictException {

    private final List<VaccineConflictViolationDTO> violations;

    public VaccineConflictException(List<VaccineConflictViolationDTO> violations) {
        super("The stay has vaccine validity conflicts");

        if (violations.isEmpty()) {
            throw new IllegalArgumentException("At least one vaccine conflict is required");
        }

        this.violations = List.copyOf(violations);
    }

    public List<VaccineConflictViolationDTO> getViolations() {
        return violations;
    }

}
