package com.allegaeon.catworld.service;

import com.allegaeon.catworld.dto.OwnerRequestDTO;
import com.allegaeon.catworld.dto.OwnerResponseDTO;
import com.allegaeon.catworld.exception.ConflictException;
import com.allegaeon.catworld.exception.ForbiddenException;
import com.allegaeon.catworld.exception.ResourceNotFoundException;
import com.allegaeon.catworld.mapper.OwnerMapper;
import com.allegaeon.catworld.model.Owner;
import com.allegaeon.catworld.model.UserAccount;
import com.allegaeon.catworld.repository.OwnerRepository;
import com.allegaeon.catworld.repository.StayRepository;
import com.allegaeon.catworld.security.CurrentUserAccountService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.InOrder;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.dao.OptimisticLockingFailureException;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.Set;
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
class OwnerServiceTest {

    private static final Instant CREATED_AT = Instant.parse("2026-07-05T11:50:00Z");

    @Mock
    private OwnerRepository ownerRepository;

    @Mock
    private StayRepository stayRepository;

    @Mock
    private OwnerMapper ownerMapper;

    @Mock
    private CurrentUserAccountService currentUserAccountService;

    @Mock
    private DeletionAuthorizationPolicy deletionAuthorizationPolicy;

    @InjectMocks
    private OwnerService service;

    @Captor
    private ArgumentCaptor<Owner> ownerCaptor;

    @Test
    void createOwnerAssignsAuthenticatedCreatorAndCalculatesCanDelete() {
        UserAccount creator = creator("staff");
        OwnerRequestDTO request = OwnerRequestDTO.builder()
                .fullName("John Owner")
                .primaryPhone("123456789")
                .build();
        Owner mappedOwner = owner(UUID.randomUUID(), null);
        mappedOwner.setFullName(request.getFullName());
        mappedOwner.setPrimaryPhone(request.getPrimaryPhone());
        OwnerResponseDTO expectedResponse = OwnerResponseDTO.builder()
                .id(mappedOwner.getId())
                .fullName(request.getFullName())
                .primaryPhone(request.getPrimaryPhone())
                .canDelete(true)
                .build();

        when(ownerMapper.toEntity(request)).thenReturn(mappedOwner);
        when(currentUserAccountService.getCurrentUserAccount()).thenReturn(creator);
        when(ownerRepository.save(any(Owner.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(deletionAuthorizationPolicy.canDelete(creator, CREATED_AT)).thenReturn(true);
        when(ownerRepository.existsByIdAndCatsIsNotEmpty(mappedOwner.getId())).thenReturn(false);
        when(stayRepository.existsByOwner_Id(mappedOwner.getId())).thenReturn(false);
        when(ownerMapper.toResponseDTO(mappedOwner, true)).thenReturn(expectedResponse);

        OwnerResponseDTO result = service.createOwner(request);

        assertSame(expectedResponse, result);
        verify(ownerRepository).save(ownerCaptor.capture());
        assertSame(creator, ownerCaptor.getValue().getCreatedBy());
        verify(ownerMapper).toResponseDTO(mappedOwner, true);
    }

    @Test
    void getAllOwnersUsesBoundedBulkLookupsForEligibleOwners() {
        UserAccount currentUser = creator("current-staff");
        Owner deletable = owner(UUID.randomUUID(), creator("admin"));
        Owner catBlocked = owner(UUID.randomUUID(), creator("cat-blocked"));
        Owner stayBlocked = owner(UUID.randomUUID(), creator("stay-blocked"));
        Owner unauthorized = owner(UUID.randomUUID(), creator("other-staff"));
        OwnerResponseDTO deletableResponse = OwnerResponseDTO.builder()
                .id(deletable.getId())
                .canDelete(true)
                .build();
        OwnerResponseDTO catBlockedResponse = OwnerResponseDTO.builder()
                .id(catBlocked.getId())
                .canDelete(false)
                .build();
        OwnerResponseDTO stayBlockedResponse = OwnerResponseDTO.builder()
                .id(stayBlocked.getId())
                .canDelete(false)
                .build();
        OwnerResponseDTO unauthorizedResponse = OwnerResponseDTO.builder()
                .id(unauthorized.getId())
                .canDelete(false)
                .build();
        Set<UUID> eligibleIds = Set.of(
                deletable.getId(),
                catBlocked.getId(),
                stayBlocked.getId());
        Set<UUID> stayCandidateIds = Set.of(deletable.getId(), stayBlocked.getId());

        when(ownerRepository.findAll())
                .thenReturn(List.of(deletable, catBlocked, stayBlocked, unauthorized));
        when(currentUserAccountService.getCurrentUserAccount()).thenReturn(currentUser);
        when(deletionAuthorizationPolicy.canDelete(
                currentUser,
                deletable.getCreatedBy(),
                CREATED_AT)).thenReturn(true);
        when(deletionAuthorizationPolicy.canDelete(
                currentUser,
                catBlocked.getCreatedBy(),
                CREATED_AT)).thenReturn(true);
        when(deletionAuthorizationPolicy.canDelete(
                currentUser,
                stayBlocked.getCreatedBy(),
                CREATED_AT)).thenReturn(true);
        when(deletionAuthorizationPolicy.canDelete(
                currentUser,
                unauthorized.getCreatedBy(),
                CREATED_AT)).thenReturn(false);
        when(ownerRepository.findOwnerIdsReferencedByCats(eligibleIds))
                .thenReturn(Set.of(catBlocked.getId()));
        when(stayRepository.findOwnerIdsReferencedByStays(stayCandidateIds))
                .thenReturn(Set.of(stayBlocked.getId()));
        when(ownerMapper.toResponseDTO(deletable, true)).thenReturn(deletableResponse);
        when(ownerMapper.toResponseDTO(catBlocked, false)).thenReturn(catBlockedResponse);
        when(ownerMapper.toResponseDTO(stayBlocked, false)).thenReturn(stayBlockedResponse);
        when(ownerMapper.toResponseDTO(unauthorized, false)).thenReturn(unauthorizedResponse);

        List<OwnerResponseDTO> result = service.getAllOwners();

        assertEquals(
                List.of(
                        deletableResponse,
                        catBlockedResponse,
                        stayBlockedResponse,
                        unauthorizedResponse),
                result);
        verify(currentUserAccountService).getCurrentUserAccount();
        verify(ownerRepository).findOwnerIdsReferencedByCats(eligibleIds);
        verify(stayRepository).findOwnerIdsReferencedByStays(stayCandidateIds);
        verify(ownerRepository, times(1)).findOwnerIdsReferencedByCats(any());
        verify(stayRepository, times(1)).findOwnerIdsReferencedByStays(any());
        verify(ownerRepository, never()).existsByIdAndCatsIsNotEmpty(any(UUID.class));
        verify(stayRepository, never()).existsByOwner_Id(any(UUID.class));
        verify(deletionAuthorizationPolicy, never()).canDelete(any(UserAccount.class), any(Instant.class));
    }

    @Test
    void getAllOwnersSkipsRelationshipLookupsWhenNoOwnerIsAuthorized() {
        UserAccount currentUser = creator("current-staff");
        Owner first = owner(UUID.randomUUID(), creator("first"));
        Owner second = owner(UUID.randomUUID(), creator("second"));
        OwnerResponseDTO firstResponse = OwnerResponseDTO.builder()
                .id(first.getId())
                .canDelete(false)
                .build();
        OwnerResponseDTO secondResponse = OwnerResponseDTO.builder()
                .id(second.getId())
                .canDelete(false)
                .build();

        when(ownerRepository.findAll()).thenReturn(List.of(first, second));
        when(currentUserAccountService.getCurrentUserAccount()).thenReturn(currentUser);
        when(deletionAuthorizationPolicy.canDelete(currentUser, first.getCreatedBy(), CREATED_AT))
                .thenReturn(false);
        when(deletionAuthorizationPolicy.canDelete(currentUser, second.getCreatedBy(), CREATED_AT))
                .thenReturn(false);
        when(ownerMapper.toResponseDTO(first, false)).thenReturn(firstResponse);
        when(ownerMapper.toResponseDTO(second, false)).thenReturn(secondResponse);

        assertEquals(List.of(firstResponse, secondResponse), service.getAllOwners());

        verify(currentUserAccountService).getCurrentUserAccount();
        verify(ownerRepository, never()).findOwnerIdsReferencedByCats(any());
        verify(stayRepository, never()).findOwnerIdsReferencedByStays(any());
        verify(ownerRepository, never()).existsByIdAndCatsIsNotEmpty(any(UUID.class));
        verify(stayRepository, never()).existsByOwner_Id(any(UUID.class));
    }

    @Test
    void getOwnerReportsCanDeleteFalseWhenCatReferencesOwner() {
        UUID ownerId = UUID.randomUUID();
        Owner owner = owner(ownerId, creator("staff"));
        OwnerResponseDTO expectedResponse = OwnerResponseDTO.builder()
                .id(ownerId)
                .canDelete(false)
                .build();

        when(ownerRepository.findById(ownerId)).thenReturn(Optional.of(owner));
        when(deletionAuthorizationPolicy.canDelete(owner.getCreatedBy(), CREATED_AT)).thenReturn(true);
        when(ownerRepository.existsByIdAndCatsIsNotEmpty(ownerId)).thenReturn(true);
        when(ownerMapper.toResponseDTO(owner, false)).thenReturn(expectedResponse);

        OwnerResponseDTO result = service.getOwner(ownerId);

        assertSame(expectedResponse, result);
        verifyNoInteractions(stayRepository);
    }

    @Test
    void getOwnerReportsCanDeleteFalseWhenStayReferencesOwner() {
        UUID ownerId = UUID.randomUUID();
        Owner owner = owner(ownerId, creator("staff"));
        OwnerResponseDTO expectedResponse = OwnerResponseDTO.builder()
                .id(ownerId)
                .canDelete(false)
                .build();

        when(ownerRepository.findById(ownerId)).thenReturn(Optional.of(owner));
        when(deletionAuthorizationPolicy.canDelete(owner.getCreatedBy(), CREATED_AT)).thenReturn(true);
        when(ownerRepository.existsByIdAndCatsIsNotEmpty(ownerId)).thenReturn(false);
        when(stayRepository.existsByOwner_Id(ownerId)).thenReturn(true);
        when(ownerMapper.toResponseDTO(owner, false)).thenReturn(expectedResponse);

        OwnerResponseDTO result = service.getOwner(ownerId);

        assertSame(expectedResponse, result);
        InOrder ordered = inOrder(deletionAuthorizationPolicy, ownerRepository, stayRepository, ownerMapper);
        ordered.verify(deletionAuthorizationPolicy).canDelete(owner.getCreatedBy(), CREATED_AT);
        ordered.verify(ownerRepository).existsByIdAndCatsIsNotEmpty(ownerId);
        ordered.verify(stayRepository).existsByOwner_Id(ownerId);
        ordered.verify(ownerMapper).toResponseDTO(owner, false);
    }

    @Test
    void getOwnerShortCircuitsEveryRelationshipWhenAuthorizationFails() {
        UUID ownerId = UUID.randomUUID();
        Owner owner = owner(ownerId, creator("staff"));
        OwnerResponseDTO expectedResponse = OwnerResponseDTO.builder()
                .id(ownerId)
                .canDelete(false)
                .build();

        when(ownerRepository.findById(ownerId)).thenReturn(Optional.of(owner));
        when(deletionAuthorizationPolicy.canDelete(owner.getCreatedBy(), CREATED_AT)).thenReturn(false);
        when(ownerMapper.toResponseDTO(owner, false)).thenReturn(expectedResponse);

        OwnerResponseDTO result = service.getOwner(ownerId);

        assertSame(expectedResponse, result);
        verify(ownerRepository, never()).existsByIdAndCatsIsNotEmpty(ownerId);
        verifyNoInteractions(stayRepository);
    }

    @Test
    void updateOwnerCalculatesCanDeleteForSavedOwner() {
        UUID ownerId = UUID.randomUUID();
        Owner owner = owner(ownerId, creator("staff"));
        OwnerRequestDTO request = OwnerRequestDTO.builder()
                .fullName("Updated Owner")
                .primaryPhone("987654321")
                .build();
        OwnerResponseDTO expectedResponse = OwnerResponseDTO.builder()
                .id(ownerId)
                .fullName(request.getFullName())
                .canDelete(true)
                .build();

        when(ownerRepository.findById(ownerId)).thenReturn(Optional.of(owner));
        when(ownerMapper.updateEntity(owner, request)).thenReturn(owner);
        when(ownerRepository.save(owner)).thenReturn(owner);
        when(deletionAuthorizationPolicy.canDelete(owner.getCreatedBy(), CREATED_AT)).thenReturn(true);
        when(ownerRepository.existsByIdAndCatsIsNotEmpty(ownerId)).thenReturn(false);
        when(stayRepository.existsByOwner_Id(ownerId)).thenReturn(false);
        when(ownerMapper.toResponseDTO(owner, true)).thenReturn(expectedResponse);

        OwnerResponseDTO result = service.updateOwner(ownerId, request);

        assertSame(expectedResponse, result);
        verify(ownerMapper).toResponseDTO(owner, true);
    }

    @Test
    void deleteOwnerStopsAfterMissingLookup() {
        UUID ownerId = UUID.randomUUID();
        when(ownerRepository.findById(ownerId)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> service.deleteOwner(ownerId));

        verifyNoInteractions(deletionAuthorizationPolicy, stayRepository);
        verify(ownerRepository, never()).existsByIdAndCatsIsNotEmpty(ownerId);
        verify(ownerRepository, never()).delete(any(Owner.class));
        verify(ownerRepository, never()).flush();
    }

    @Test
    void deleteOwnerChecksBothRelationshipsBeforeDeletingAndFlushing() {
        UUID ownerId = UUID.randomUUID();
        Owner owner = owner(ownerId, creator("staff"));
        when(ownerRepository.findById(ownerId)).thenReturn(Optional.of(owner));
        when(ownerRepository.existsByIdAndCatsIsNotEmpty(ownerId)).thenReturn(false);
        when(stayRepository.existsByOwner_Id(ownerId)).thenReturn(false);

        service.deleteOwner(ownerId);

        InOrder ordered = inOrder(ownerRepository, deletionAuthorizationPolicy, stayRepository);
        ordered.verify(ownerRepository).findById(ownerId);
        ordered.verify(deletionAuthorizationPolicy).authorize(owner.getCreatedBy(), CREATED_AT);
        ordered.verify(ownerRepository).existsByIdAndCatsIsNotEmpty(ownerId);
        ordered.verify(stayRepository).existsByOwner_Id(ownerId);
        ordered.verify(ownerRepository).delete(owner);
        ordered.verify(ownerRepository).flush();
    }

    @Test
    void deleteOwnerDoesNotInspectRelationshipsWhenAuthorizationFails() {
        UUID ownerId = UUID.randomUUID();
        Owner owner = owner(ownerId, creator("staff"));
        when(ownerRepository.findById(ownerId)).thenReturn(Optional.of(owner));
        doThrow(new ForbiddenException("Forbidden"))
                .when(deletionAuthorizationPolicy).authorize(owner.getCreatedBy(), CREATED_AT);

        assertThrows(ForbiddenException.class, () -> service.deleteOwner(ownerId));

        verify(ownerRepository, never()).existsByIdAndCatsIsNotEmpty(ownerId);
        verifyNoInteractions(stayRepository);
        verify(ownerRepository, never()).delete(any(Owner.class));
        verify(ownerRepository, never()).flush();
    }

    @Test
    void deleteOwnerRejectsCatReferenceBeforeStayLookup() {
        UUID ownerId = UUID.randomUUID();
        Owner owner = owner(ownerId, creator("staff"));
        when(ownerRepository.findById(ownerId)).thenReturn(Optional.of(owner));
        when(ownerRepository.existsByIdAndCatsIsNotEmpty(ownerId)).thenReturn(true);

        ConflictException exception = assertThrows(
                ConflictException.class,
                () -> service.deleteOwner(ownerId));

        assertEquals("Owner cannot be deleted while cats reference it", exception.getMessage());
        verifyNoInteractions(stayRepository);
        verify(ownerRepository, never()).delete(any(Owner.class));
        verify(ownerRepository, never()).flush();
    }

    @Test
    void deleteOwnerRejectsDirectStayReferenceWithoutDeleting() {
        UUID ownerId = UUID.randomUUID();
        Owner owner = owner(ownerId, creator("staff"));
        when(ownerRepository.findById(ownerId)).thenReturn(Optional.of(owner));
        when(ownerRepository.existsByIdAndCatsIsNotEmpty(ownerId)).thenReturn(false);
        when(stayRepository.existsByOwner_Id(ownerId)).thenReturn(true);

        ConflictException exception = assertThrows(
                ConflictException.class,
                () -> service.deleteOwner(ownerId));

        assertEquals("Owner cannot be deleted while stays reference it", exception.getMessage());
        verify(ownerRepository, never()).delete(any(Owner.class));
        verify(ownerRepository, never()).flush();
    }

    @Test
    void deleteOwnerTranslatesDataIntegrityFailureFromDelete() {
        UUID ownerId = UUID.randomUUID();
        Owner owner = owner(ownerId, creator("staff"));
        when(ownerRepository.findById(ownerId)).thenReturn(Optional.of(owner));
        when(ownerRepository.existsByIdAndCatsIsNotEmpty(ownerId)).thenReturn(false);
        when(stayRepository.existsByOwner_Id(ownerId)).thenReturn(false);
        doThrow(new DataIntegrityViolationException("constraint"))
                .when(ownerRepository).delete(owner);

        ConflictException exception = assertThrows(
                ConflictException.class,
                () -> service.deleteOwner(ownerId));

        assertEquals("Owner cannot be deleted because of a data conflict", exception.getMessage());
        verify(ownerRepository, never()).flush();
    }

    @Test
    void deleteOwnerTranslatesOptimisticFailureFromFlush() {
        UUID ownerId = UUID.randomUUID();
        Owner owner = owner(ownerId, creator("staff"));
        when(ownerRepository.findById(ownerId)).thenReturn(Optional.of(owner));
        when(ownerRepository.existsByIdAndCatsIsNotEmpty(ownerId)).thenReturn(false);
        when(stayRepository.existsByOwner_Id(ownerId)).thenReturn(false);
        doThrow(new OptimisticLockingFailureException("stale"))
                .when(ownerRepository).flush();

        ConflictException exception = assertThrows(
                ConflictException.class,
                () -> service.deleteOwner(ownerId));

        assertEquals("Owner cannot be deleted because of a data conflict", exception.getMessage());
        verify(ownerRepository).delete(owner);
        verify(ownerRepository).flush();
    }

    @Test
    void deleteOwnerRechecksRulesAfterStalePositiveResponseHint() {
        UUID ownerId = UUID.randomUUID();
        Owner owner = owner(ownerId, creator("staff"));
        OwnerResponseDTO renderedResponse = OwnerResponseDTO.builder()
                .id(ownerId)
                .canDelete(true)
                .build();

        when(ownerRepository.findById(ownerId)).thenReturn(Optional.of(owner));
        when(deletionAuthorizationPolicy.canDelete(owner.getCreatedBy(), CREATED_AT)).thenReturn(true);
        when(ownerRepository.existsByIdAndCatsIsNotEmpty(ownerId)).thenReturn(false);
        when(stayRepository.existsByOwner_Id(ownerId)).thenReturn(false, true);
        when(ownerMapper.toResponseDTO(owner, true)).thenReturn(renderedResponse);

        assertSame(renderedResponse, service.getOwner(ownerId));
        assertThrows(ConflictException.class, () -> service.deleteOwner(ownerId));

        verify(deletionAuthorizationPolicy).authorize(owner.getCreatedBy(), CREATED_AT);
        verify(ownerRepository, times(2)).existsByIdAndCatsIsNotEmpty(ownerId);
        verify(stayRepository, times(2)).existsByOwner_Id(ownerId);
        verify(ownerRepository, never()).delete(any(Owner.class));
        verify(ownerRepository, never()).flush();
    }

    private UserAccount creator(String username) {
        return UserAccount.builder()
                .id(UUID.randomUUID())
                .username(username)
                .build();
    }

    private Owner owner(UUID id, UserAccount creator) {
        Owner owner = Owner.builder()
                .id(id)
                .fullName("John Owner")
                .primaryPhone("123456789")
                .createdBy(creator)
                .build();
        owner.setCreatedAt(CREATED_AT);
        return owner;
    }
}
