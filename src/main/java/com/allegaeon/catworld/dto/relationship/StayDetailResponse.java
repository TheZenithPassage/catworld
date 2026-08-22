package com.allegaeon.catworld.dto.relationship;

import com.allegaeon.catworld.model.StayStatus;
import java.time.LocalDateTime;
import java.util.UUID;

public record StayDetailResponse(UUID stayId, StayStatus status,
                                 LocalDateTime startAt, LocalDateTime endAt,
                                 long numberOfNights, String notes,
                                 OwnerRelationshipItem owner,
                                 RelationshipPreview<CatRelationshipItem> cats) {
}
