package com.allegaeon.catworld.dto.overview;

import java.util.UUID;

public record CatOverviewItem(UUID id, String name, UUID ownerId, String ownerName, boolean deceased, boolean ownerDeceased, boolean hasPhoto) {}
