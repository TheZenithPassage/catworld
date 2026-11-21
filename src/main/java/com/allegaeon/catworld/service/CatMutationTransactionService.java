package com.allegaeon.catworld.service;

import com.allegaeon.catworld.dto.CatRequestDTO;
import com.allegaeon.catworld.exception.CatPhotoErrorCode;
import com.allegaeon.catworld.exception.CatPhotoException;
import com.allegaeon.catworld.exception.ResourceNotFoundException;
import com.allegaeon.catworld.exception.StaleCatEditException;
import com.allegaeon.catworld.mapper.CatMapper;
import com.allegaeon.catworld.model.*;
import com.allegaeon.catworld.repository.*;
import com.allegaeon.catworld.security.CurrentUserAccountService;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CatMutationTransactionService {
    private final CatRepository catRepository;
    private final CatPhotoRepository catPhotoRepository;
    private final CatInformationalPhotoRepository informationalPhotos;
    private final OwnerRepository ownerRepository;
    private final VetRepository vetRepository;
    private final CatMapper catMapper;
    private final CurrentUserAccountService currentUserAccountService;
    private final EntityManager entityManager;
    private final CatProfileOptionService profileOptions;
    private final Clock clock;

    @Transactional
    public Cat create(CatRequestDTO request, NormalizedCatPhoto photo) {
        return create(request, photo, List.of());
    }

    @Transactional
    public Cat create(CatRequestDTO request, NormalizedCatPhoto photo, List<NormalizedCatPhoto> additions) {
        return create(request, photo, additions, Map.of());
    }

    // Intake manages its own transaction and can apply previously submitted catalog selections.
    Cat create(CatRequestDTO request, NormalizedCatPhoto photo, Map<String, UUID> reviewedOptions) {
        return create(request, photo, List.of(), reviewedOptions);
    }

    private Cat create(CatRequestDTO request, NormalizedCatPhoto photo, List<NormalizedCatPhoto> additions,
                       Map<String, UUID> reviewedOptions) {
        Cat cat = catMapper.toEntity(request, owner(request.getOwnerId()), vet(request.getVetId()));
        cat.setCreatedBy(currentUserAccountService.getCurrentUserAccount());
        profileOptions.applyProfile(cat, request, reviewedOptions);
        cat = catRepository.saveAndFlush(cat);
        if (photo != null) catPhotoRepository.save(toEntity(cat.getId(), photo));
        addInformationalPhotos(cat, additions);
        entityManager.refresh(cat);
        return cat;
    }

    @Transactional
    public Cat update(UUID id, CatRequestDTO request, NormalizedCatPhoto photo, boolean removePhoto) {
        return update(id, request, photo, removePhoto, List.of());
    }

    @Transactional
    public Cat update(UUID id, CatRequestDTO request, NormalizedCatPhoto photo, boolean removePhoto,
                      List<NormalizedCatPhoto> additions) {
        if (photo != null && removePhoto) {
            throw new CatPhotoException(CatPhotoErrorCode.CAT_PHOTO_INTENT_CONFLICT);
        }
        Cat cat = catRepository.findByIdForUpdate(id)
                .orElseThrow(() -> new ResourceNotFoundException("Cat", id));
        if (!Objects.equals(cat.getUpdatedAt(), request.getExpectedUpdatedAt())) {
            throw new StaleCatEditException();
        }
        applyProfile(cat, request, Map.of());
        Set<UUID> removals = request.getRemovedInformationalPhotoIds();
        if (removePhoto || photo != null || !additions.isEmpty() || (removals != null && !removals.isEmpty())) {
            cat.setUpdatedAt(Instant.now());
        }
        if (removePhoto) catPhotoRepository.deleteById(id);
        else if (photo != null) catPhotoRepository.save(toEntity(id, photo));
        if (removals != null) {
            for (UUID photoId : removals) {
                if (informationalPhotos.deletePhoto(id, photoId) == 0) {
                    throw new ResourceNotFoundException("Cat informational photo", photoId);
                }
            }
        }
        addInformationalPhotos(cat, additions);
        entityManager.flush();
        entityManager.refresh(cat);
        return cat;
    }

    private void addInformationalPhotos(Cat cat, List<NormalizedCatPhoto> additions) {
        if (additions.isEmpty()) return;
        Instant uploadedAt = clock.instant();
        informationalPhotos.saveAll(additions.stream()
                .map(photo -> new CatInformationalPhoto(cat, uploadedAt, photo.bytes())).toList());
    }

    // The caller holds the write lock in its transaction.
    void applyProfile(Cat cat, CatRequestDTO request, Map<String, UUID> reviewedOptions) {
        catMapper.updateEntity(cat, request, owner(request.getOwnerId()), vet(request.getVetId()));
        profileOptions.applyProfile(cat, request, reviewedOptions);
    }

    private Owner owner(UUID id) {
        return ownerRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Owner", id));
    }

    private Vet vet(UUID id) {
        return id == null ? null : vetRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Vet", id));
    }

    private CatPhoto toEntity(UUID id, NormalizedCatPhoto photo) {
        return CatPhoto.builder().catId(id).content(photo.bytes()).width(photo.width())
                .height(photo.height()).byteSize(photo.bytes().length).sha256(photo.sha256()).build();
    }
}
