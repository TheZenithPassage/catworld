package com.allegaeon.catworld.service;

import com.allegaeon.catworld.dto.StayRequestDTO;
import com.allegaeon.catworld.dto.StayResponseDTO;
import com.allegaeon.catworld.exception.BadRequestException;
import com.allegaeon.catworld.exception.ConflictException;
import com.allegaeon.catworld.mapper.StayMapper;
import com.allegaeon.catworld.model.Cat;
import com.allegaeon.catworld.model.Owner;
import com.allegaeon.catworld.model.Stay;
import com.allegaeon.catworld.model.StayCat;
import com.allegaeon.catworld.repository.CatRepository;
import com.allegaeon.catworld.repository.StayRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import static org.mockito.Mockito.*;
import static org.junit.jupiter.api.Assertions.*;

import java.time.LocalDateTime;
import java.time.Month;
import java.util.*;
import java.util.stream.Collectors;

@ExtendWith(MockitoExtension.class)
public class StayServiceTest {

    @Mock
    private StayRepository stayRepository;

    @Mock
    private StayMapper stayMapper;

    @Mock
    private CatRepository catRepository;

    @InjectMocks
    private StayService service;

    @Captor
    private ArgumentCaptor<Stay> stayCaptor;

    @Test
    public void createStay_shouldThrowBadRequest_whenEndDateIsNotAfterStartDate() {

        assertThrows(BadRequestException.class, () -> {
            service.createStay(StayRequestDTO.builder()
                    .startAt(LocalDateTime.of(2026, Month.APRIL, 22, 10, 0))
                    .endAt(LocalDateTime.of(2026, Month.MARCH, 14, 10, 0))
                    .catIds(Set.of(UUID.randomUUID()))
                    .build());
        });

    }

    @Test
    public void createStay_shouldThrowBadRequest_whenCatsHaveDifferentOwner() {

        Cat cat1 = Cat.builder()
                .id(UUID.randomUUID())
                .owner(Owner.builder()
                        .id(UUID.randomUUID())
                        .build())
                .build();

        Cat cat2 = Cat.builder()
                .id(UUID.randomUUID())
                .owner(Owner.builder()
                        .id(UUID.randomUUID())
                        .build())
                .build();

        when(catRepository.findById(cat1.getId())).thenReturn(Optional.of(cat1));
        when(catRepository.findById(cat2.getId())).thenReturn(Optional.of(cat2));

        assertThrows(BadRequestException.class, () -> {
           service.createStay(StayRequestDTO.builder()
                   .startAt(LocalDateTime.of(2026, Month.APRIL, 22, 10, 0))
                   .endAt(LocalDateTime.of(2026, Month.APRIL, 29, 10, 0))
                   .catIds(Set.of(cat1.getId(), cat2.getId()))
                   .build());
        });

    }

    @Test
    public void createStay_shouldThrowConflict_whenCatHasOverbooking() {

        Stay stay = Stay.builder()
                .id(UUID.randomUUID())
                .startAt(LocalDateTime.of(2026, Month.APRIL, 14, 10, 0))
                .endAt(LocalDateTime.of(2026, Month.APRIL, 25, 10, 0))
                .build();

        Cat cat = Cat.builder()
                .id(UUID.randomUUID())
                .name("Cat 1")
                .owner(Owner.builder()
                        .id(UUID.randomUUID())
                        .build())
                .build();

        StayCat stayCat = StayCat.builder()
                .stay(stay)
                .cat(cat)
                .build();

        cat.setStayCats(Set.of(stayCat));

        when(catRepository.findById(cat.getId())).thenReturn(Optional.of(cat));
        
        assertThrows(ConflictException.class, () -> {
           service.createStay(StayRequestDTO.builder()
                   .startAt(LocalDateTime.of(2026, Month.APRIL, 22, 10, 0))
                   .endAt(LocalDateTime.of(2026, Month.APRIL, 29, 10, 0))
                   .catIds(Set.of(cat.getId()))
                   .build());
        });

    }

    @Test
    public void createStay_shouldCreateStay_whenReceivingOnlyOneCat() {

        Owner owner = Owner.builder()
                .id(UUID.randomUUID())
                .fullName("Owner")
                .build();

        Cat cat = Cat.builder()
                .id(UUID.randomUUID())
                .name("Cat")
                .owner(owner)
                .build();

        StayRequestDTO stayRequestDTO = StayRequestDTO.builder()
                .startAt(LocalDateTime.of(2026, Month.APRIL, 15, 10, 0))
                .endAt(LocalDateTime.of(2026, Month.MAY, 3, 10, 0))
                .catIds(Set.of(cat.getId()))
                .build();

        Stay mappedStay = Stay.builder()
                .startAt(stayRequestDTO.getStartAt())
                .endAt(stayRequestDTO.getEndAt())
                .build();

        StayResponseDTO expectedResponseDTO = new StayResponseDTO();

        when(stayRepository.save(any(Stay.class))).thenAnswer(i -> i.getArgument(0));
        when(catRepository.findById(cat.getId())).thenReturn(Optional.of(cat));
        when(stayMapper.toEntity(stayRequestDTO)).thenReturn(mappedStay);
        when(stayMapper.toResponseDTO(any(Stay.class))).thenReturn(expectedResponseDTO);

        StayResponseDTO result = service.createStay(stayRequestDTO);

        assertSame(expectedResponseDTO, result);

        verify(stayRepository).save(stayCaptor.capture());
        Stay savedStay = stayCaptor.getValue();

        assertEquals(stayRequestDTO.getStartAt(), savedStay.getStartAt());
        assertEquals(stayRequestDTO.getEndAt(), savedStay.getEndAt());
        assertEquals(owner.getId(), savedStay.getOwner().getId());

        Set<UUID> savedCatIds = savedStay.getStayCats().stream().map(stayCat -> stayCat.getCat().getId()).collect(Collectors.toSet());

        assertEquals(Set.of(cat.getId()), savedCatIds);

    }

    @Test
    public void createStay_shouldCreateStay_whenReceivingMultipleCatsWithSameOwner() {

        Owner owner = Owner.builder()
                .id(UUID.randomUUID())
                .fullName("Owner")
                .build();

        Cat cat1 = Cat.builder()
                .id(UUID.randomUUID())
                .name("Cat 1")
                .owner(owner)
                .build();

        Cat cat2 = Cat.builder()
                .id(UUID.randomUUID())
                .name("Cat 2")
                .owner(owner)
                .build();

        StayRequestDTO stayRequestDTO = StayRequestDTO.builder()
                .startAt(LocalDateTime.of(2026, Month.APRIL, 15, 10, 0))
                .endAt(LocalDateTime.of(2026, Month.MAY, 3, 10, 0))
                .catIds(Set.of(cat1.getId(), cat2.getId()))
                .build();

        Stay mappedStay = Stay.builder()
                .startAt(stayRequestDTO.getStartAt())
                .endAt(stayRequestDTO.getEndAt())
                .build();

        StayResponseDTO expectedResponseDTO = new StayResponseDTO();

        when(stayRepository.save(any(Stay.class))).thenAnswer(i -> i.getArgument(0));
        when(catRepository.findById(cat1.getId())).thenReturn(Optional.of(cat1));
        when(catRepository.findById(cat2.getId())).thenReturn(Optional.of(cat2));
        when(stayMapper.toEntity(stayRequestDTO)).thenReturn(mappedStay);
        when(stayMapper.toResponseDTO(any(Stay.class))).thenReturn(expectedResponseDTO);

        StayResponseDTO result = service.createStay(stayRequestDTO);

        assertSame(expectedResponseDTO, result);

        verify(stayRepository).save(stayCaptor.capture());
        Stay savedStay = stayCaptor.getValue();

        assertEquals(stayRequestDTO.getStartAt(), savedStay.getStartAt());
        assertEquals(stayRequestDTO.getEndAt(), savedStay.getEndAt());
        assertEquals(owner.getId(), savedStay.getOwner().getId());

        Set<UUID> savedCatIds = savedStay.getStayCats().stream().map(stayCat -> stayCat.getCat().getId()).collect(Collectors.toSet());

        assertEquals(Set.of(cat1.getId(), cat2.getId()), savedCatIds);

    }

    @Test
    public void createStay_shouldCreateStay_whenOverlappingStayIsCancelled() {

        Owner owner = Owner.builder()
                .id(UUID.randomUUID())
                .fullName("Owner")
                .build();

        Cat cat = Cat.builder()
                .id(UUID.randomUUID())
                .name("Cat")
                .owner(owner)
                .build();

        StayRequestDTO stayRequestDTO = StayRequestDTO.builder()
                .startAt(LocalDateTime.of(2026, Month.APRIL, 15, 10, 0))
                .endAt(LocalDateTime.of(2026, Month.MAY, 3, 10, 0))
                .catIds(Set.of(cat.getId()))
                .build();

        Stay cancelledStay = Stay.builder()
                .id(UUID.randomUUID())
                .startAt(LocalDateTime.of(2026, Month.APRIL, 14, 10, 0))
                .endAt(LocalDateTime.of(2026, Month.APRIL, 25, 10, 0))
                .cancelledAt(LocalDateTime.of(2026, Month.APRIL, 18, 10, 0))
                .build();

        StayCat cancelledStayCat = StayCat.builder()
                .stay(cancelledStay)
                .cat(cat)
                .build();

        cat.setStayCats(Set.of(cancelledStayCat));

        Stay mappedStay = Stay.builder()
                .startAt(stayRequestDTO.getStartAt())
                .endAt(stayRequestDTO.getEndAt())
                .build();

        StayResponseDTO expectedResponseDTO = new StayResponseDTO();

        when(stayRepository.save(any(Stay.class))).thenAnswer(i -> i.getArgument(0));
        when(catRepository.findById(cat.getId())).thenReturn(Optional.of(cat));
        when(stayMapper.toEntity(stayRequestDTO)).thenReturn(mappedStay);
        when(stayMapper.toResponseDTO(any(Stay.class))).thenReturn(expectedResponseDTO);

        StayResponseDTO result = assertDoesNotThrow(() -> service.createStay(stayRequestDTO));

        assertSame(expectedResponseDTO, result);

        verify(stayRepository).save(stayCaptor.capture());
        Stay savedStay = stayCaptor.getValue();

        assertEquals(stayRequestDTO.getStartAt(), savedStay.getStartAt());
        assertEquals(stayRequestDTO.getEndAt(), savedStay.getEndAt());
        assertEquals(owner.getId(), savedStay.getOwner().getId());

        Set<UUID> savedCatIds = savedStay.getStayCats().stream().map(stayCat -> stayCat.getCat().getId()).collect(Collectors.toSet());

        assertEquals(Set.of(cat.getId()), savedCatIds);

    }

    @Test
    public void cancelStay_shouldCancelStaySuccessfully() {

        Stay stay = Stay.builder()
                .id(UUID.randomUUID())
                .startAt(LocalDateTime.of(2050, Month.APRIL, 14, 10, 0))
                .endAt(LocalDateTime.of(2050, Month.APRIL, 25, 10, 0))
                .build();

        when(stayRepository.findById(stay.getId())).thenReturn(Optional.of(stay));

        service.cancelStay(stay.getId());

        assertNotNull(stay.getCancelledAt());

    }

    @Test
    public void cancelStay_shouldThrowConflict_whenStayIsAlreadyCancelled() {

        Stay stay = Stay.builder()
                .id(UUID.randomUUID())
                .startAt(LocalDateTime.of(2050, Month.APRIL, 14, 10, 0))
                .endAt(LocalDateTime.of(2050, Month.APRIL, 25, 10, 0))
                .cancelledAt(LocalDateTime.of(2026, Month.APRIL, 18, 10, 0))
                .build();

        when(stayRepository.findById(stay.getId())).thenReturn(Optional.of(stay));

        assertThrows(ConflictException.class, () -> service.cancelStay(stay.getId()));

    }

    @Test
    public void cancelStay_shouldThrowConflict_whenStayIsCheckedOut() {

        Stay stay = Stay.builder()
                .id(UUID.randomUUID())
                .startAt(LocalDateTime.of(2026, Month.APRIL, 14, 10, 0))
                .endAt(LocalDateTime.of(2026, Month.APRIL, 25, 10, 0))
                .build();

        when(stayRepository.findById(stay.getId())).thenReturn(Optional.of(stay));

        assertThrows(ConflictException.class, () -> service.cancelStay(stay.getId()));

    }

}