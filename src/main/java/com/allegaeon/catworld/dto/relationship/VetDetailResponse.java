package com.allegaeon.catworld.dto.relationship;

import com.allegaeon.catworld.dto.VetResponseDTO;

public record VetDetailResponse(VetResponseDTO vet,
                                RelationshipPreview<CatRelationshipItem> cats) {
}
