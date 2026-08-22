package com.allegaeon.catworld.dto.relationship;

import com.allegaeon.catworld.dto.CatResponseDTO;

public record CatDetailResponse(CatResponseDTO cat,
                                RelationshipPreview<StayRelationshipItem> stays) {
}
