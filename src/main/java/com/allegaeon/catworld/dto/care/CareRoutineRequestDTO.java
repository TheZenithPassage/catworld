package com.allegaeon.catworld.dto.care;

import com.allegaeon.catworld.model.CareMode;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CareRoutineRequestDTO(@NotBlank @Size(max = 100) String name, @NotNull CareMode mode) {}
