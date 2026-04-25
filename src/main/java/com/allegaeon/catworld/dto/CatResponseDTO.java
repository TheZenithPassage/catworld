package com.allegaeon.catworld.dto;

import com.allegaeon.catworld.model.Sex;
import lombok.*;

import java.time.LocalDate;
import java.util.UUID;

@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CatResponseDTO {

    private UUID id;
    private String name;
    private LocalDate birthDate;
    private Sex sex;
    private String breed;
    private String coat;
    private String color;
    private String foodBrand;
    private String litterBrand;
    private String personality;
    private String lastInternalDewormerName;
    private LocalDate lastInternalDewormingDate;
    private String lastExternalDewormerName;
    private LocalDate lastExternalDewormingDate;
    private LocalDate lastTripleFelineDate;
    private LocalDate lastRabiesDate;
    private UUID ownerId;
    private String ownerName;
    private UUID vetId;
    private String vetName;

}
