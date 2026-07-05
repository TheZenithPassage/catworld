package com.allegaeon.catworld.service;

import com.allegaeon.catworld.dto.VetRequestDTO;
import com.allegaeon.catworld.dto.VetResponseDTO;
import com.allegaeon.catworld.mapper.VetMapper;
import com.allegaeon.catworld.model.UserAccount;
import com.allegaeon.catworld.model.Vet;
import com.allegaeon.catworld.repository.VetRepository;
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
class VetServiceTest {

    @Mock
    private VetRepository vetRepository;

    @Mock
    private VetMapper vetMapper;

    @Mock
    private CurrentUserAccountService currentUserAccountService;

    @InjectMocks
    private VetService service;

    @Captor
    private ArgumentCaptor<Vet> vetCaptor;

    @Test
    void createVetAssignsAuthenticatedCreator() {
        UserAccount creator = UserAccount.builder()
                .id(UUID.randomUUID())
                .username("staff")
                .build();

        VetRequestDTO request = VetRequestDTO.builder()
                .name("Central Vet")
                .phoneNumber("123456789")
                .build();

        Vet mappedVet = Vet.builder()
                .name(request.getName())
                .phoneNumber(request.getPhoneNumber())
                .build();

        VetResponseDTO expectedResponse = VetResponseDTO.builder()
                .id(UUID.randomUUID())
                .name(request.getName())
                .phoneNumber(request.getPhoneNumber())
                .build();

        when(vetMapper.toEntity(request)).thenReturn(mappedVet);
        when(currentUserAccountService.getCurrentUserAccount()).thenReturn(creator);
        when(vetRepository.save(any(Vet.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(vetMapper.toResponseDTO(any(Vet.class))).thenReturn(expectedResponse);

        VetResponseDTO result = service.createVet(request);

        assertSame(expectedResponse, result);

        verify(vetRepository).save(vetCaptor.capture());
        assertSame(creator, vetCaptor.getValue().getCreatedBy());
    }
}
