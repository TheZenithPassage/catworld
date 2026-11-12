package com.allegaeon.catworld.dto.care;

import com.allegaeon.catworld.model.CareMode;
import com.allegaeon.catworld.model.CareRoutineSeed;

import java.util.UUID;

public record CareRoutineDTO(UUID id, String name, CareMode mode, CareRoutineSeed seedKey, boolean active) {}
