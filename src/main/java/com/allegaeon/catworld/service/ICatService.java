package com.allegaeon.catworld.service;

import com.allegaeon.catworld.dto.CatRequestDTO;
import com.allegaeon.catworld.dto.CatResponseDTO;
import com.allegaeon.catworld.dto.lookup.CatLookupOptionDTO;
import com.allegaeon.catworld.dto.lookup.LookupPageResponseDTO;

import java.util.List;
import java.util.UUID;

public interface ICatService {

    List<CatResponseDTO> getAllCats();
    CatResponseDTO getCat(UUID id);
    LookupPageResponseDTO<CatLookupOptionDTO> searchLookupOptions(String query, int page);
    CatLookupOptionDTO getLookupOption(UUID id);
    CatResponseDTO createCat(CatRequestDTO catRequestDTO);
    CatResponseDTO updateCat(UUID id, CatRequestDTO catRequestDTO);
    void deleteCat(UUID id);

}
