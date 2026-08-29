package com.allegaeon.catworld;

import com.allegaeon.catworld.dto.*;
import com.allegaeon.catworld.mapper.*;
import com.allegaeon.catworld.model.*;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import org.junit.jupiter.api.Test;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

class OptionalNotesContractTest {

    private final Validator validator = Validation.buildDefaultValidatorFactory().getValidator();

    @Test
    void everyMutationContractAcceptsTenThousandAndRejectsTenThousandAndOneCharacters() {
        String accepted = "x".repeat(10_000);
        String rejected = "x".repeat(10_001);

        assertNotesBoundary(OwnerRequestDTO.builder().fullName("Owner").primaryPhone("1").notes(accepted).build(),
                OwnerRequestDTO.builder().fullName("Owner").primaryPhone("1").notes(rejected).build());
        assertNotesBoundary(CatRequestDTO.builder().name("Cat").notes(accepted).build(),
                CatRequestDTO.builder().name("Cat").notes(rejected).build());
        assertNotesBoundary(VetRequestDTO.builder().name("Vet").notes(accepted).build(),
                VetRequestDTO.builder().name("Vet").notes(rejected).build());
        assertNotesBoundary(StayRequestDTO.builder().notes(accepted).build(),
                StayRequestDTO.builder().notes(rejected).build());
        assertNotesBoundary(StayUpdateDTO.builder().notes(accepted).build(),
                StayUpdateDTO.builder().notes(rejected).build());
    }

    @Test
    void mappersNormalizeOuterWhitespaceAndBlankWhilePreservingInternalWhitespace() {
        String multiline = "  first line\n  second line  ";
        String expected = "first line\n  second line";

        OwnerMapper ownerMapper = new OwnerMapper();
        Owner owner = ownerMapper.toEntity(OwnerRequestDTO.builder().notes(multiline).build());
        assertEquals(expected, owner.getNotes());
        assertEquals(expected, ownerMapper.toResponseDTO(owner).getNotes());
        assertNull(ownerMapper.updateEntity(owner, OwnerRequestDTO.builder().notes(" \n ").build()).getNotes());

        Owner catOwner = Owner.builder().id(UUID.randomUUID()).fullName("Owner").build();
        CatMapper catMapper = new CatMapper();
        Cat cat = catMapper.toEntity(CatRequestDTO.builder().notes(multiline).build(), catOwner, null);
        assertEquals(expected, cat.getNotes());
        assertEquals(expected, catMapper.toResponseDTO(cat).getNotes());
        assertNull(catMapper.updateEntity(cat, CatRequestDTO.builder().notes(" ").build(), catOwner, null).getNotes());

        VetMapper vetMapper = new VetMapper();
        Vet vet = vetMapper.toEntity(VetRequestDTO.builder().notes(multiline).build());
        assertEquals(expected, vet.getNotes());
        assertEquals(expected, vetMapper.toResponseDTO(vet).getNotes());
        assertNull(vetMapper.updateEntity(vet, VetRequestDTO.builder().notes("\t").build()).getNotes());

        StayMapper stayMapper = new StayMapper();
        Stay stay = stayMapper.toEntity(StayRequestDTO.builder().notes(multiline).build());
        assertEquals(expected, stay.getNotes());
        assertNull(stayMapper.updateEntity(stay, StayUpdateDTO.builder().notes("\n").build()).getNotes());
    }

    private void assertNotesBoundary(Object accepted, Object rejected) {
        assertTrue(validator.validate(accepted).stream().noneMatch(v -> v.getPropertyPath().toString().equals("notes")));
        assertTrue(validator.validate(rejected).stream().anyMatch(v -> v.getPropertyPath().toString().equals("notes")));
    }
}
