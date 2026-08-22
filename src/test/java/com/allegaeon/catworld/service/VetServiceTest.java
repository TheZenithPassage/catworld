package com.allegaeon.catworld.service;

import com.allegaeon.catworld.dto.VetRequestDTO;
import com.allegaeon.catworld.dto.VetResponseDTO;
import com.allegaeon.catworld.dto.relationship.*;
import com.allegaeon.catworld.exception.BadRequestException;
import com.allegaeon.catworld.exception.ConflictException;
import com.allegaeon.catworld.exception.ForbiddenException;
import com.allegaeon.catworld.exception.ResourceNotFoundException;
import com.allegaeon.catworld.mapper.VetMapper;
import com.allegaeon.catworld.model.UserAccount;
import com.allegaeon.catworld.model.Vet;
import com.allegaeon.catworld.repository.VetRepository;
import com.allegaeon.catworld.repository.CatRepository;
import com.allegaeon.catworld.security.CurrentUserAccountService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.InjectMocks;
import org.mockito.InOrder;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertSame;
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
class VetServiceTest {

    private static final Instant CREATED_AT = Instant.parse("2026-07-05T11:50:00Z");

    @Mock
    private VetRepository vetRepository;

    @Mock
    private VetMapper vetMapper;

    @Mock
    private CurrentUserAccountService currentUserAccountService;

    @Mock
    private DeletionAuthorizationPolicy deletionAuthorizationPolicy;

    @Mock
    private CatRepository catRepository;

    @InjectMocks
    private VetService service;

    @Captor
    private ArgumentCaptor<Vet> vetCaptor;

    @Test
    void vetDetailComposesOneCompleteCatPreview() {
        UUID id = UUID.randomUUID();
        Vet vet = vet(id, creator());
        var owner = com.allegaeon.catworld.model.Owner.builder().id(UUID.randomUUID())
                .fullName("Owner Name").build();
        var cat = com.allegaeon.catworld.model.Cat.builder().id(UUID.randomUUID()).name("Milo")
                .birthDate(LocalDate.of(2020, 1, 1)).sex(com.allegaeon.catworld.model.Sex.MALE)
                .owner(owner).vet(vet).build();
        VetResponseDTO response = VetResponseDTO.builder().id(id).name("Vet").build();
        when(vetRepository.findById(id)).thenReturn(Optional.of(vet));
        when(vetMapper.toResponseDTO(vet, false)).thenReturn(response);
        when(catRepository.findByVet_Id(eq(id), any(Pageable.class))).thenReturn(new PageImpl<>(List.of(cat)));

        VetDetailResponse result = service.getVetDetail(id);

        assertSame(response, result.vet());
        assertEquals(1, result.cats().totalElements());
        assertEquals(new CatRelationshipItem(cat.getId(), "Milo", owner.getId(), "Owner Name"),
                result.cats().items().get(0));
    }

    @Test
    void vetPageUsesFiveItemEnvelopeAndValidatesAfterLookup() {
        UUID missing = UUID.randomUUID();
        when(vetRepository.findById(missing)).thenReturn(Optional.empty());
        assertThrows(ResourceNotFoundException.class, () -> service.getVetCats(missing, -1));
        verifyNoInteractions(catRepository);

        UUID id = UUID.randomUUID();
        when(vetRepository.findById(id)).thenReturn(Optional.of(vet(id, creator())));
        assertThrows(BadRequestException.class, () -> service.getVetCats(id, -1));
        when(catRepository.findByVet_Id(eq(id), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(), org.springframework.data.domain.PageRequest.of(1, 5), 6));
        RelationshipPage<CatRelationshipItem> result = service.getVetCats(id, 1);
        assertEquals(5, result.pageSize());
        assertEquals(6, result.totalElements());
        assertEquals(2, result.totalPages());
    }

    @Test
    void createVetAssignsAuthenticatedCreatorAndCalculatesCanDelete() {
        UserAccount creator = creator();
        VetRequestDTO request = VetRequestDTO.builder()
                .name("Central Vet")
                .phoneNumber("123456789")
                .build();
        Vet mappedVet = vet(UUID.randomUUID(), creator);
        VetResponseDTO expectedResponse = VetResponseDTO.builder()
                .id(mappedVet.getId())
                .name(request.getName())
                .phoneNumber(request.getPhoneNumber())
                .canDelete(true)
                .build();

        when(vetMapper.toEntity(request)).thenReturn(mappedVet);
        when(currentUserAccountService.getCurrentUserAccount()).thenReturn(creator);
        when(vetRepository.save(any(Vet.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(deletionAuthorizationPolicy.canDelete(creator, CREATED_AT)).thenReturn(true);
        when(vetRepository.existsByIdAndCatsIsNotEmpty(mappedVet.getId())).thenReturn(false);
        when(vetMapper.toResponseDTO(mappedVet, true)).thenReturn(expectedResponse);

        VetResponseDTO result = service.createVet(request);

        assertSame(expectedResponse, result);
        verify(vetRepository).save(vetCaptor.capture());
        assertSame(creator, vetCaptor.getValue().getCreatedBy());
        verify(vetMapper).toResponseDTO(mappedVet, true);
    }

    @Test
    void getAllVetsUsesOneAccountLookupAndOneBulkReferenceLookupForEligibleVets() {
        UserAccount currentUser = creator();
        Vet deletable = vet(UUID.randomUUID(), creator());
        Vet referenced = vet(UUID.randomUUID(), creator());
        Vet unauthorized = vet(UUID.randomUUID(), creator());
        VetResponseDTO deletableResponse = VetResponseDTO.builder()
                .id(deletable.getId())
                .canDelete(true)
                .build();
        VetResponseDTO referencedResponse = VetResponseDTO.builder()
                .id(referenced.getId())
                .canDelete(false)
                .build();
        VetResponseDTO unauthorizedResponse = VetResponseDTO.builder()
                .id(unauthorized.getId())
                .canDelete(false)
                .build();
        Set<UUID> eligibleIds = Set.of(deletable.getId(), referenced.getId());

        when(vetRepository.findAll()).thenReturn(List.of(deletable, referenced, unauthorized));
        when(currentUserAccountService.getCurrentUserAccount()).thenReturn(currentUser);
        when(deletionAuthorizationPolicy.canDelete(
                currentUser,
                deletable.getCreatedBy(),
                CREATED_AT)).thenReturn(true);
        when(deletionAuthorizationPolicy.canDelete(
                currentUser,
                referenced.getCreatedBy(),
                CREATED_AT)).thenReturn(true);
        when(deletionAuthorizationPolicy.canDelete(
                currentUser,
                unauthorized.getCreatedBy(),
                CREATED_AT)).thenReturn(false);
        when(vetRepository.findVetIdsReferencedByCats(eligibleIds))
                .thenReturn(Set.of(referenced.getId()));
        when(vetMapper.toResponseDTO(deletable, true)).thenReturn(deletableResponse);
        when(vetMapper.toResponseDTO(referenced, false)).thenReturn(referencedResponse);
        when(vetMapper.toResponseDTO(unauthorized, false)).thenReturn(unauthorizedResponse);

        List<VetResponseDTO> result = service.getAllVets();

        assertEquals(List.of(deletableResponse, referencedResponse, unauthorizedResponse), result);
        verify(currentUserAccountService).getCurrentUserAccount();
        verify(vetRepository).findVetIdsReferencedByCats(eligibleIds);
        verify(vetRepository, times(1)).findVetIdsReferencedByCats(any());
        verify(vetRepository, never()).existsByIdAndCatsIsNotEmpty(any(UUID.class));
        verify(deletionAuthorizationPolicy, never()).canDelete(any(UserAccount.class), any(Instant.class));
    }

    @Test
    void getAllVetsSkipsReferenceLookupWhenNoVetIsAuthorized() {
        UserAccount currentUser = creator();
        Vet first = vet(UUID.randomUUID(), creator());
        Vet second = vet(UUID.randomUUID(), creator());
        VetResponseDTO firstResponse = VetResponseDTO.builder()
                .id(first.getId())
                .canDelete(false)
                .build();
        VetResponseDTO secondResponse = VetResponseDTO.builder()
                .id(second.getId())
                .canDelete(false)
                .build();

        when(vetRepository.findAll()).thenReturn(List.of(first, second));
        when(currentUserAccountService.getCurrentUserAccount()).thenReturn(currentUser);
        when(deletionAuthorizationPolicy.canDelete(currentUser, first.getCreatedBy(), CREATED_AT))
                .thenReturn(false);
        when(deletionAuthorizationPolicy.canDelete(currentUser, second.getCreatedBy(), CREATED_AT))
                .thenReturn(false);
        when(vetMapper.toResponseDTO(first, false)).thenReturn(firstResponse);
        when(vetMapper.toResponseDTO(second, false)).thenReturn(secondResponse);

        assertEquals(List.of(firstResponse, secondResponse), service.getAllVets());

        verify(currentUserAccountService).getCurrentUserAccount();
        verify(vetRepository, never()).findVetIdsReferencedByCats(any());
        verify(vetRepository, never()).existsByIdAndCatsIsNotEmpty(any(UUID.class));
    }

    @Test
    void getVetReportsCanDeleteFalseWhenAuthorizedVetIsReferenced() {
        UUID vetId = UUID.randomUUID();
        Vet vet = vet(vetId, creator());
        VetResponseDTO expectedResponse = VetResponseDTO.builder()
                .id(vetId)
                .canDelete(false)
                .build();

        when(vetRepository.findById(vetId)).thenReturn(Optional.of(vet));
        when(deletionAuthorizationPolicy.canDelete(vet.getCreatedBy(), CREATED_AT)).thenReturn(true);
        when(vetRepository.existsByIdAndCatsIsNotEmpty(vetId)).thenReturn(true);
        when(vetMapper.toResponseDTO(vet, false)).thenReturn(expectedResponse);

        VetResponseDTO result = service.getVet(vetId);

        assertSame(expectedResponse, result);
    }

    @Test
    void updateVetCalculatesCanDeleteForSavedVet() {
        UUID vetId = UUID.randomUUID();
        VetRequestDTO request = VetRequestDTO.builder()
                .name("Updated Vet")
                .build();
        Vet vet = vet(vetId, creator());
        VetResponseDTO expectedResponse = VetResponseDTO.builder()
                .id(vetId)
                .name(request.getName())
                .canDelete(true)
                .build();

        when(vetRepository.findById(vetId)).thenReturn(Optional.of(vet));
        when(vetMapper.updateEntity(vet, request)).thenReturn(vet);
        when(vetRepository.save(vet)).thenReturn(vet);
        when(deletionAuthorizationPolicy.canDelete(vet.getCreatedBy(), CREATED_AT)).thenReturn(true);
        when(vetRepository.existsByIdAndCatsIsNotEmpty(vetId)).thenReturn(false);
        when(vetMapper.toResponseDTO(vet, true)).thenReturn(expectedResponse);

        VetResponseDTO result = service.updateVet(vetId, request);

        assertSame(expectedResponse, result);
        verify(vetMapper).toResponseDTO(vet, true);
    }

    @Test
    void deleteVetStopsAfterMissingLookup() {
        UUID vetId = UUID.randomUUID();
        when(vetRepository.findById(vetId)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> service.deleteVet(vetId));

        verifyNoInteractions(deletionAuthorizationPolicy);
        verify(vetRepository, never()).existsByIdAndCatsIsNotEmpty(vetId);
        verify(vetRepository, never()).delete(any(Vet.class));
        verify(vetRepository, never()).flush();
    }

    @Test
    void deleteVetAuthorizesAndChecksReferencesBeforeDeletingAndFlushing() {
        UUID vetId = UUID.randomUUID();
        Vet vet = vet(vetId, creator());
        when(vetRepository.findById(vetId)).thenReturn(Optional.of(vet));
        when(vetRepository.existsByIdAndCatsIsNotEmpty(vetId)).thenReturn(false);

        service.deleteVet(vetId);

        InOrder ordered = inOrder(vetRepository, deletionAuthorizationPolicy);
        ordered.verify(vetRepository).findById(vetId);
        ordered.verify(deletionAuthorizationPolicy).authorize(vet.getCreatedBy(), CREATED_AT);
        ordered.verify(vetRepository).existsByIdAndCatsIsNotEmpty(vetId);
        ordered.verify(vetRepository).delete(vet);
        ordered.verify(vetRepository).flush();
    }

    @Test
    void deleteVetDoesNotProbeReferencesWhenAuthorizationFails() {
        UUID vetId = UUID.randomUUID();
        Vet vet = vet(vetId, creator());
        when(vetRepository.findById(vetId)).thenReturn(Optional.of(vet));
        doThrow(new ForbiddenException("Forbidden"))
                .when(deletionAuthorizationPolicy).authorize(vet.getCreatedBy(), CREATED_AT);

        assertThrows(ForbiddenException.class, () -> service.deleteVet(vetId));

        verify(vetRepository, never()).existsByIdAndCatsIsNotEmpty(vetId);
        verify(vetRepository, never()).delete(any(Vet.class));
        verify(vetRepository, never()).flush();
    }

    @Test
    void deleteVetRejectsReferencedVetWithoutDeleting() {
        UUID vetId = UUID.randomUUID();
        Vet vet = vet(vetId, creator());
        when(vetRepository.findById(vetId)).thenReturn(Optional.of(vet));
        when(vetRepository.existsByIdAndCatsIsNotEmpty(vetId)).thenReturn(true);

        assertThrows(ConflictException.class, () -> service.deleteVet(vetId));

        InOrder ordered = inOrder(vetRepository, deletionAuthorizationPolicy);
        ordered.verify(vetRepository).findById(vetId);
        ordered.verify(deletionAuthorizationPolicy).authorize(vet.getCreatedBy(), CREATED_AT);
        ordered.verify(vetRepository).existsByIdAndCatsIsNotEmpty(vetId);
        verify(vetRepository, never()).delete(any(Vet.class));
        verify(vetRepository, never()).flush();
    }

    @Test
    void deleteVetTranslatesDataIntegrityFailureFromDelete() {
        UUID vetId = UUID.randomUUID();
        Vet vet = vet(vetId, creator());
        when(vetRepository.findById(vetId)).thenReturn(Optional.of(vet));
        when(vetRepository.existsByIdAndCatsIsNotEmpty(vetId)).thenReturn(false);
        doThrow(new DataIntegrityViolationException("constraint"))
                .when(vetRepository).delete(vet);

        assertThrows(ConflictException.class, () -> service.deleteVet(vetId));

        verify(vetRepository, never()).flush();
    }

    @Test
    void deleteVetTranslatesOptimisticFailureFromFlush() {
        UUID vetId = UUID.randomUUID();
        Vet vet = vet(vetId, creator());
        when(vetRepository.findById(vetId)).thenReturn(Optional.of(vet));
        when(vetRepository.existsByIdAndCatsIsNotEmpty(vetId)).thenReturn(false);
        doThrow(new OptimisticLockingFailureException("stale"))
                .when(vetRepository).flush();

        assertThrows(ConflictException.class, () -> service.deleteVet(vetId));

        verify(vetRepository).delete(vet);
        verify(vetRepository).flush();
    }

    private UserAccount creator() {
        return UserAccount.builder()
                .id(UUID.randomUUID())
                .username("staff")
                .build();
    }

    private Vet vet(UUID id, UserAccount creator) {
        Vet vet = Vet.builder()
                .id(id)
                .name("Central Vet")
                .createdBy(creator)
                .build();
        vet.setCreatedAt(CREATED_AT);
        return vet;
    }
}
