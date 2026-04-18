package com.allegaeon.catworld.service;

import com.allegaeon.catworld.dto.VetRequestDTO;
import com.allegaeon.catworld.dto.VetResponseDTO;

import java.util.List;
import java.util.UUID;

public interface IVetService {

    List<VetResponseDTO> getAllVets();
    VetResponseDTO getVet(UUID id);
    VetResponseDTO createVet(VetRequestDTO vetRequestDTO);
    VetResponseDTO updateVet(UUID id, VetRequestDTO voRequestDTO);
    void deleteVet(UUID id);

}
