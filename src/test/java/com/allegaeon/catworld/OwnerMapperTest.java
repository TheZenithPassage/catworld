package com.allegaeon.catworld;

import com.allegaeon.catworld.dto.OwnerResponseDTO;
import com.allegaeon.catworld.mapper.OwnerMapper;
import com.allegaeon.catworld.model.Owner;
import com.allegaeon.catworld.model.UserAccount;
import org.junit.jupiter.api.Test;

import java.util.Arrays;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class OwnerMapperTest {

    private final OwnerMapper ownerMapper = new OwnerMapper();

    @Test
    void toResponseDTOMapsBothCanDeleteValuesWithoutInternalDeletionData() {
        UUID ownerId = UUID.randomUUID();
        Owner owner = Owner.builder()
                .id(ownerId)
                .fullName("John Owner")
                .address("Main Street")
                .primaryPhone("123456789")
                .createdBy(UserAccount.builder()
                        .id(UUID.randomUUID())
                        .username("creator")
                        .build())
                .build();

        OwnerResponseDTO deletable = ownerMapper.toResponseDTO(owner, true);
        OwnerResponseDTO blocked = ownerMapper.toResponseDTO(owner, false);

        assertEquals(ownerId, deletable.getId());
        assertEquals("John Owner", deletable.getFullName());
        assertEquals("Main Street", deletable.getAddress());
        assertEquals("123456789", deletable.getPrimaryPhone());
        assertTrue(deletable.isCanDelete());
        assertFalse(blocked.isCanDelete());

        Set<String> responseFields = Arrays.stream(OwnerResponseDTO.class.getDeclaredFields())
                .map(field -> field.getName().toLowerCase())
                .collect(Collectors.toSet());
        assertFalse(responseFields.contains("creator"));
        assertFalse(responseFields.contains("creatorid"));
        assertFalse(responseFields.contains("createdby"));
        assertFalse(responseFields.contains("createdbyid"));
        assertFalse(responseFields.contains("catreference"));
        assertFalse(responseFields.contains("stayreference"));
    }

    @Test
    void toResponseDTODefaultsCanDeleteToFalse() {
        Owner owner = Owner.builder()
                .id(UUID.randomUUID())
                .fullName("John Owner")
                .primaryPhone("123456789")
                .build();

        OwnerResponseDTO response = ownerMapper.toResponseDTO(owner);

        assertFalse(response.isCanDelete());
    }
}
