package com.allegaeon.catworld.service;

import com.allegaeon.catworld.dto.VetRequestDTO;
import com.allegaeon.catworld.dto.VetResponseDTO;
import com.allegaeon.catworld.exception.ResourceNotFoundException;
import com.allegaeon.catworld.mapper.VetMapper;
import com.allegaeon.catworld.model.Vet;
import com.allegaeon.catworld.repository.VetRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@RequiredArgsConstructor
@Service
public class VetService implements IVetService {

    private final VetRepository vetRepository;
    private final VetMapper vetMapper;

    @Override
    public List<VetResponseDTO> getAllVets() {
        return vetRepository.findAll().stream().map(vetMapper::toResponseDTO).toList();
    }

    @Override
    public VetResponseDTO getVet(UUID id) {
        return vetMapper.toResponseDTO(getEntity(id));
    }

    @Override
    public VetResponseDTO createVet(VetRequestDTO vetRequestDTO) {
        return vetMapper.toResponseDTO(
                vetRepository.save(
                        vetMapper.toEntity(vetRequestDTO)));
    }

    @Override
    public VetResponseDTO updateVet(UUID id, VetRequestDTO vetRequestDTO) {
        Vet vet = getEntity(id);
        return vetMapper.toResponseDTO(
                vetRepository.save(
                        vetMapper.updateEntity(vet, vetRequestDTO)));
    }

    @Override
    public void deleteVet(UUID id) {
        vetRepository.delete(getEntity(id));
    }

    private Vet getEntity(UUID id) {
        return vetRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Vet", id));
    }

}
