package com.allegaeon.catworld.service;

import com.allegaeon.catworld.dto.CatRequestDTO;
import com.allegaeon.catworld.dto.CatResponseDTO;

import java.util.List;
import java.util.UUID;

public interface ICatService {

    List<CatResponseDTO> getAllCats();
    CatResponseDTO getCat(UUID id);
    CatResponseDTO createCat(CatRequestDTO catRequestDTO);
    CatResponseDTO updateCat(UUID id, CatRequestDTO catRequestDTO);
    void deleteCat(UUID id);

}
