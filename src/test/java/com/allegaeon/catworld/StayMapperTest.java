package com.allegaeon.catworld;

import com.allegaeon.catworld.dto.StayCatSummaryDTO;
import com.allegaeon.catworld.dto.StayResponseDTO;
import com.allegaeon.catworld.mapper.StayMapper;
import com.allegaeon.catworld.model.Cat;
import com.allegaeon.catworld.model.Owner;
import com.allegaeon.catworld.model.Stay;
import com.allegaeon.catworld.model.StayCat;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

import java.util.HashSet;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

public class StayMapperTest {

    private final StayMapper stayMapper = new StayMapper();

    @Test
    void toResponseDTO_shouldIncludeOwnerAndCatSummaryData() {

        UUID ownerId = UUID.randomUUID();
        UUID cat1Id = UUID.randomUUID();
        UUID cat2Id = UUID.randomUUID();

        Cat cat1 = Cat.builder().id(cat1Id).name("Cat 1").build();
        Cat cat2 = Cat.builder().id(cat2Id).name("Cat 2").build();

        Set<StayCat> stayCats = new HashSet<>();
        stayCats.add(StayCat.builder().cat(cat1).build());
        stayCats.add(StayCat.builder().cat(cat2).build());

        Stay stay = Stay.builder()
                .owner(Owner.builder()
                        .id(ownerId)
                        .fullName("Owner 1")
                        .build()
                ).stayCats(stayCats).build();

        StayResponseDTO response = stayMapper.toResponseDTO(stay);

        Set<UUID> expectedCatIds = Set.of(cat1Id, cat2Id);
        Set<UUID> actualCatIds = response.getCats().stream().map(StayCatSummaryDTO::getCatId).collect(Collectors.toSet());

        Map<UUID, String> actualCatNamesById = response.getCats().stream()
                .collect(Collectors.toMap(
                        StayCatSummaryDTO::getCatId,
                        StayCatSummaryDTO::getName
                ));

        assertEquals(ownerId, response.getOwnerId());
        assertEquals("Owner 1", response.getOwnerName());
        assertEquals(expectedCatIds, actualCatIds);

        assertEquals("Cat 1", actualCatNamesById.get(cat1Id));
        assertEquals("Cat 2", actualCatNamesById.get(cat2Id));

        assertEquals(2, response.getCats().size());

    }

}
