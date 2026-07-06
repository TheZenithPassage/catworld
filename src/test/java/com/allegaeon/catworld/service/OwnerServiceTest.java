package com.allegaeon.catworld.service;

import com.allegaeon.catworld.dto.OwnerRequestDTO;
import com.allegaeon.catworld.dto.OwnerResponseDTO;
import com.allegaeon.catworld.exception.ForbiddenException;
import com.allegaeon.catworld.mapper.OwnerMapper;
import com.allegaeon.catworld.model.Owner;
import com.allegaeon.catworld.model.UserAccount;
import com.allegaeon.catworld.repository.OwnerRepository;
import com.allegaeon.catworld.security.CurrentUserAccountService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class OwnerServiceTest {

    @Mock
    private OwnerRepository ownerRepository;

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
    void createOwnerAssignsAuthenticatedCreator() {
        UserAccount creator = UserAccount.builder()
                .id(UUID.randomUUID())
                .username("staff")
                .build();

        OwnerRequestDTO request = OwnerRequestDTO.builder()
                .fullName("John Owner")
                .primaryPhone("123456789")
                .build();

        Owner mappedOwner = Owner.builder()
                .fullName(request.getFullName())
                .primaryPhone(request.getPrimaryPhone())
                .build();

        OwnerResponseDTO expectedResponse = OwnerResponseDTO.builder()
                .id(UUID.randomUUID())
                .fullName(request.getFullName())
                .primaryPhone(request.getPrimaryPhone())
                .build();

        when(ownerMapper.toEntity(request)).thenReturn(mappedOwner);
        when(currentUserAccountService.getCurrentUserAccount()).thenReturn(creator);
        when(ownerRepository.save(any(Owner.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(ownerMapper.toResponseDTO(any(Owner.class))).thenReturn(expectedResponse);

        OwnerResponseDTO result = service.createOwner(request);

        assertSame(expectedResponse, result);

        verify(ownerRepository).save(ownerCaptor.capture());
        assertSame(creator, ownerCaptor.getValue().getCreatedBy());
    }

    @Test
    void deleteOwnerAuthorizesBeforeDeletingOwner() {
        UUID ownerId = UUID.randomUUID();
        UserAccount creator = UserAccount.builder()
                .id(UUID.randomUUID())
                .username("staff")
                .build();
        Instant createdAt = Instant.parse("2026-07-05T11:50:00Z");
        Owner owner = Owner.builder()
                .id(ownerId)
                .createdBy(creator)
                .build();
        owner.setCreatedAt(createdAt);

        when(ownerRepository.findById(ownerId)).thenReturn(Optional.of(owner));

        service.deleteOwner(ownerId);

        var inOrder = inOrder(deletionAuthorizationPolicy, ownerRepository);
        inOrder.verify(deletionAuthorizationPolicy).authorize(creator, createdAt);
        inOrder.verify(ownerRepository).delete(owner);
    }

    @Test
    void deleteOwnerDoesNotDeleteWhenAuthorizationFails() {
        UUID ownerId = UUID.randomUUID();
        UserAccount creator = UserAccount.builder()
                .id(UUID.randomUUID())
                .username("staff")
                .build();
        Instant createdAt = Instant.parse("2026-07-05T11:00:00Z");
        Owner owner = Owner.builder()
                .id(ownerId)
                .createdBy(creator)
                .build();
        owner.setCreatedAt(createdAt);

        when(ownerRepository.findById(ownerId)).thenReturn(Optional.of(owner));
        doThrow(new ForbiddenException("Forbidden"))
                .when(deletionAuthorizationPolicy).authorize(creator, createdAt);

        assertThrows(ForbiddenException.class, () -> service.deleteOwner(ownerId));

        verify(ownerRepository, never()).delete(any(Owner.class));
    }
}
