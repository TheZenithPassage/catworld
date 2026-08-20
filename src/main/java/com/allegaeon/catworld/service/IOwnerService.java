package com.allegaeon.catworld.service;

import com.allegaeon.catworld.dto.OwnerRequestDTO;
import com.allegaeon.catworld.dto.OwnerResponseDTO;
import com.allegaeon.catworld.dto.lookup.LookupPageResponseDTO;
import com.allegaeon.catworld.dto.lookup.OwnerLookupOptionDTO;

import java.util.List;
import java.util.UUID;

public interface IOwnerService {

    List<OwnerResponseDTO> getAllOwners();
    OwnerResponseDTO getOwner(UUID id);
    LookupPageResponseDTO<OwnerLookupOptionDTO> searchLookupOptions(String query, int page);
    OwnerLookupOptionDTO getLookupOption(UUID id);
    OwnerResponseDTO createOwner(OwnerRequestDTO ownerRequestDTO);
    OwnerResponseDTO updateOwner(UUID id, OwnerRequestDTO ownerRequestDTO);
    void deleteOwner(UUID id);

}
