package com.allegaeon.catworld.dto.lookup;

import java.util.List;
import java.util.Objects;

public record LookupPageResponseDTO<T>(List<T> items, int page, boolean hasNext) {
    public LookupPageResponseDTO {
        items = List.copyOf(Objects.requireNonNull(items, "items must not be null"));
    }
}
