package com.allegaeon.catworld.dto.lookup;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public record StayLookupItem(UUID stayId, LocalDateTime startAt, LocalDateTime endAt,
        Owner owner, List<CurrentCatLookupItem> cats) {
    public record Owner(UUID id, String fullName) {}
}
