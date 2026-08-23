package com.allegaeon.catworld.dto.relationship;

import com.allegaeon.catworld.model.StayStatus;

import java.time.LocalDateTime;
import java.util.UUID;

public record StayRelationshipItem(UUID stayId, LocalDateTime startAt, LocalDateTime endAt,
                                   StayStatus status) {
}
