package com.allegaeon.catworld.mapper;

import com.allegaeon.catworld.dto.OwnerRequestDTO;
import com.allegaeon.catworld.dto.OwnerResponseDTO;
import com.allegaeon.catworld.model.Owner;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
public class OwnerMapper {

    public OwnerResponseDTO toResponseDTO(Owner owner) {

        return toResponseDTO(owner, false);

    }

    public OwnerResponseDTO toResponseDTO(Owner owner, boolean canDelete) {

        return OwnerResponseDTO.builder()
                .id(owner.getId())
                .fullName(owner.getFullName())
                .address(owner.getAddress())
                .primaryPhone(owner.getPrimaryPhone())
                .secondaryPhone(owner.getSecondaryPhone())
                .secondaryPhoneName(owner.getSecondaryPhoneName())
                .instagram(owner.getInstagram())
                .facebook(owner.getFacebook())
                .notes(owner.getNotes())
                .canDelete(canDelete)
                .build();

    }

    public Owner toEntity(OwnerRequestDTO ownerRequestDTO) {

        return Owner.builder()
                .fullName(ownerRequestDTO.getFullName())
                .address(ownerRequestDTO.getAddress())
                .primaryPhone(ownerRequestDTO.getPrimaryPhone())
                .secondaryPhone(ownerRequestDTO.getSecondaryPhone())
                .secondaryPhoneName(ownerRequestDTO.getSecondaryPhoneName())
                .instagram(ownerRequestDTO.getInstagram())
                .facebook(ownerRequestDTO.getFacebook())
                .notes(normalizeOptional(ownerRequestDTO.getNotes()))
                .build();

    }

    public Owner updateEntity(Owner owner, OwnerRequestDTO ownerRequestDTO) {

        owner.setFullName(ownerRequestDTO.getFullName());
        owner.setAddress(ownerRequestDTO.getAddress());
        owner.setPrimaryPhone(ownerRequestDTO.getPrimaryPhone());
        owner.setSecondaryPhone(ownerRequestDTO.getSecondaryPhone());
        owner.setSecondaryPhoneName(ownerRequestDTO.getSecondaryPhoneName());
        owner.setInstagram(ownerRequestDTO.getInstagram());
        owner.setFacebook(ownerRequestDTO.getFacebook());
        owner.setNotes(normalizeOptional(ownerRequestDTO.getNotes()));

        return owner;

    }

    private String normalizeOptional(String value) {
        if (value == null) return null;
        String normalized = value.trim();
        return normalized.isEmpty() ? null : normalized;
    }

}
