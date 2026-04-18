package com.allegaeon.catworld.mapper;

import com.allegaeon.catworld.dto.VetRequestDTO;
import com.allegaeon.catworld.dto.VetResponseDTO;
import com.allegaeon.catworld.model.Vet;
import org.springframework.stereotype.Component;

@Component
public class VetMapper {

    public VetResponseDTO toResponseDTO(Vet vet) {

        return VetResponseDTO.builder()
                .id(vet.getId())
                .name(vet.getName())
                .address(vet.getAddress())
                .phoneNumber(vet.getPhoneNumber())
                .build();

    }

    public Vet toEntity(VetRequestDTO vetRequestDTO) {

        return Vet.builder()
                .name(vetRequestDTO.getName())
                .address(vetRequestDTO.getAddress())
                .phoneNumber(vetRequestDTO.getPhoneNumber())
                .build();

    }

    public Vet updateEntity(Vet vet, VetRequestDTO vetRequestDTO) {

        vet.setName(vetRequestDTO.getName());
        vet.setAddress(vetRequestDTO.getAddress());
        vet.setPhoneNumber(vetRequestDTO.getPhoneNumber());

        return vet;

    }

}
