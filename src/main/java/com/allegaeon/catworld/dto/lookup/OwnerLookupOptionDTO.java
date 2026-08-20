package com.allegaeon.catworld.dto.lookup;

import java.util.List;
import java.util.UUID;

public record OwnerLookupOptionDTO(UUID id, String fullName, List<String> catNames) {
    public OwnerLookupOptionDTO {
        catNames = List.copyOf(catNames);
    }
}
