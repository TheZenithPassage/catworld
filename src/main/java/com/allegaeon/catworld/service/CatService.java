package com.allegaeon.catworld.service;

import com.allegaeon.catworld.dto.CatRequestDTO;
import com.allegaeon.catworld.dto.CatResponseDTO;
import com.allegaeon.catworld.dto.CatPhotoContent;
import com.allegaeon.catworld.dto.relationship.*;
import com.allegaeon.catworld.dto.lookup.*;
import com.allegaeon.catworld.exception.BadRequestException;
import com.allegaeon.catworld.exception.ConflictException;
import com.allegaeon.catworld.exception.ResourceNotFoundException;
import com.allegaeon.catworld.mapper.CatMapper;
import com.allegaeon.catworld.model.Cat;
import com.allegaeon.catworld.model.Owner;
import com.allegaeon.catworld.model.UserAccount;
import com.allegaeon.catworld.model.Vet;
import com.allegaeon.catworld.repository.CatRepository;
import com.allegaeon.catworld.repository.CatPhotoRepository;
import com.allegaeon.catworld.repository.OwnerRepository;
import com.allegaeon.catworld.repository.StayCatRepository;
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
import org.springframework.web.multipart.MultipartFile;

@RequiredArgsConstructor
@Service
public class CatService implements ICatService{

    private static final int LOOKUP_PAGE_SIZE = 5;
    private static final Sort LOOKUP_ORDER = Sort.by(Sort.Order.asc("name"), Sort.Order.asc("id"));

    private final CatRepository catRepository;
    private final CatMapper catMapper;
    private final OwnerRepository ownerRepository;
    private final VetRepository vetRepository;
    private final CurrentUserAccountService currentUserAccountService;
    private final DeletionAuthorizationPolicy deletionAuthorizationPolicy;
    private final StayCatRepository stayCatRepository;
    private final CatPhotoRepository catPhotoRepository;
    private final LibVipsCatPhotoNormalizer photoNormalizer;
    private final CatMutationTransactionService mutationTransactionService;

    @Override
    public List<CatResponseDTO> getAllCats() {
        List<Cat> cats = catRepository.findAll();
        if (cats.isEmpty()) {
            return List.of();
        }

        UserAccount currentUser = currentUserAccountService.getCurrentUserAccount();
        Set<UUID> authorizedCatIds = cats.stream()
                .filter(cat -> deletionAuthorizationPolicy.canDelete(
                        currentUser,
                        cat.getCreatedBy(),
                        cat.getCreatedAt()))
                .map(Cat::getId)
                .collect(Collectors.toSet());
        Set<UUID> blockedCatIds = authorizedCatIds.isEmpty()
                ? Set.of()
                : stayCatRepository.findCatIdsWithStayHistory(authorizedCatIds);
        Set<UUID> foundPhotoCatIds = catPhotoRepository.findPresentCatIds(
                cats.stream().map(Cat::getId).toList());
        Set<UUID> photoCatIds = foundPhotoCatIds == null ? Set.of() : foundPhotoCatIds;

        return cats.stream()
                .map(cat -> mapResponse(cat,
                        authorizedCatIds.contains(cat.getId()) && !blockedCatIds.contains(cat.getId()),
                        photoCatIds.contains(cat.getId())))
                .toList();
    }

    @Override
    public CatResponseDTO getCat(UUID id) {
        return toResponseDTO(getCatEntity(id));
    }

    @Override
    @Transactional(readOnly = true)
    public LookupPage<CatLookupItem> searchCats(String query, int page) {
        String trimmed = requireLookupInput(query, page);
        Page<Cat> cats = catRepository.search(trimmed, PageRequest.of(page, LOOKUP_PAGE_SIZE, LOOKUP_ORDER));
        return new LookupPage<>(cats.stream().map(cat -> new CatLookupItem(cat.getId(), cat.getName(),
                        cat.getOwner().getId(), cat.getOwner().getFullName())).toList(),
                page, LOOKUP_PAGE_SIZE, cats.getTotalElements());
    }

    @Override
    @Transactional(readOnly = true)
    public CatDetailResponse getCatDetail(UUID id) {
        Cat cat = getCatEntity(id);
        Page<com.allegaeon.catworld.model.Stay> stays = stayCatRepository.findStaysByCatId(
                id, PageRequest.of(0, 4));
        return new CatDetailResponse(toResponseDTO(cat),
                RelationshipResponses.preview(stays, RelationshipResponses::stay));
    }

    @Override
    @Transactional(readOnly = true)
    public RelationshipPage<StayRelationshipItem> getCatStays(UUID id, int page) {
        getCatEntity(id);
        RelationshipResponses.requireValidPage(page);
        return RelationshipResponses.page(
                stayCatRepository.findStaysByCatId(id,
                        PageRequest.of(page, RelationshipResponses.PAGE_SIZE)),
                RelationshipResponses::stay);
    }

    @Override
    public CatResponseDTO createCat(CatRequestDTO catRequestDTO, MultipartFile photo) {
        NormalizedCatPhoto normalized = photoNormalizer.normalize(photo);
        return toResponseDTO(mutationTransactionService.create(catRequestDTO, normalized));
    }

    @Override
    public CatResponseDTO createCat(CatRequestDTO catRequestDTO) {
        return createCat(catRequestDTO, null);
    }

    @Override
    public CatResponseDTO updateCat(UUID id, CatRequestDTO catRequestDTO, MultipartFile photo, boolean removePhoto) {
        if (photo != null && removePhoto) {
            throw new com.allegaeon.catworld.exception.CatPhotoException(
                    com.allegaeon.catworld.exception.CatPhotoErrorCode.CAT_PHOTO_INTENT_CONFLICT);
        }
        NormalizedCatPhoto normalized = photoNormalizer.normalize(photo);
        return toResponseDTO(mutationTransactionService.update(id, catRequestDTO, normalized, removePhoto));
    }

    @Override
    public CatResponseDTO updateCat(UUID id, CatRequestDTO catRequestDTO) {
        return updateCat(id, catRequestDTO, null, false);
    }

    @Override
    @Transactional(readOnly = true)
    public CatPhotoContent getPhoto(UUID id) {
        if (!catRepository.existsById(id)) throw new ResourceNotFoundException("Cat", id);
        var photo = catPhotoRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Cat", id));
        return new CatPhotoContent(photo.getContent().clone(), "\"" + photo.getSha256() + "\"");
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

        return mapResponse(cat, canDelete, catPhotoRepository.existsById(cat.getId()));
    }

    private CatResponseDTO mapResponse(Cat cat, boolean canDelete, boolean hasPhoto) {
        return hasPhoto ? catMapper.toResponseDTO(cat, canDelete, true) : catMapper.toResponseDTO(cat, canDelete);
    }

    private String requireLookupInput(String query, int page) {
        if (page < 0) throw new BadRequestException("Page must not be negative");
        String trimmed = query == null ? "" : query.trim();
        if (trimmed.isEmpty()) throw new BadRequestException("Search query must not be empty");
        return escapeLookupQuery(trimmed);
    }

    private String escapeLookupQuery(String query) {
        return query.replace("!", "!!").replace("%", "!%").replace("_", "!_");
    }

}
