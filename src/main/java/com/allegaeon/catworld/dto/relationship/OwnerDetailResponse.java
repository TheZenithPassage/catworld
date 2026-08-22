package com.allegaeon.catworld.dto.relationship;

import com.allegaeon.catworld.dto.OwnerResponseDTO;

public record OwnerDetailResponse(OwnerResponseDTO owner,
                                  RelationshipPreview<CatRelationshipItem> cats,
                                  RelationshipPreview<StayRelationshipItem> stays) {
}
