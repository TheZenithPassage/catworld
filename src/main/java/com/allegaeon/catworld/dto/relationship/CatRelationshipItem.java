package com.allegaeon.catworld.dto.relationship;

import java.util.UUID;

public record CatRelationshipItem(UUID id, String name, UUID ownerId, String ownerName) {
}
