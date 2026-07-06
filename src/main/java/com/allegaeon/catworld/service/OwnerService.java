package com.allegaeon.catworld.service;

import com.allegaeon.catworld.dto.OwnerRequestDTO;
import com.allegaeon.catworld.dto.OwnerResponseDTO;
import com.allegaeon.catworld.exception.ResourceNotFoundException;
import com.allegaeon.catworld.mapper.OwnerMapper;
import com.allegaeon.catworld.model.Owner;
import com.allegaeon.catworld.repository.OwnerRepository;
import com.allegaeon.catworld.security.CurrentUserAccountService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@RequiredArgsConstructor
@Service
public class OwnerService implements IOwnerService {

    private final OwnerRepository ownerRepository;
    private final OwnerMapper ownerMapper;
    private final CurrentUserAccountService currentUserAccountService;
    private final DeletionAuthorizationPolicy deletionAuthorizationPolicy;

    @Override
    public List<OwnerResponseDTO> getAllOwners() {
        return ownerRepository.findAll().stream().map(ownerMapper::toResponseDTO).toList();
    }

    @Override
    public OwnerResponseDTO getOwner(UUID id) {
        return ownerMapper.toResponseDTO(getEntity(id));
    }

    @Override
    public OwnerResponseDTO createOwner(OwnerRequestDTO ownerRequestDTO) {
        Owner owner = ownerMapper.toEntity(ownerRequestDTO);
        owner.setCreatedBy(currentUserAccountService.getCurrentUserAccount());
        return ownerMapper.toResponseDTO(ownerRepository.save(owner));
    }

    @Override
    public OwnerResponseDTO updateOwner(UUID id, OwnerRequestDTO ownerRequestDTO) {
        return ownerMapper.toResponseDTO(
                ownerRepository.save(
                        ownerMapper.updateEntity(getEntity(id), ownerRequestDTO)));
    }

    @Override
    public void deleteOwner(UUID id) {
        Owner owner = getEntity(id);
        deletionAuthorizationPolicy.authorize(owner.getCreatedBy(), owner.getCreatedAt());
        ownerRepository.delete(owner);
    }

    private Owner getEntity(UUID id) {
        return ownerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Owner", id));
    }

}
