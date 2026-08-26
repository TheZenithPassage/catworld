package com.allegaeon.catworld.dto.lookup;

import java.util.UUID;

public record CatLookupItem(UUID id, String name, UUID ownerId, String ownerName) {
}
