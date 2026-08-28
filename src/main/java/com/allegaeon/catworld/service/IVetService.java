package com.allegaeon.catworld.service;

import com.allegaeon.catworld.dto.VetRequestDTO;
import com.allegaeon.catworld.dto.VetResponseDTO;
import com.allegaeon.catworld.dto.relationship.*;
import com.allegaeon.catworld.dto.lookup.*;

import java.util.List;
import java.util.UUID;

public interface IVetService {

    List<VetResponseDTO> getAllVets();
    VetResponseDTO getVet(UUID id);
    LookupPage<VetLookupItem> searchVets(String query, int page);
    VetDetailResponse getVetDetail(UUID id);
    RelationshipPage<CatRelationshipItem> getVetCats(UUID id, int page);
    VetResponseDTO createVet(VetRequestDTO vetRequestDTO);
    VetResponseDTO updateVet(UUID id, VetRequestDTO voRequestDTO);
    void deleteVet(UUID id);

}
