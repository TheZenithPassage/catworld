package com.allegaeon.catworld.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;

public record StayArrivalResetRequest(@NotNull @PositiveOrZero Long expectedRevision) {
}
