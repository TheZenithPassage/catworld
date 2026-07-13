package com.allegaeon.catworld;

import com.allegaeon.catworld.dto.CatResponseDTO;
import com.allegaeon.catworld.mapper.CatMapper;
import com.allegaeon.catworld.model.Cat;
import com.allegaeon.catworld.model.Owner;
import com.allegaeon.catworld.model.Vet;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;

class CatMapperTest {

    private final CatMapper catMapper = new CatMapper();

    @ParameterizedTest
    @ValueSource(booleans = {true, false})
    void toResponseDTOMapsExplicitCanDeleteValue(boolean canDelete) {
        UUID catId = UUID.randomUUID();
        UUID ownerId = UUID.randomUUID();
        UUID vetId = UUID.randomUUID();
        Cat cat = Cat.builder()
                .id(catId)
                .name("Milo")
                .owner(Owner.builder()
                        .id(ownerId)
                        .fullName("Cat Owner")
                        .build())
                .vet(Vet.builder()
                        .id(vetId)
                        .name("Central Vet")
                        .build())
                .build();

        CatResponseDTO response = catMapper.toResponseDTO(cat, canDelete);

        assertEquals(catId, response.getId());
        assertEquals("Milo", response.getName());
        assertEquals(ownerId, response.getOwnerId());
        assertEquals("Cat Owner", response.getOwnerName());
        assertEquals(vetId, response.getVetId());
        assertEquals("Central Vet", response.getVetName());
        assertEquals(canDelete, response.isCanDelete());
    }

    @Test
    void toResponseDTODefaultsCanDeleteToFalse() {
        Cat cat = Cat.builder()
                .id(UUID.randomUUID())
                .name("Milo")
                .owner(Owner.builder()
                        .id(UUID.randomUUID())
                        .fullName("Cat Owner")
                        .build())
                .build();

        CatResponseDTO response = catMapper.toResponseDTO(cat);

        assertFalse(response.isCanDelete());
    }
}
