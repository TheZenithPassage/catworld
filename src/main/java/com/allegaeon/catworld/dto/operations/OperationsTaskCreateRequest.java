package com.allegaeon.catworld.dto.operations;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.util.UUID;

public record OperationsTaskCreateRequest(
        @NotBlank @Size(max = 500) String description,
        LocalDate dueDate,
        UUID stayId
) {
}
