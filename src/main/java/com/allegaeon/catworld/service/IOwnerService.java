package com.allegaeon.catworld.service;

import com.allegaeon.catworld.dto.OwnerRequestDTO;
import com.allegaeon.catworld.dto.OwnerResponseDTO;

import java.util.List;
import java.util.UUID;

public interface IOwnerService {

    List<OwnerResponseDTO> getAllOwners();
    OwnerResponseDTO getOwner(UUID id);
    OwnerResponseDTO createOwner(OwnerRequestDTO ownerRequestDTO);
    OwnerResponseDTO updateOwner(UUID id, OwnerRequestDTO ownerRequestDTO);
    void deleteOwner(UUID id);

}
