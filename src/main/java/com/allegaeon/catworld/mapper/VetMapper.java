package com.allegaeon.catworld.mapper;

import com.allegaeon.catworld.dto.VetRequestDTO;
import com.allegaeon.catworld.dto.VetResponseDTO;
import com.allegaeon.catworld.model.Vet;
import org.springframework.stereotype.Component;

@Component
public class VetMapper {

    public VetResponseDTO toResponseDTO(Vet vet) {

        return toResponseDTO(vet, false);

    }

    public VetResponseDTO toResponseDTO(Vet vet, boolean canDelete) {

        return VetResponseDTO.builder()
                .id(vet.getId())
                .name(vet.getName())
                .address(vet.getAddress())
                .phoneNumber(vet.getPhoneNumber())
                .registrationNumber(vet.getRegistrationNumber())
                .notes(vet.getNotes())
                .canDelete(canDelete)
                .build();

    }

    public Vet toEntity(VetRequestDTO vetRequestDTO) {

        return Vet.builder()
                .name(vetRequestDTO.getName())
                .address(vetRequestDTO.getAddress())
                .phoneNumber(vetRequestDTO.getPhoneNumber())
                .registrationNumber(normalizeOptional(vetRequestDTO.getRegistrationNumber()))
                .notes(normalizeOptional(vetRequestDTO.getNotes()))
                .build();

    }

    public Vet updateEntity(Vet vet, VetRequestDTO vetRequestDTO) {

        vet.setName(vetRequestDTO.getName());
        vet.setAddress(vetRequestDTO.getAddress());
        vet.setPhoneNumber(vetRequestDTO.getPhoneNumber());
        vet.setRegistrationNumber(normalizeOptional(vetRequestDTO.getRegistrationNumber()));
        vet.setNotes(normalizeOptional(vetRequestDTO.getNotes()));

        return vet;

    }

    private String normalizeOptional(String value) {
        if (value == null) return null;
        String normalized = value.trim();
        return normalized.isEmpty() ? null : normalized;
    }

}
