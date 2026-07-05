package com.allegaeon.catworld.service;

import com.allegaeon.catworld.dto.CatRequestDTO;
import com.allegaeon.catworld.dto.CatResponseDTO;
import com.allegaeon.catworld.mapper.CatMapper;
import com.allegaeon.catworld.model.Cat;
import com.allegaeon.catworld.model.Owner;
import com.allegaeon.catworld.model.Sex;
import com.allegaeon.catworld.model.UserAccount;
import com.allegaeon.catworld.repository.CatRepository;
import com.allegaeon.catworld.repository.OwnerRepository;
import com.allegaeon.catworld.repository.VetRepository;
import com.allegaeon.catworld.security.CurrentUserAccountService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertSame;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CatServiceTest {

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

    @InjectMocks
    private CatService service;

    @Captor
    private ArgumentCaptor<Cat> catCaptor;

    @Test
    void createCatAssignsAuthenticatedCreator() {
        UserAccount creator = UserAccount.builder()
                .id(UUID.randomUUID())
                .username("staff")
                .build();

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
                .build();

        when(ownerRepository.findById(owner.getId())).thenReturn(Optional.of(owner));
        when(catMapper.toEntity(request, owner, null)).thenReturn(mappedCat);
        when(currentUserAccountService.getCurrentUserAccount()).thenReturn(creator);
        when(catRepository.save(any(Cat.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(catMapper.toResponseDTO(any(Cat.class))).thenReturn(expectedResponse);

        CatResponseDTO result = service.createCat(request);

        assertSame(expectedResponse, result);

        verify(catRepository).save(catCaptor.capture());
        assertSame(creator, catCaptor.getValue().getCreatedBy());
    }
}
