package com.allegaeon.catworld.repository.projection;

import java.util.UUID;

public interface OwnerLookupCatProjection {
    UUID getOwnerId();

    String getName();
}
