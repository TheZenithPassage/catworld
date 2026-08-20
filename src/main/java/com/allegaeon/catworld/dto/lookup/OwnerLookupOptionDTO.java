package com.allegaeon.catworld.dto.lookup;

import java.util.List;
import java.util.UUID;

public record OwnerLookupOptionDTO(UUID id, String fullName, List<OwnerLookupCatDTO> cats) {
    public OwnerLookupOptionDTO {
        cats = List.copyOf(cats);
    }
}
