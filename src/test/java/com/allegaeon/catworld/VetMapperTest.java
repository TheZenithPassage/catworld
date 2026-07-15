package com.allegaeon.catworld;

import com.allegaeon.catworld.dto.VetResponseDTO;
import com.allegaeon.catworld.mapper.VetMapper;
import com.allegaeon.catworld.model.UserAccount;
import com.allegaeon.catworld.model.Vet;
import org.junit.jupiter.api.Test;

import java.util.Arrays;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class VetMapperTest {

    private final VetMapper vetMapper = new VetMapper();

    @Test
    void toResponseDTOMapsBothCanDeleteValuesWithoutCreatorData() {
        UUID vetId = UUID.randomUUID();
        Vet vet = Vet.builder()
                .id(vetId)
                .name("Central Vet")
                .address("Main Street")
                .phoneNumber("123456789")
                .createdBy(UserAccount.builder()
                        .id(UUID.randomUUID())
                        .username("creator")
                        .build())
                .build();

        VetResponseDTO deletable = vetMapper.toResponseDTO(vet, true);
        VetResponseDTO blocked = vetMapper.toResponseDTO(vet, false);

        assertEquals(vetId, deletable.getId());
        assertEquals("Central Vet", deletable.getName());
        assertTrue(deletable.isCanDelete());
        assertFalse(blocked.isCanDelete());

        Set<String> responseFields = Arrays.stream(VetResponseDTO.class.getDeclaredFields())
                .map(field -> field.getName().toLowerCase())
                .collect(Collectors.toSet());
        assertFalse(responseFields.contains("creator"));
        assertFalse(responseFields.contains("creatorid"));
        assertFalse(responseFields.contains("createdby"));
        assertFalse(responseFields.contains("createdbyid"));
    }
}
