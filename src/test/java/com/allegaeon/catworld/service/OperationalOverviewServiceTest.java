package com.allegaeon.catworld.service;

import com.allegaeon.catworld.dto.PaymentCondition;
import com.allegaeon.catworld.dto.overview.OverviewPage;
import com.allegaeon.catworld.exception.BadRequestException;
import com.allegaeon.catworld.model.Cat;
import com.allegaeon.catworld.model.Owner;
import com.allegaeon.catworld.model.Stay;
import com.allegaeon.catworld.model.StayStatus;
import com.allegaeon.catworld.model.Vet;
import com.allegaeon.catworld.repository.*;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Set;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OperationalOverviewServiceTest {
    @Mock OwnerRepository ownerRepository;
    @Mock CatRepository catRepository;
    @Mock CatPhotoRepository catPhotoRepository;
    @Mock VetRepository vetRepository;
    @Mock StayOverviewReadRepository stayOverviewReadRepository;
    @Mock StayCatRepository stayCatRepository;
    @Mock Clock clock;
    @InjectMocks OwnerService ownerService;
    @InjectMocks CatService catService;
    @InjectMocks VetService vetService;
    @InjectMocks StayService stayService;

    @Test
    void ownerOverviewPagesBeforeOneBoundedCatHydration() {
        Owner owner = Owner.builder().id(UUID.randomUUID()).fullName("Ángela Pérez").build();
        Cat cat = Cat.builder().id(UUID.randomUUID()).name("Mora").owner(owner).build();
        when(ownerRepository.findOverview(any())).thenReturn(new PageImpl<>(List.of(owner),
                org.springframework.data.domain.PageRequest.of(0, 10), 14));
        when(catRepository.findLookupCatsByOwnerIds(List.of(owner.getId()))).thenReturn(List.of(cat));

        OverviewPage<?> result = ownerService.getOwnerOverview(0, "  ");

        assertEquals(10, result.pageSize());
        assertEquals(14, result.totalElements());
        assertEquals(1, result.items().size());
        var order = inOrder(ownerRepository, catRepository);
        order.verify(ownerRepository).findOverview(any());
        order.verify(catRepository).findLookupCatsByOwnerIds(List.of(owner.getId()));
    }

    @Test
    void catOverviewSearchesOwnerNameAndEnrichesOnlyPagePhotoPresence() {
        Owner owner = Owner.builder().id(UUID.randomUUID()).fullName("José").build();
        Cat cat = Cat.builder().id(UUID.randomUUID()).name("Luna").owner(owner).build();
        when(catRepository.searchOverview(eq("Jose"), any())).thenReturn(new PageImpl<>(List.of(cat)));
        when(catPhotoRepository.findPresentCatIds(List.of(cat.getId()))).thenReturn(Set.of(cat.getId()));

        var result = catService.getCatOverview(0, " Jose ");

        assertTrue(result.items().getFirst().hasPhoto());
        verify(catPhotoRepository).findPresentCatIds(List.of(cat.getId()));
        ArgumentCaptor<Pageable> pageable = ArgumentCaptor.forClass(Pageable.class);
        verify(catRepository).searchOverview(eq("Jose"), pageable.capture());
        assertEquals(10, pageable.getValue().getPageSize());
    }

    @Test
    void vetOverviewUsesRecentOrderingAndRejectsNegativePages() {
        Vet vet = Vet.builder().id(UUID.randomUUID()).name("Vet").address("Address").build();
        when(vetRepository.findOverview(any())).thenReturn(new PageImpl<>(List.of(vet)));
        assertEquals("Address", vetService.getVetOverview(0, null).items().getFirst().address());
        assertThrows(BadRequestException.class, () -> vetService.getVetOverview(-1, null));
    }

    @Test
    void stayOverviewDelegatesCompleteFiltersBeforeBoundedHydration() {
        Clock fixed = Clock.fixed(Instant.parse("2026-09-04T12:00:00Z"), ZoneOffset.UTC);
        Owner owner = Owner.builder().id(UUID.randomUUID()).fullName("Owner").build();
        Stay stay = Stay.builder().id(UUID.randomUUID()).owner(owner)
                .startAt(java.time.LocalDateTime.of(2026, 9, 5, 10, 0))
                .endAt(java.time.LocalDateTime.of(2026, 9, 6, 10, 0)).build();
        var service = mockStayService(fixed);
        when(stayOverviewReadRepository.find(eq(1), eq(10), any(), eq(Set.of(StayStatus.RESERVED)),
                eq(owner.getId()), isNull(), eq(Set.of(PaymentCondition.NO_PAYMENT)), eq(true), any()))
                .thenReturn(new PageImpl<>(List.of(stay), org.springframework.data.domain.PageRequest.of(1, 10), 12));
        when(stayCatRepository.findOverviewCatsByStayIds(List.of(stay.getId()))).thenReturn(List.of());

        var result = service.getStayOverview(1, Set.of(StayStatus.RESERVED), owner.getId(), null,
                Set.of(PaymentCondition.NO_PAYMENT), true);
        assertEquals(11, result.totalElements());
        assertEquals(StayStatus.RESERVED, result.items().getFirst().status());
    }

    private StayService mockStayService(Clock fixed) {
        return new StayService(null, null, null, stayCatRepository, stayOverviewReadRepository,
                null, null, null, null, null, null, null, null, null, null, null, null, fixed);
    }
}
