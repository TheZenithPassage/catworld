package com.allegaeon.catworld.service;

import com.allegaeon.catworld.dto.OwnerRequestDTO;
import com.allegaeon.catworld.dto.OwnerResponseDTO;
import com.allegaeon.catworld.dto.relationship.*;

import java.util.List;
import java.util.UUID;

public interface IOwnerService {

    List<OwnerResponseDTO> getAllOwners();
    OwnerResponseDTO getOwner(UUID id);
    OwnerDetailResponse getOwnerDetail(UUID id);
    RelationshipPage<CatRelationshipItem> getOwnerCats(UUID id, int page);
    RelationshipPage<StayRelationshipItem> getOwnerStays(UUID id, int page);
    OwnerResponseDTO createOwner(OwnerRequestDTO ownerRequestDTO);
    OwnerResponseDTO updateOwner(UUID id, OwnerRequestDTO ownerRequestDTO);
    void deleteOwner(UUID id);

}
