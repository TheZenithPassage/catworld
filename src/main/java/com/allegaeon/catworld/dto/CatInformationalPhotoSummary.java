package com.allegaeon.catworld.dto;

import java.time.Instant;
import java.util.UUID;

public record CatInformationalPhotoSummary(UUID id, Instant createdAt) {}
