package com.allegaeon.catworld.dto.overview;

import com.allegaeon.catworld.dto.lookup.CurrentCatLookupItem;
import com.allegaeon.catworld.model.StayStatus;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public record StayOverviewItem(UUID id, LocalDateTime startAt, LocalDateTime endAt,
        StayStatus status, UUID ownerId, String ownerName, List<CurrentCatLookupItem> cats) {}
