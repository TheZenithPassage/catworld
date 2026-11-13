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

import java.time.Instant;
import java.util.Objects;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CatMutationTransactionService {
    private final CatRepository catRepository;
    private final CatPhotoRepository catPhotoRepository;
    private final OwnerRepository ownerRepository;
    private final VetRepository vetRepository;
    private final CatMapper catMapper;
    private final CurrentUserAccountService currentUserAccountService;
    private final EntityManager entityManager;

    @Transactional
    public Cat create(CatRequestDTO request, NormalizedCatPhoto photo) {
        Cat cat = catMapper.toEntity(request, owner(request.getOwnerId()), vet(request.getVetId()));
        cat.setCreatedBy(currentUserAccountService.getCurrentUserAccount());
        cat = catRepository.saveAndFlush(cat);
        if (photo != null) catPhotoRepository.save(toEntity(cat.getId(), photo));
        entityManager.refresh(cat);
        return cat;
    }

    @Transactional
    public Cat update(UUID id, CatRequestDTO request, NormalizedCatPhoto photo, boolean removePhoto) {
        if (photo != null && removePhoto) {
            throw new CatPhotoException(CatPhotoErrorCode.CAT_PHOTO_INTENT_CONFLICT);
        }
        Cat cat = catRepository.findByIdForUpdate(id)
                .orElseThrow(() -> new ResourceNotFoundException("Cat", id));
        if (!Objects.equals(cat.getUpdatedAt(), request.getExpectedUpdatedAt())) {
            throw new StaleCatEditException();
        }
        applyProfile(cat, request);
        // A profile photo change must also advance the timestamp on the cat row.
        if (removePhoto || photo != null) cat.setUpdatedAt(Instant.now());
        if (removePhoto) catPhotoRepository.deleteById(id);
        else if (photo != null) catPhotoRepository.save(toEntity(id, photo));
        entityManager.flush();
        entityManager.refresh(cat);
        return cat;
    }

    // The caller holds the write lock in its transaction.
    void applyProfile(Cat cat, CatRequestDTO request) {
        catMapper.updateEntity(cat, request, owner(request.getOwnerId()), vet(request.getVetId()));
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
