package com.allegaeon.catworld.service;

import com.allegaeon.catworld.dto.VetRequestDTO;
import com.allegaeon.catworld.dto.VetResponseDTO;
import com.allegaeon.catworld.dto.relationship.*;
import com.allegaeon.catworld.model.Cat;
import com.allegaeon.catworld.repository.CatRepository;
import com.allegaeon.catworld.exception.ConflictException;
import com.allegaeon.catworld.exception.ResourceNotFoundException;
import com.allegaeon.catworld.mapper.VetMapper;
import com.allegaeon.catworld.model.UserAccount;
import com.allegaeon.catworld.model.Vet;
import com.allegaeon.catworld.repository.VetRepository;
import com.allegaeon.catworld.security.CurrentUserAccountService;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;

import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@RequiredArgsConstructor
@Service
public class VetService implements IVetService {

    private static final Sort CAT_ORDER = Sort.by(Sort.Order.asc("name"), Sort.Order.asc("id"));

    private final VetRepository vetRepository;
    private final VetMapper vetMapper;
    private final CurrentUserAccountService currentUserAccountService;
    private final DeletionAuthorizationPolicy deletionAuthorizationPolicy;
    private final CatRepository catRepository;

    @Override
    public List<VetResponseDTO> getAllVets() {
        List<Vet> vets = vetRepository.findAll();
        if (vets.isEmpty()) {
            return List.of();
        }

        UserAccount currentUser = currentUserAccountService.getCurrentUserAccount();
        Set<UUID> authorizedVetIds = vets.stream()
                .filter(vet -> deletionAuthorizationPolicy.canDelete(
                        currentUser,
                        vet.getCreatedBy(),
                        vet.getCreatedAt()))
                .map(Vet::getId)
                .collect(Collectors.toSet());
        Set<UUID> blockedVetIds = authorizedVetIds.isEmpty()
                ? Set.of()
                : vetRepository.findVetIdsReferencedByCats(authorizedVetIds);

        return vets.stream()
                .map(vet -> vetMapper.toResponseDTO(
                        vet,
                        authorizedVetIds.contains(vet.getId()) && !blockedVetIds.contains(vet.getId())))
                .toList();
    }

    @Override
    public VetResponseDTO getVet(UUID id) {
        return toResponseDTO(getEntity(id));
    }

    @Override
    @Transactional(readOnly = true)
    public VetDetailResponse getVetDetail(UUID id) {
        Vet vet = getEntity(id);
        Page<Cat> cats = catRepository.findByVet_Id(id, PageRequest.of(0, 4, CAT_ORDER));
        return new VetDetailResponse(toResponseDTO(vet),
                RelationshipResponses.preview(cats, RelationshipResponses::cat));
    }

    @Override
    @Transactional(readOnly = true)
    public RelationshipPage<CatRelationshipItem> getVetCats(UUID id, int page) {
        getEntity(id);
        RelationshipResponses.requireValidPage(page);
        return RelationshipResponses.page(
                catRepository.findByVet_Id(id, PageRequest.of(page, RelationshipResponses.PAGE_SIZE, CAT_ORDER)),
                RelationshipResponses::cat);
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
