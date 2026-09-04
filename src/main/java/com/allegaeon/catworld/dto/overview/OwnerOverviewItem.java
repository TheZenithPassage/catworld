package com.allegaeon.catworld.dto.overview;

import com.allegaeon.catworld.dto.lookup.CurrentCatLookupItem;
import java.util.List;
import java.util.UUID;

public record OwnerOverviewItem(UUID id, String fullName, List<CurrentCatLookupItem> cats) {}
