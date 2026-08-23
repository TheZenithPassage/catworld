package com.allegaeon.catworld.service;

import com.allegaeon.catworld.dto.CatRequestDTO;
import com.allegaeon.catworld.dto.CatResponseDTO;
import com.allegaeon.catworld.dto.relationship.*;

import java.util.List;
import java.util.UUID;

public interface ICatService {

    List<CatResponseDTO> getAllCats();
    CatResponseDTO getCat(UUID id);
    CatDetailResponse getCatDetail(UUID id);
    RelationshipPage<StayRelationshipItem> getCatStays(UUID id, int page);
    CatResponseDTO createCat(CatRequestDTO catRequestDTO);
    CatResponseDTO updateCat(UUID id, CatRequestDTO catRequestDTO);
    void deleteCat(UUID id);

}
