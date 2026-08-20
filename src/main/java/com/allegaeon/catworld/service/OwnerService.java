package com.allegaeon.catworld.service;

import com.allegaeon.catworld.dto.OwnerRequestDTO;
import com.allegaeon.catworld.dto.OwnerResponseDTO;
import com.allegaeon.catworld.dto.lookup.LookupPageResponseDTO;
import com.allegaeon.catworld.dto.lookup.OwnerLookupCatDTO;
import com.allegaeon.catworld.dto.lookup.OwnerLookupOptionDTO;
import com.allegaeon.catworld.exception.ConflictException;
import com.allegaeon.catworld.exception.ResourceNotFoundException;
import com.allegaeon.catworld.mapper.OwnerMapper;
import com.allegaeon.catworld.model.Owner;
import com.allegaeon.catworld.model.UserAccount;
import com.allegaeon.catworld.repository.OwnerRepository;
import com.allegaeon.catworld.repository.projection.OwnerLookupCandidateProjection;
import com.allegaeon.catworld.repository.projection.OwnerLookupCatProjection;
import com.allegaeon.catworld.service.lookup.LookupPageSupport;
import com.allegaeon.catworld.repository.StayRepository;
import com.allegaeon.catworld.security.CurrentUserAccountService;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

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
        List<Owner> owners = ownerRepository.findAll();
        if (owners.isEmpty()) {
            return List.of();
        }

        UserAccount currentUser = currentUserAccountService.getCurrentUserAccount();
        Set<UUID> authorizedOwnerIds = owners.stream()
                .filter(owner -> deletionAuthorizationPolicy.canDelete(
                        currentUser,
                        owner.getCreatedBy(),
                        owner.getCreatedAt()))
                .map(Owner::getId)
                .collect(Collectors.toSet());
        Set<UUID> catBlockedOwnerIds = authorizedOwnerIds.isEmpty()
                ? Set.of()
                : ownerRepository.findOwnerIdsReferencedByCats(authorizedOwnerIds);

        Set<UUID> stayCandidates = new HashSet<>(authorizedOwnerIds);
        stayCandidates.removeAll(catBlockedOwnerIds);
        Set<UUID> stayBlockedOwnerIds = stayCandidates.isEmpty()
                ? Set.of()
                : stayRepository.findOwnerIdsReferencedByStays(stayCandidates);

        return owners.stream()
                .map(owner -> ownerMapper.toResponseDTO(
                        owner,
                        authorizedOwnerIds.contains(owner.getId())
                                && !catBlockedOwnerIds.contains(owner.getId())
                                && !stayBlockedOwnerIds.contains(owner.getId())))
                .toList();
    }

    @Override
    public OwnerResponseDTO getOwner(UUID id) {
        return toResponseDTO(getEntity(id));
    }

    @Override
    @Transactional(readOnly = true)
    public LookupPageResponseDTO<OwnerLookupOptionDTO> searchLookupOptions(String query, int page) {
        var candidates = ownerRepository.searchLookupCandidates(
                query,
                LookupPageSupport.pageRequest(query, page));
        var catsByOwner = catsByOwner(candidates.getContent().stream()
                .map(OwnerLookupCandidateProjection::getId)
                .toList());
        return LookupPageSupport.toResponse(candidates.map(candidate -> toLookupOption(
                candidate,
                catsByOwner.getOrDefault(candidate.getId(), List.of()))));
    }

    @Override
    @Transactional(readOnly = true)
    public OwnerLookupOptionDTO getLookupOption(UUID id) {
        OwnerLookupCandidateProjection candidate = ownerRepository.findLookupCandidateById(id);
        if (candidate == null) {
            throw new ResourceNotFoundException("Owner", id);
        }
        return toLookupOption(candidate, catsByOwner(List.of(id)).getOrDefault(id, List.of()));
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

    private java.util.Map<UUID, List<OwnerLookupCatDTO>> catsByOwner(List<UUID> ownerIds) {
        if (ownerIds.isEmpty()) {
            return java.util.Map.of();
        }
        java.util.Map<UUID, List<OwnerLookupCatDTO>> result = new LinkedHashMap<>();
        for (OwnerLookupCatProjection cat : ownerRepository.findLookupCats(ownerIds)) {
            result.computeIfAbsent(cat.getOwnerId(), ignored -> new java.util.ArrayList<>())
                    .add(new OwnerLookupCatDTO(cat.getId(), cat.getName()));
        }
        return result;
    }

    private OwnerLookupOptionDTO toLookupOption(
            OwnerLookupCandidateProjection candidate,
            List<OwnerLookupCatDTO> cats) {
        return new OwnerLookupOptionDTO(candidate.getId(), candidate.getFullName(), cats);
    }

}
