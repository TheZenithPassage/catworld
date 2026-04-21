package com.allegaeon.catworld.dto;

import com.allegaeon.catworld.model.Sex;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PastOrPresent;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.time.LocalDate;
import java.util.UUID;

@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CatRequestDTO {

    @NotBlank(message = "Name is required")
    @Size(max = 100, message = "Name must not exceed 100 characters")
    private String name;

    @NotNull(message = "Birth date is required")
    @PastOrPresent(message = "Birth date cannot be in the future")
    private LocalDate birthDate;

    @NotNull(message = "Sex is required")
    private Sex sex;

    @Size(max = 100, message = "Breed must not exceed 100 characters")
    private String breed;

    @Size(max = 100, message = "Coat must not exceed 100 characters")
    private String coat;

    @Size(max = 100, message = "Color must not exceed 100 characters")
    private String color;

    @Size(max = 100, message = "Food brand must not exceed 100 characters")
    private String foodBrand;

    @Size(max = 100, message = "Litter brand must not exceed 100 characters")
    private String litterBrand;

    @Size(max = 255, message = "Personality must not exceed 255 characters")
    private String personality;

    @Size(max = 100, message = "Last internal dewormer name must not exceed 100 characters")
    private String lastInternalDewormerName;

    @PastOrPresent(message = "Last internal deworming date cannot be in the future")
    private LocalDate lastInternalDewormingDate;

    @Size(max = 100, message = "Last external dewormer name must not exceed 100 characters")
    private String lastExternalDewormerName;

    @PastOrPresent(message = "Last external deworming date cannot be in the future")
    private LocalDate lastExternalDewormingDate;

    @PastOrPresent(message = "Last triple feline date cannot be in the future")
    private LocalDate lastTripleFelineDate;

    @PastOrPresent(message = "Last rabies date cannot be in the future")
    private LocalDate lastRabiesDate;

    @NotNull(message = "Owner id is required")
    private UUID ownerId;

    private UUID vetId;

}
