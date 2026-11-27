package com.allegaeon.catworld.dto.operations;

import com.allegaeon.catworld.dto.lookup.CatLookupItem;
import com.allegaeon.catworld.dto.lookup.CurrentCatLookupItem;
import com.allegaeon.catworld.dto.lookup.OwnerLookupItem;
import com.allegaeon.catworld.model.StayStatus;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public record OperationsTaskLinkOptions(
        Results<OwnerLookupItem> owners,
        Results<CatLookupItem> cats,
        Results<StayOption> stays,
        boolean ownersFirst
) {
    public enum Group { OWNER, CAT, STAY }

    public record Results<T>(List<T> items, boolean hasMore) {}

    public record StayOption(UUID id, LocalDateTime startAt, LocalDateTime endAt, StayStatus status,
            String ownerName, boolean ownerDeceased, List<CurrentCatLookupItem> cats) {}
}
