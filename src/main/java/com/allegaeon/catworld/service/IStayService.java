package com.allegaeon.catworld.service;

import com.allegaeon.catworld.dto.StayRequestDTO;
import com.allegaeon.catworld.dto.StayResponseDTO;
import com.allegaeon.catworld.dto.StayUpdateDTO;

import java.util.List;
import java.util.UUID;

public interface IStayService {

    List<StayResponseDTO> getAllStays();
    StayResponseDTO getStay(UUID stayId);
    StayResponseDTO createStay(StayRequestDTO stayRequestDTO);
    StayResponseDTO updateStay(UUID stayId, StayUpdateDTO stayUpdateDTO);
    void cancelStay(UUID stayId);

}
