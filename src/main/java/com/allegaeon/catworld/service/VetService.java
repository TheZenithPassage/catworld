package com.allegaeon.catworld.service;

import com.allegaeon.catworld.dto.VetRequestDTO;
import com.allegaeon.catworld.dto.VetResponseDTO;
import com.allegaeon.catworld.exception.ConflictException;
import com.allegaeon.catworld.exception.ResourceNotFoundException;
import com.allegaeon.catworld.mapper.VetMapper;
import com.allegaeon.catworld.model.Vet;
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
public class VetService implements IVetService {

    private final VetRepository vetRepository;
    private final VetMapper vetMapper;
    private final CurrentUserAccountService currentUserAccountService;
    private final DeletionAuthorizationPolicy deletionAuthorizationPolicy;

    @Override
    public List<VetResponseDTO> getAllVets() {
        return vetRepository.findAll().stream().map(this::toResponseDTO).toList();
    }

    @Override
    public VetResponseDTO getVet(UUID id) {
        return toResponseDTO(getEntity(id));
    }

    @Override
    public VetResponseDTO createVet(VetRequestDTO vetRequestDTO) {
        Vet vet = vetMapper.toEntity(vetRequestDTO);
        vet.setCreatedBy(currentUserAccountService.getCurrentUserAccount());
        return toResponseDTO(vetRepository.save(vet));
    }

    @Override
    public VetResponseDTO updateVet(UUID id, VetRequestDTO vetRequestDTO) {
        Vet vet = getEntity(id);
        return toResponseDTO(
                vetRepository.save(
                        vetMapper.updateEntity(vet, vetRequestDTO)));
    }

    @Override
    @Transactional
    public void deleteVet(UUID id) {
        Vet vet = getEntity(id);
        deletionAuthorizationPolicy.authorize(vet.getCreatedBy(), vet.getCreatedAt());

        if (vetRepository.existsByIdAndCatsIsNotEmpty(id)) {
            throw new ConflictException("Vet cannot be deleted while cats reference it");
        }

        try {
            vetRepository.delete(vet);
            vetRepository.flush();
        } catch (DataIntegrityViolationException | OptimisticLockingFailureException exception) {
            throw new ConflictException("Vet cannot be deleted because of a data conflict");
        }
    }

    private Vet getEntity(UUID id) {
        return vetRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Vet", id));
    }

    private VetResponseDTO toResponseDTO(Vet vet) {
        boolean canDelete = deletionAuthorizationPolicy.canDelete(vet.getCreatedBy(), vet.getCreatedAt())
                && !vetRepository.existsByIdAndCatsIsNotEmpty(vet.getId());

        return vetMapper.toResponseDTO(vet, canDelete);
    }

}
