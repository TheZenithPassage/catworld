package com.allegaeon.catworld.dto;

import com.allegaeon.catworld.model.Sex;
import lombok.*;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CatResponseDTO {

    private UUID id;
    private Instant updatedAt;
    private String name;
    private boolean deceased;
    private LocalDate birthDate;
    private Integer birthYear;
    private Sex sex;
    private String breed;
    private String coat;
    private String color;
    private String foodBrand;
    private UUID foodBrandId;
    private String foodDetail;
    private String litterBrand;
    private String personality;
    private String careInstructions;
    private String notes;
    private String lastInternalDewormerName;
    private LocalDate lastInternalDewormingDate;
    private String lastExternalDewormerName;
    private LocalDate lastExternalDewormingDate;
    private LocalDate lastTripleFelineDate;
    private LocalDate lastRabiesDate;
    private UUID ownerId;
    private String ownerName;
    private boolean ownerDeceased;
    private UUID vetId;
    private String vetName;
    private boolean canDelete;
    private boolean hasPhoto;

}
