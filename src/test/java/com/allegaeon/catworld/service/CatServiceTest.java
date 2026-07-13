package com.allegaeon.catworld.service;

import com.allegaeon.catworld.dto.CatRequestDTO;
import com.allegaeon.catworld.dto.CatResponseDTO;
import com.allegaeon.catworld.exception.ConflictException;
import com.allegaeon.catworld.exception.ForbiddenException;
import com.allegaeon.catworld.exception.ResourceNotFoundException;
import com.allegaeon.catworld.mapper.CatMapper;
import com.allegaeon.catworld.model.Cat;
import com.allegaeon.catworld.model.Owner;
import com.allegaeon.catworld.model.Sex;
import com.allegaeon.catworld.model.UserAccount;
import com.allegaeon.catworld.repository.CatRepository;
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

import java.time.Instant;
import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
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

    @InjectMocks
    private CatService service;

    @Captor
    private ArgumentCaptor<Cat> catCaptor;

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

        when(ownerRepository.findById(owner.getId())).thenReturn(Optional.of(owner));
        when(catMapper.toEntity(request, owner, null)).thenReturn(mappedCat);
        when(currentUserAccountService.getCurrentUserAccount()).thenReturn(creator);
        when(catRepository.save(any(Cat.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(catMapper.toResponseDTO(mappedCat, false)).thenReturn(expectedResponse);

        CatResponseDTO result = service.createCat(request);

        assertSame(expectedResponse, result);
        verify(catRepository).save(catCaptor.capture());
        assertSame(creator, catCaptor.getValue().getCreatedBy());
        verify(deletionAuthorizationPolicy).canDelete(creator, null);
        verifyNoInteractions(stayCatRepository);
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
        when(catMapper.toResponseDTO(cat, true)).thenReturn(expected);

        CatResponseDTO result = service.getCat(catId);

        assertSame(expected, result);
        var ordered = inOrder(deletionAuthorizationPolicy, stayCatRepository, catMapper);
        ordered.verify(deletionAuthorizationPolicy).canDelete(creator, CREATED_AT);
        ordered.verify(stayCatRepository).existsByCat_Id(catId);
        ordered.verify(catMapper).toResponseDTO(cat, true);
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
