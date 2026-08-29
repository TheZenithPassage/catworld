package com.allegaeon.catworld.mapper;

import com.allegaeon.catworld.dto.CatRequestDTO;
import com.allegaeon.catworld.dto.CatResponseDTO;
import com.allegaeon.catworld.model.Cat;
import com.allegaeon.catworld.model.Owner;
import com.allegaeon.catworld.model.Vet;
import org.springframework.stereotype.Component;

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
                .name(cat.getName())
                .birthDate(cat.getBirthDate())
                .sex(cat.getSex())
                .breed(cat.getBreed())
                .coat(cat.getCoat())
                .color(cat.getColor())
                .foodBrand(cat.getFoodBrand())
                .litterBrand(cat.getLitterBrand())
                .personality(cat.getPersonality())
                .notes(cat.getNotes())
                .lastInternalDewormerName(cat.getLastInternalDewormerName())
                .lastInternalDewormingDate(cat.getLastInternalDewormingDate())
                .lastExternalDewormerName(cat.getLastExternalDewormerName())
                .lastExternalDewormingDate(cat.getLastExternalDewormingDate())
                .lastTripleFelineDate(cat.getLastTripleFelineDate())
                .lastRabiesDate(cat.getLastRabiesDate())
                .ownerId(cat.getOwner().getId())
                .ownerName(cat.getOwner().getFullName())
                .vetId(cat.getVet() != null ? cat.getVet().getId() : null)
                .vetName(cat.getVet() != null ? cat.getVet().getName() : null)
                .canDelete(canDelete)
                .hasPhoto(hasPhoto)
                .build();

    }

    public Cat toEntity(CatRequestDTO catRequestDTO, Owner owner, Vet vet) {

        return Cat.builder()
                .name(catRequestDTO.getName())
                .birthDate(catRequestDTO.getBirthDate())
                .sex(catRequestDTO.getSex())
                .breed(catRequestDTO.getBreed())
                .coat(catRequestDTO.getCoat())
                .color(catRequestDTO.getColor())
                .foodBrand(catRequestDTO.getFoodBrand())
                .litterBrand(catRequestDTO.getLitterBrand())
                .personality(catRequestDTO.getPersonality())
                .notes(normalizeOptional(catRequestDTO.getNotes()))
                .lastInternalDewormerName(catRequestDTO.getLastInternalDewormerName())
                .lastInternalDewormingDate(catRequestDTO.getLastInternalDewormingDate())
                .lastExternalDewormerName(catRequestDTO.getLastExternalDewormerName())
                .lastExternalDewormingDate(catRequestDTO.getLastExternalDewormingDate())
                .lastTripleFelineDate(catRequestDTO.getLastTripleFelineDate())
                .lastRabiesDate(catRequestDTO.getLastRabiesDate())
                .owner(owner)
                .vet(vet)
                .build();

    }

    public Cat updateEntity(Cat cat, CatRequestDTO catRequestDTO, Owner owner, Vet vet) {

        cat.setName(catRequestDTO.getName());
        cat.setBirthDate(catRequestDTO.getBirthDate());
        cat.setSex(catRequestDTO.getSex());
        cat.setBreed(catRequestDTO.getBreed());
        cat.setCoat(catRequestDTO.getCoat());
        cat.setColor(catRequestDTO.getColor());
        cat.setFoodBrand(catRequestDTO.getFoodBrand());
        cat.setLitterBrand(catRequestDTO.getLitterBrand());
        cat.setPersonality(catRequestDTO.getPersonality());
        cat.setNotes(normalizeOptional(catRequestDTO.getNotes()));
        cat.setLastInternalDewormerName(catRequestDTO.getLastInternalDewormerName());
        cat.setLastInternalDewormingDate(catRequestDTO.getLastInternalDewormingDate());
        cat.setLastExternalDewormerName(catRequestDTO.getLastExternalDewormerName());
        cat.setLastExternalDewormingDate(catRequestDTO.getLastExternalDewormingDate());
        cat.setLastTripleFelineDate(catRequestDTO.getLastTripleFelineDate());
        cat.setLastRabiesDate(catRequestDTO.getLastRabiesDate());
        cat.setOwner(owner);
        cat.setVet(vet);

        return cat;

    }

    private String normalizeOptional(String value) {
        if (value == null) return null;
        String normalized = value.trim();
        return normalized.isEmpty() ? null : normalized;
    }

}
