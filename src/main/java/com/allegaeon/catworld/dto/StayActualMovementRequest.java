package com.allegaeon.catworld.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;

import java.time.Instant;

public record StayActualMovementRequest(
        @NotNull @PositiveOrZero Long expectedRevision,
        @JsonProperty(required = true) Instant occurredAt
) {
}
