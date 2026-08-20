package com.allegaeon.catworld.repository.projection;

import java.util.UUID;

public interface OwnerLookupCandidateProjection {
    UUID getId();

    String getFullName();
}
