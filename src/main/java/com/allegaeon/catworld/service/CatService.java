package com.allegaeon.catworld.service;

import com.allegaeon.catworld.dto.CatRequestDTO;
import com.allegaeon.catworld.dto.CatResponseDTO;
import com.allegaeon.catworld.exception.ConflictException;
import com.allegaeon.catworld.exception.ResourceNotFoundException;
import com.allegaeon.catworld.mapper.CatMapper;
import com.allegaeon.catworld.model.Cat;
import com.allegaeon.catworld.model.Owner;
import com.allegaeon.catworld.model.Vet;
import com.allegaeon.catworld.repository.CatRepository;
import com.allegaeon.catworld.repository.OwnerRepository;
import com.allegaeon.catworld.repository.StayCatRepository;
import com.allegaeon.catworld.repository.VetRepository;
import com.allegaeon.catworld.security.CurrentUserAccountService;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@RequiredArgsConstructor
@Service
public class CatService implements ICatService{

    private final CatRepository catRepository;
    private final CatMapper catMapper;
    private final OwnerRepository ownerRepository;
    private final VetRepository vetRepository;
    private final CurrentUserAccountService currentUserAccountService;
    private final DeletionAuthorizationPolicy deletionAuthorizationPolicy;
    private final StayCatRepository stayCatRepository;

    @Override
    public List<CatResponseDTO> getAllCats() {
        return catRepository.findAll().stream().map(this::toResponseDTO).toList();
    }

    @Override
    public CatResponseDTO getCat(UUID id) {
        return toResponseDTO(getCatEntity(id));
    }

    @Override
    public CatResponseDTO createCat(CatRequestDTO catRequestDTO) {

        Owner owner = getOwnerEntity(catRequestDTO.getOwnerId());
        Vet vet = null;
        if(catRequestDTO.getVetId() != null) {
            vet = getVetEntity(catRequestDTO.getVetId());
        }

        Cat cat = catMapper.toEntity(catRequestDTO, owner, vet);
        cat.setCreatedBy(currentUserAccountService.getCurrentUserAccount());

        return toResponseDTO(catRepository.save(cat));
    }

    @Override
    public CatResponseDTO updateCat(UUID id, CatRequestDTO catRequestDTO) {

        Owner owner = getOwnerEntity(catRequestDTO.getOwnerId());
        Vet vet = null;
        if(catRequestDTO.getVetId() != null) {
            vet = getVetEntity(catRequestDTO.getVetId());
        }

        return toResponseDTO(
                catRepository.save(
                        catMapper.updateEntity(getCatEntity(id), catRequestDTO, owner, vet)));
    }

    @Override
    @Transactional
    public void deleteCat(UUID id) {
        Cat cat = getCatEntity(id);
        deletionAuthorizationPolicy.authorize(cat.getCreatedBy(), cat.getCreatedAt());

        if (stayCatRepository.existsByCat_Id(id)) {
            throw new ConflictException("Cat cannot be deleted because it has stay history");
        }

        try {
            catRepository.delete(cat);
            catRepository.flush();
        } catch (DataIntegrityViolationException | OptimisticLockingFailureException exception) {
            throw new ConflictException("Cat cannot be deleted because of a data conflict");
        }
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

    private CatResponseDTO toResponseDTO(Cat cat) {
        boolean canDelete = deletionAuthorizationPolicy.canDelete(cat.getCreatedBy(), cat.getCreatedAt())
                && !stayCatRepository.existsByCat_Id(cat.getId());

        return catMapper.toResponseDTO(cat, canDelete);
    }

}
