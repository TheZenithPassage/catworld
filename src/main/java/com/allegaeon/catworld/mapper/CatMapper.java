package com.allegaeon.catworld.mapper;

import com.allegaeon.catworld.dto.CatRequestDTO;
import com.allegaeon.catworld.dto.CatResponseDTO;
import com.allegaeon.catworld.model.Cat;
import com.allegaeon.catworld.model.CatProfileOptionField;
import com.allegaeon.catworld.model.Owner;
import com.allegaeon.catworld.model.Vet;
import org.springframework.stereotype.Component;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

@Component
public class CatMapper {

    public CatResponseDTO toResponseDTO(Cat cat) {
        return toResponseDTO(cat, false, false);
    }

    public CatResponseDTO toResponseDTO(Cat cat, boolean canDelete) {
        return toResponseDTO(cat, canDelete, false);
    }

    public CatResponseDTO toResponseDTO(Cat cat, boolean canDelete, boolean hasPhoto) {
        return CatResponseDTO.builder()
                .id(cat.getId())
                .updatedAt(cat.getUpdatedAt())
                .name(cat.getName())
                .deceased(cat.isDeceased())
                .birthDate(cat.getBirthDate())
                .birthYear(cat.getBirthYear())
                .sex(cat.getSex())
                .breed(cat.getBreed())
                .coat(cat.getCoat())
                .color(cat.getColor())
                .foodBrand(cat.getFoodBrand())
                .foodBrandId(cat.getFoodBrandId())
                .catalogOptionIds(catalogOptionIds(cat))
                .foodDetail(cat.getFoodDetail())
                .litterBrand(cat.getLitterBrand())
                .personality(cat.getPersonality())
                .careInstructions(cat.getCareInstructions())
                .notes(cat.getNotes())
                .lastInternalDewormerName(cat.getLastInternalDewormerName())
                .lastInternalDewormingDate(cat.getLastInternalDewormingDate())
                .lastExternalDewormerName(cat.getLastExternalDewormerName())
                .lastExternalDewormingDate(cat.getLastExternalDewormingDate())
                .lastTripleFelineDate(cat.getLastTripleFelineDate())
                .lastRabiesDate(cat.getLastRabiesDate())
                .ownerId(cat.getOwner().getId())
                .ownerName(cat.getOwner().getFullName())
                .ownerDeceased(cat.getOwner().isDeceased())
                .vetId(cat.getVet() != null ? cat.getVet().getId() : null)
                .vetName(cat.getVet() != null ? cat.getVet().getName() : null)
                .canDelete(canDelete)
                .hasPhoto(hasPhoto)
                .build();

    }

    public Cat toEntity(CatRequestDTO catRequestDTO, Owner owner, Vet vet) {

        return Cat.builder()
                .name(catRequestDTO.getName())
                .deceased(Boolean.TRUE.equals(catRequestDTO.getDeceased()))
                .birthDate(catRequestDTO.getBirthDate())
                .birthYear(catRequestDTO.getBirthYear())
                .sex(catRequestDTO.getSex())
                .litterBrand(catRequestDTO.getLitterBrand())
                .personality(catRequestDTO.getPersonality())
                .careInstructions(normalizeOptional(catRequestDTO.getCareInstructions()))
                .notes(normalizeOptional(catRequestDTO.getNotes()))
                .lastInternalDewormingDate(catRequestDTO.getLastInternalDewormingDate())
                .lastExternalDewormingDate(catRequestDTO.getLastExternalDewormingDate())
                .lastTripleFelineDate(catRequestDTO.getLastTripleFelineDate())
                .lastRabiesDate(catRequestDTO.getLastRabiesDate())
                .owner(owner)
                .vet(vet)
                .build();

    }

    public Cat updateEntity(Cat cat, CatRequestDTO catRequestDTO, Owner owner, Vet vet) {

        cat.setName(catRequestDTO.getName());
        if (catRequestDTO.getDeceased() != null) {
            cat.setDeceased(catRequestDTO.getDeceased());
        }
        if (catRequestDTO.isBirthSpecified()) {
            cat.setBirthDate(catRequestDTO.getBirthDate());
            cat.setBirthYear(catRequestDTO.getBirthYear());
        }
        cat.setSex(catRequestDTO.getSex());
        if (catRequestDTO.hasLitterBrandUpdate()) cat.setLitterBrand(catRequestDTO.getLitterBrand());
        cat.setPersonality(catRequestDTO.getPersonality());
        if (catRequestDTO.hasCareInstructionsUpdate()) {
            cat.setCareInstructions(normalizeOptional(catRequestDTO.getCareInstructions()));
        }
        cat.setNotes(normalizeOptional(catRequestDTO.getNotes()));
        cat.setLastInternalDewormingDate(catRequestDTO.getLastInternalDewormingDate());
        cat.setLastExternalDewormingDate(catRequestDTO.getLastExternalDewormingDate());
        cat.setLastTripleFelineDate(catRequestDTO.getLastTripleFelineDate());
        cat.setLastRabiesDate(catRequestDTO.getLastRabiesDate());
        cat.setOwner(owner);
        cat.setVet(vet);

        return cat;

    }

    private Map<String, UUID> catalogOptionIds(Cat cat) {
        Map<String, UUID> result = new LinkedHashMap<>();
        for (var field : CatProfileOptionField.values()) {
            UUID id = field.idOf(cat);
            if (id != null) result.put(field.key(), id);
        }
        if (cat.getFoodVarietyId() != null) result.put("foodDetail", cat.getFoodVarietyId());
        return result;
    }

    private String normalizeOptional(String value) {
        if (value == null) return null;
        String normalized = value.trim();
        return normalized.isEmpty() ? null : normalized;
    }

}
