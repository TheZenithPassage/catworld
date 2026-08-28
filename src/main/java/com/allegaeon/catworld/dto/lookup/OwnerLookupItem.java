package com.allegaeon.catworld.dto.lookup;

import java.util.List;
import java.util.UUID;

public record OwnerLookupItem(UUID id, String fullName, List<CurrentCatLookupItem> currentCats) {
}
