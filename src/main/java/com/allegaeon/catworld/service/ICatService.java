package com.allegaeon.catworld.service;

import com.allegaeon.catworld.dto.CatRequestDTO;
import com.allegaeon.catworld.dto.CatResponseDTO;
import com.allegaeon.catworld.dto.relationship.*;
import com.allegaeon.catworld.dto.lookup.*;
import com.allegaeon.catworld.dto.overview.*;

import java.util.List;
import java.util.UUID;
import com.allegaeon.catworld.dto.CatPhotoContent;
import org.springframework.web.multipart.MultipartFile;

public interface ICatService {

    List<CatResponseDTO> getAllCats();
    OverviewPage<CatOverviewItem> getCatOverview(int page, String query);
    CatResponseDTO getCat(UUID id);
    LookupPage<CatLookupItem> searchCats(String query, int page);
    CatDetailResponse getCatDetail(UUID id);
    RelationshipPage<StayRelationshipItem> getCatStays(UUID id, int page);
    CatResponseDTO createCat(CatRequestDTO catRequestDTO, MultipartFile photo);
    CatResponseDTO updateCat(UUID id, CatRequestDTO catRequestDTO, MultipartFile photo, boolean removePhoto);
    CatResponseDTO createCat(CatRequestDTO catRequestDTO);
    CatResponseDTO updateCat(UUID id, CatRequestDTO catRequestDTO);
    CatPhotoContent getPhoto(UUID id);
    void deleteCat(UUID id);

}
