package com.allegaeon.catworld.service;

import com.allegaeon.catworld.dto.CatRequestDTO;
import com.allegaeon.catworld.dto.CatResponseDTO;
import com.allegaeon.catworld.exception.ResourceNotFoundException;
import com.allegaeon.catworld.mapper.CatMapper;
import com.allegaeon.catworld.model.Cat;
import com.allegaeon.catworld.model.Owner;
import com.allegaeon.catworld.model.Vet;
import com.allegaeon.catworld.repository.CatRepository;
import com.allegaeon.catworld.repository.OwnerRepository;
import com.allegaeon.catworld.repository.VetRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@RequiredArgsConstructor
@Service
public class CatService implements ICatService{

    private final CatRepository catRepository;
    private final CatMapper catMapper;
    private final OwnerRepository ownerRepository;
    private final VetRepository vetRepository;

    @Override
    public List<CatResponseDTO> getAllCats() {
        return catRepository.findAll().stream().map(catMapper::toResponseDTO).toList();
    }

    @Override
    public CatResponseDTO getCat(UUID id) {
        return catMapper.toResponseDTO(getCatEntity(id));
    }

    @Override
    public CatResponseDTO createCat(CatRequestDTO catRequestDTO) {

        Owner owner = getOwnerEntity(catRequestDTO.getOwnerId());
        Vet vet = null;
        if(catRequestDTO.getVetId() != null) {
            vet = getVetEntity(catRequestDTO.getVetId());
        }

        return catMapper.toResponseDTO(
                catRepository.save(
                        catMapper.toEntity(catRequestDTO, owner, vet)));
    }

    @Override
    public CatResponseDTO updateCat(UUID id, CatRequestDTO catRequestDTO) {

        Owner owner = getOwnerEntity(catRequestDTO.getOwnerId());
        Vet vet = null;
        if(catRequestDTO.getVetId() != null) {
            vet = getVetEntity(catRequestDTO.getVetId());
        }

        return catMapper.toResponseDTO(
                catRepository.save(
                        catMapper.updateEntity(getCatEntity(id), catRequestDTO, owner, vet)));
    }

    @Override
    public void deleteCat(UUID id) {
        catRepository.delete(getCatEntity(id));
    }

    private Cat getCatEntity(UUID id) {
        return catRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Cat", id));
    }

    private Owner getOwnerEntity(UUID id) {
        return ownerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Owner", id));
    }

    private Vet getVetEntity(UUID id) {
        return vetRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Vet", id));
    }

}
