package com.allegaeon.catworld.service;

import com.allegaeon.catworld.dto.OwnerRequestDTO;
import com.allegaeon.catworld.dto.OwnerResponseDTO;
import com.allegaeon.catworld.exception.ConflictException;
import com.allegaeon.catworld.exception.ResourceNotFoundException;
import com.allegaeon.catworld.mapper.OwnerMapper;
import com.allegaeon.catworld.model.Owner;
import com.allegaeon.catworld.repository.OwnerRepository;
import com.allegaeon.catworld.repository.StayRepository;
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
public class OwnerService implements IOwnerService {

    private final OwnerRepository ownerRepository;
    private final OwnerMapper ownerMapper;
    private final CurrentUserAccountService currentUserAccountService;
    private final DeletionAuthorizationPolicy deletionAuthorizationPolicy;
    private final StayRepository stayRepository;

    @Override
    public List<OwnerResponseDTO> getAllOwners() {
        return ownerRepository.findAll().stream().map(this::toResponseDTO).toList();
    }

    @Override
    public OwnerResponseDTO getOwner(UUID id) {
        return toResponseDTO(getEntity(id));
    }

    @Override
    public OwnerResponseDTO createOwner(OwnerRequestDTO ownerRequestDTO) {
        Owner owner = ownerMapper.toEntity(ownerRequestDTO);
        owner.setCreatedBy(currentUserAccountService.getCurrentUserAccount());
        return toResponseDTO(ownerRepository.save(owner));
    }

    @Override
    public OwnerResponseDTO updateOwner(UUID id, OwnerRequestDTO ownerRequestDTO) {
        return toResponseDTO(
                ownerRepository.save(
                        ownerMapper.updateEntity(getEntity(id), ownerRequestDTO)));
    }

    @Override
    @Transactional
    public void deleteOwner(UUID id) {
        Owner owner = getEntity(id);
        deletionAuthorizationPolicy.authorize(owner.getCreatedBy(), owner.getCreatedAt());

        if (ownerRepository.existsByIdAndCatsIsNotEmpty(id)) {
            throw new ConflictException("Owner cannot be deleted while cats reference it");
        }

        if (stayRepository.existsByOwner_Id(id)) {
            throw new ConflictException("Owner cannot be deleted while stays reference it");
        }

        try {
            ownerRepository.delete(owner);
            ownerRepository.flush();
        } catch (DataIntegrityViolationException | OptimisticLockingFailureException exception) {
            throw new ConflictException("Owner cannot be deleted because of a data conflict");
        }
    }

    private Owner getEntity(UUID id) {
        return ownerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Owner", id));
    }

    private OwnerResponseDTO toResponseDTO(Owner owner) {
        boolean canDelete = deletionAuthorizationPolicy.canDelete(owner.getCreatedBy(), owner.getCreatedAt())
                && !ownerRepository.existsByIdAndCatsIsNotEmpty(owner.getId())
                && !stayRepository.existsByOwner_Id(owner.getId());

        return ownerMapper.toResponseDTO(owner, canDelete);
    }

}
