package com.allegaeon.catworld.service;

import com.allegaeon.catworld.dto.OwnerRequestDTO;
import com.allegaeon.catworld.dto.OwnerResponseDTO;
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

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertSame;
import static org.mockito.ArgumentMatchers.any;
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
}
