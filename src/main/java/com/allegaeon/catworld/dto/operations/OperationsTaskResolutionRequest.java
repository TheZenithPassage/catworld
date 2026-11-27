package com.allegaeon.catworld.dto.operations;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;

public record OperationsTaskResolutionRequest(
        @NotNull Boolean resolved,
        @NotNull @PositiveOrZero Long revision
) {
}
