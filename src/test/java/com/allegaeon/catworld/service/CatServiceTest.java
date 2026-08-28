package com.allegaeon.catworld.service;

import com.allegaeon.catworld.dto.CatRequestDTO;
import com.allegaeon.catworld.dto.CatResponseDTO;
import com.allegaeon.catworld.dto.relationship.*;
import com.allegaeon.catworld.dto.lookup.*;
import com.allegaeon.catworld.exception.BadRequestException;
import com.allegaeon.catworld.exception.ConflictException;
import com.allegaeon.catworld.exception.ForbiddenException;
import com.allegaeon.catworld.exception.ResourceNotFoundException;
import com.allegaeon.catworld.exception.CatPhotoException;
import com.allegaeon.catworld.exception.CatPhotoErrorCode;
import com.allegaeon.catworld.mapper.CatMapper;
import com.allegaeon.catworld.model.Cat;
import com.allegaeon.catworld.model.Owner;
import com.allegaeon.catworld.model.Sex;
import com.allegaeon.catworld.model.UserAccount;
import com.allegaeon.catworld.repository.CatRepository;
import com.allegaeon.catworld.repository.CatPhotoRepository;
import com.allegaeon.catworld.repository.OwnerRepository;
import com.allegaeon.catworld.repository.StayCatRepository;
import com.allegaeon.catworld.repository.VetRepository;
import com.allegaeon.catworld.security.CurrentUserAccountService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.mock.web.MockMultipartFile;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CatServiceTest {

    private static final Instant CREATED_AT = Instant.parse("2026-07-05T11:50:00Z");

    @Mock
    private CatRepository catRepository;

    @Mock
    private CatMapper catMapper;

    @Mock
    private OwnerRepository ownerRepository;

    @Mock
    private VetRepository vetRepository;

    @Mock
    private CurrentUserAccountService currentUserAccountService;

    @Mock
    private DeletionAuthorizationPolicy deletionAuthorizationPolicy;

    @Mock
    private StayCatRepository stayCatRepository;

    @Mock
    private CatPhotoRepository catPhotoRepository;

    @Mock
    private LibVipsCatPhotoNormalizer photoNormalizer;

    @Mock
    private CatMutationTransactionService mutationTransactionService;

    @InjectMocks
    private CatService service;

    @Captor
    private ArgumentCaptor<Cat> catCaptor;

    @Test
    void catLookupValidatesEscapesAndMapsOnlyCatMatchesWithOwnerContext() {
        assertThrows(BadRequestException.class, () -> service.searchCats(" ", 0));
        assertThrows(BadRequestException.class, () -> service.searchCats("m", -1));
        Owner owner = Owner.builder().id(UUID.randomUUID()).fullName("Owner context").build();
        Cat cat = Cat.builder().id(UUID.randomUUID()).name("Milo").owner(owner).build();
        when(catRepository.search(eq("m!%!_!!"), any(Pageable.class))).thenReturn(new PageImpl<>(List.of(cat),
                org.springframework.data.domain.PageRequest.of(0, 5), 8));

        LookupPage<CatLookupItem> result = service.searchCats(" m%_! ", 0);

        assertEquals(5, result.pageSize());
        assertEquals(8, result.totalElements());
        assertEquals(new CatLookupItem(cat.getId(), "Milo", owner.getId(), "Owner context"),
                result.items().getFirst());
    }

    @Test
    void catDetailUsesEmptyPreviewForZeroAndTypedStatusForHistory() {
        UUID id = UUID.randomUUID();
        Cat cat = cat(id, creator());
        CatResponseDTO response = CatResponseDTO.builder().id(id).ownerId(UUID.randomUUID())
                .ownerName("Owner").vetId(UUID.randomUUID()).vetName("Vet").build();
        when(catRepository.findById(id)).thenReturn(Optional.of(cat));
        when(catMapper.toResponseDTO(cat, false)).thenReturn(response);
        when(stayCatRepository.findStaysByCatId(eq(id), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of()));

        CatDetailResponse empty = service.getCatDetail(id);

        assertSame(response, empty.cat());
        assertEquals(0, empty.stays().totalElements());
        assertEquals(List.of(), empty.stays().items());

        var stay = com.allegaeon.catworld.model.Stay.builder().id(UUID.randomUUID())
                .startAt(LocalDateTime.now().minusDays(2)).endAt(LocalDateTime.now().minusDays(1))
                .cancelledAt(LocalDateTime.now().minusDays(1)).build();
        when(stayCatRepository.findStaysByCatId(eq(id), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(stay)));
        assertEquals(com.allegaeon.catworld.model.StayStatus.CANCELLED,
                service.getCatDetail(id).stays().items().get(0).status());
    }

    @Test
    void catPageValidatesAfterParentLookupAndReturnsAuthoritativeOutOfRangeEnvelope() {
        UUID missing = UUID.randomUUID();
        when(catRepository.findById(missing)).thenReturn(Optional.empty());
        assertThrows(ResourceNotFoundException.class, () -> service.getCatStays(missing, -1));
        verifyNoInteractions(stayCatRepository);

        UUID id = UUID.randomUUID();
        when(catRepository.findById(id)).thenReturn(Optional.of(cat(id, creator())));
        assertThrows(BadRequestException.class, () -> service.getCatStays(id, -1));
        when(stayCatRepository.findStaysByCatId(eq(id), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(), org.springframework.data.domain.PageRequest.of(3, 5), 11));
        RelationshipPage<StayRelationshipItem> result = service.getCatStays(id, 3);
        assertEquals(5, result.pageSize());
        assertEquals(11, result.totalElements());
        assertEquals(3, result.totalPages());
        assertEquals(List.of(), result.items());
    }

    @Test
    void createCatAssignsAuthenticatedCreator() {
        UserAccount creator = creator();
        Owner owner = Owner.builder()
                .id(UUID.randomUUID())
                .fullName("John Owner")
                .build();
        CatRequestDTO request = CatRequestDTO.builder()
                .name("Milo")
                .birthDate(LocalDate.of(2020, 1, 1))
                .sex(Sex.MALE)
                .ownerId(owner.getId())
                .build();
        Cat mappedCat = Cat.builder()
                .name(request.getName())
                .birthDate(request.getBirthDate())
                .sex(request.getSex())
                .owner(owner)
                .build();
        CatResponseDTO expectedResponse = CatResponseDTO.builder()
                .id(UUID.randomUUID())
                .name(request.getName())
                .birthDate(request.getBirthDate())
                .sex(request.getSex())
                .ownerId(owner.getId())
                .canDelete(false)
                .build();

        mappedCat.setCreatedBy(creator);
        when(mutationTransactionService.create(request, null)).thenReturn(mappedCat);
        when(catMapper.toResponseDTO(mappedCat, false)).thenReturn(expectedResponse);

        CatResponseDTO result = service.createCat(request);

        assertSame(expectedResponse, result);
        verify(mutationTransactionService).create(request, null);
        verify(deletionAuthorizationPolicy).canDelete(creator, null);
        verifyNoInteractions(stayCatRepository);
    }

    @Test
    void getAllCatsUsesOneAccountLookupAndOneBulkHistoryLookupForEligibleCats() {
        UserAccount currentUser = creator();
        Cat deletable = cat(UUID.randomUUID(), creator());
        Cat historyBlocked = cat(UUID.randomUUID(), creator());
        Cat unauthorized = cat(UUID.randomUUID(), creator());
        CatResponseDTO deletableResponse = CatResponseDTO.builder()
                .id(deletable.getId())
                .canDelete(true)
                .build();
        CatResponseDTO historyBlockedResponse = CatResponseDTO.builder()
                .id(historyBlocked.getId())
                .canDelete(false)
                .build();
        CatResponseDTO unauthorizedResponse = CatResponseDTO.builder()
                .id(unauthorized.getId())
                .canDelete(false)
                .build();
        Set<UUID> eligibleIds = Set.of(deletable.getId(), historyBlocked.getId());

        when(catRepository.findAll()).thenReturn(List.of(deletable, historyBlocked, unauthorized));
        when(currentUserAccountService.getCurrentUserAccount()).thenReturn(currentUser);
        when(deletionAuthorizationPolicy.canDelete(
                currentUser,
                deletable.getCreatedBy(),
                CREATED_AT)).thenReturn(true);
        when(deletionAuthorizationPolicy.canDelete(
                currentUser,
                historyBlocked.getCreatedBy(),
                CREATED_AT)).thenReturn(true);
        when(deletionAuthorizationPolicy.canDelete(
                currentUser,
                unauthorized.getCreatedBy(),
                CREATED_AT)).thenReturn(false);
        when(stayCatRepository.findCatIdsWithStayHistory(eligibleIds))
                .thenReturn(Set.of(historyBlocked.getId()));
        when(catPhotoRepository.findPresentCatIds(List.of(deletable.getId(), historyBlocked.getId(), unauthorized.getId())))
                .thenReturn(Set.of(deletable.getId()));
        when(catMapper.toResponseDTO(deletable, true, true)).thenReturn(deletableResponse);
        when(catMapper.toResponseDTO(historyBlocked, false)).thenReturn(historyBlockedResponse);
        when(catMapper.toResponseDTO(unauthorized, false)).thenReturn(unauthorizedResponse);

        List<CatResponseDTO> result = service.getAllCats();

        assertEquals(List.of(deletableResponse, historyBlockedResponse, unauthorizedResponse), result);
        verify(currentUserAccountService, times(1)).getCurrentUserAccount();
        verify(stayCatRepository, times(1)).findCatIdsWithStayHistory(eligibleIds);
        verify(stayCatRepository, times(1)).findCatIdsWithStayHistory(any());
        verify(stayCatRepository, never()).existsByCat_Id(any(UUID.class));
        verify(catPhotoRepository).findPresentCatIds(List.of(deletable.getId(), historyBlocked.getId(), unauthorized.getId()));
        verify(catPhotoRepository, never()).findById(any(UUID.class));
        verify(catPhotoRepository, never()).existsById(any(UUID.class));
        verify(deletionAuthorizationPolicy, never()).canDelete(any(UserAccount.class), any(Instant.class));
    }

    @Test
    void getAllCatsSkipsHistoryLookupWhenNoCatIsAuthorized() {
        UserAccount currentUser = creator();
        Cat first = cat(UUID.randomUUID(), creator());
        Cat second = cat(UUID.randomUUID(), creator());
        CatResponseDTO firstResponse = CatResponseDTO.builder()
                .id(first.getId())
                .canDelete(false)
                .build();
        CatResponseDTO secondResponse = CatResponseDTO.builder()
                .id(second.getId())
                .canDelete(false)
                .build();

        when(catRepository.findAll()).thenReturn(List.of(first, second));
        when(currentUserAccountService.getCurrentUserAccount()).thenReturn(currentUser);
        when(deletionAuthorizationPolicy.canDelete(currentUser, first.getCreatedBy(), CREATED_AT))
                .thenReturn(false);
        when(deletionAuthorizationPolicy.canDelete(currentUser, second.getCreatedBy(), CREATED_AT))
                .thenReturn(false);
        when(catMapper.toResponseDTO(first, false)).thenReturn(firstResponse);
        when(catMapper.toResponseDTO(second, false)).thenReturn(secondResponse);

        assertEquals(List.of(firstResponse, secondResponse), service.getAllCats());

        verify(currentUserAccountService, times(1)).getCurrentUserAccount();
        verify(stayCatRepository, never()).findCatIdsWithStayHistory(any());
        verify(stayCatRepository, never()).existsByCat_Id(any(UUID.class));
    }

    @Test
    void deleteCatStopsAfterMissingLookup() {
        UUID catId = UUID.randomUUID();
        when(catRepository.findById(catId)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> service.deleteCat(catId));

        verifyNoInteractions(deletionAuthorizationPolicy, stayCatRepository);
        verify(catRepository, never()).delete(any(Cat.class));
        verify(catRepository, never()).flush();
    }

    @Test
    void deleteCatChecksAuthorizationBeforeHistoryAndFlushesDelete() {
        UUID catId = UUID.randomUUID();
        UserAccount creator = creator();
        Cat cat = cat(catId, creator);

        when(catRepository.findById(catId)).thenReturn(Optional.of(cat));
        when(stayCatRepository.existsByCat_Id(catId)).thenReturn(false);

        service.deleteCat(catId);

        var ordered = inOrder(catRepository, deletionAuthorizationPolicy, stayCatRepository);
        ordered.verify(catRepository).findById(catId);
        ordered.verify(deletionAuthorizationPolicy).authorize(creator, CREATED_AT);
        ordered.verify(stayCatRepository).existsByCat_Id(catId);
        ordered.verify(catRepository).delete(cat);
        ordered.verify(catRepository).flush();
    }

    @Test
    void deleteCatDoesNotInspectHistoryWhenAuthorizationFails() {
        UUID catId = UUID.randomUUID();
        UserAccount creator = creator();
        Cat cat = cat(catId, creator);

        when(catRepository.findById(catId)).thenReturn(Optional.of(cat));
        doThrow(new ForbiddenException("Forbidden"))
                .when(deletionAuthorizationPolicy).authorize(creator, CREATED_AT);

        assertThrows(ForbiddenException.class, () -> service.deleteCat(catId));

        verifyNoInteractions(stayCatRepository);
        verify(catRepository, never()).delete(any(Cat.class));
        verify(catRepository, never()).flush();
    }

    @ParameterizedTest(name = "blocks deletion when {0} stay history exists")
    @ValueSource(strings = {"active or future", "cancelled", "completed or historical"})
    void deleteCatRejectsEveryKindOfStayHistory(String historyState) {
        UUID catId = UUID.randomUUID();
        Cat cat = cat(catId, creator());

        when(catRepository.findById(catId)).thenReturn(Optional.of(cat));
        when(stayCatRepository.existsByCat_Id(catId)).thenReturn(true);

        ConflictException exception = assertThrows(
                ConflictException.class,
                () -> service.deleteCat(catId),
                historyState);

        assertEquals("Cat cannot be deleted because it has stay history", exception.getMessage());
        verify(catRepository, never()).delete(any(Cat.class));
        verify(catRepository, never()).flush();
    }

    @Test
    void deleteCatTranslatesDataIntegrityConflict() {
        UUID catId = UUID.randomUUID();
        Cat cat = cat(catId, creator());

        when(catRepository.findById(catId)).thenReturn(Optional.of(cat));
        when(stayCatRepository.existsByCat_Id(catId)).thenReturn(false);
        doThrow(new DataIntegrityViolationException("fk conflict"))
                .when(catRepository).delete(cat);

        ConflictException exception = assertThrows(
                ConflictException.class,
                () -> service.deleteCat(catId));

        assertEquals("Cat cannot be deleted because of a data conflict", exception.getMessage());
        verify(catRepository, never()).flush();
    }

    @Test
    void deleteCatTranslatesOptimisticConflictRaisedByFlush() {
        UUID catId = UUID.randomUUID();
        Cat cat = cat(catId, creator());

        when(catRepository.findById(catId)).thenReturn(Optional.of(cat));
        when(stayCatRepository.existsByCat_Id(catId)).thenReturn(false);
        doThrow(new OptimisticLockingFailureException("concurrent change"))
                .when(catRepository).flush();

        ConflictException exception = assertThrows(
                ConflictException.class,
                () -> service.deleteCat(catId));

        assertEquals("Cat cannot be deleted because of a data conflict", exception.getMessage());
        verify(catRepository).delete(cat);
        verify(catRepository).flush();
    }

    @Test
    void getCatMarksCanDeleteWhenAuthorizationPassesAndHistoryIsAbsent() {
        UUID catId = UUID.randomUUID();
        UserAccount creator = creator();
        Cat cat = cat(catId, creator);
        CatResponseDTO expected = CatResponseDTO.builder()
                .id(catId)
                .canDelete(true)
                .build();

        when(catRepository.findById(catId)).thenReturn(Optional.of(cat));
        when(deletionAuthorizationPolicy.canDelete(creator, CREATED_AT)).thenReturn(true);
        when(stayCatRepository.existsByCat_Id(catId)).thenReturn(false);
        when(catPhotoRepository.existsById(catId)).thenReturn(true);
        when(catMapper.toResponseDTO(cat, true, true)).thenReturn(expected);

        CatResponseDTO result = service.getCat(catId);

        assertSame(expected, result);
        var ordered = inOrder(deletionAuthorizationPolicy, stayCatRepository, catMapper);
        ordered.verify(deletionAuthorizationPolicy).canDelete(creator, CREATED_AT);
        ordered.verify(stayCatRepository).existsByCat_Id(catId);
        ordered.verify(catMapper).toResponseDTO(cat, true, true);
    }

    @Test
    void getCatShortCircuitsHistoryWhenAuthorizationFails() {
        UUID catId = UUID.randomUUID();
        UserAccount creator = creator();
        Cat cat = cat(catId, creator);
        CatResponseDTO expected = CatResponseDTO.builder()
                .id(catId)
                .canDelete(false)
                .build();

        when(catRepository.findById(catId)).thenReturn(Optional.of(cat));
        when(deletionAuthorizationPolicy.canDelete(creator, CREATED_AT)).thenReturn(false);
        when(catMapper.toResponseDTO(cat, false)).thenReturn(expected);

        CatResponseDTO result = service.getCat(catId);

        assertSame(expected, result);
        verifyNoInteractions(stayCatRepository);
        verify(catMapper).toResponseDTO(cat, false);
    }

    @Test
    void getCatMarksCanDeleteFalseWhenHistoryExists() {
        UUID catId = UUID.randomUUID();
        UserAccount creator = creator();
        Cat cat = cat(catId, creator);
        CatResponseDTO expected = CatResponseDTO.builder()
                .id(catId)
                .canDelete(false)
                .build();

        when(catRepository.findById(catId)).thenReturn(Optional.of(cat));
        when(deletionAuthorizationPolicy.canDelete(creator, CREATED_AT)).thenReturn(true);
        when(stayCatRepository.existsByCat_Id(catId)).thenReturn(true);
        when(catMapper.toResponseDTO(cat, false)).thenReturn(expected);

        CatResponseDTO result = service.getCat(catId);

        assertSame(expected, result);
        verify(catMapper).toResponseDTO(cat, false);
    }

    @Test
    void deleteCatRechecksRulesAfterAStalePositiveResponseHint() {
        UUID catId = UUID.randomUUID();
        UserAccount creator = creator();
        Cat cat = cat(catId, creator);
        CatResponseDTO renderedResponse = CatResponseDTO.builder()
                .id(catId)
                .canDelete(true)
                .build();

        when(catRepository.findById(catId)).thenReturn(Optional.of(cat));
        when(deletionAuthorizationPolicy.canDelete(creator, CREATED_AT)).thenReturn(true);
        when(stayCatRepository.existsByCat_Id(catId)).thenReturn(false, true);
        when(catMapper.toResponseDTO(cat, true)).thenReturn(renderedResponse);

        assertSame(renderedResponse, service.getCat(catId));
        assertThrows(ConflictException.class, () -> service.deleteCat(catId));

        verify(deletionAuthorizationPolicy).authorize(creator, CREATED_AT);
        verify(stayCatRepository, times(2)).existsByCat_Id(catId);
        verify(catRepository, never()).delete(any(Cat.class));
        verify(catRepository, never()).flush();
    }

    @Test
    void presentEmptyPhotoIsNormalizedForCreateAndUpdate() {
        CatRequestDTO request = CatRequestDTO.builder().name("Milo").build();
        MockMultipartFile empty = new MockMultipartFile("photo", "empty.png", "image/png", new byte[0]);
        CatPhotoException failure = new CatPhotoException(CatPhotoErrorCode.CAT_PHOTO_UNSUPPORTED_FORMAT);
        when(photoNormalizer.normalize(empty)).thenThrow(failure);

        assertSame(failure, assertThrows(CatPhotoException.class, () -> service.createCat(request, empty)));
        assertSame(failure, assertThrows(CatPhotoException.class,
                () -> service.updateCat(UUID.randomUUID(), request, empty, false)));
        verify(photoNormalizer, times(2)).normalize(empty);
        verifyNoInteractions(mutationTransactionService);
    }

    @Test
    void presentEmptyPhotoConflictsWithRemoveBeforeNormalizationOrMutation() {
        CatRequestDTO request = CatRequestDTO.builder().name("Milo").build();
        MockMultipartFile empty = new MockMultipartFile("photo", "empty.png", "image/png", new byte[0]);

        CatPhotoException failure = assertThrows(CatPhotoException.class,
                () -> service.updateCat(UUID.randomUUID(), request, empty, true));

        assertEquals(CatPhotoErrorCode.CAT_PHOTO_INTENT_CONFLICT, failure.getCode());
        verifyNoInteractions(photoNormalizer, mutationTransactionService);
    }

    private UserAccount creator() {
        return UserAccount.builder()
                .id(UUID.randomUUID())
                .username("staff")
                .build();
    }

    private Cat cat(UUID catId, UserAccount creator) {
        Cat cat = Cat.builder()
                .id(catId)
                .createdBy(creator)
                .build();
        cat.setCreatedAt(CREATED_AT);
        return cat;
    }
}
