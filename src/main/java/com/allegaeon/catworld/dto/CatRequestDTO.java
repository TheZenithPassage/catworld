package com.allegaeon.catworld.dto;

import com.allegaeon.catworld.model.Sex;
import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonSetter;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PastOrPresent;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.time.Instant;
import java.time.LocalDate;
import java.time.Year;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Getter @Setter
@NoArgsConstructor(onConstructor_ = @JsonCreator)
@AllArgsConstructor
@Builder
public class CatRequestDTO {

    public interface Create {}

    public interface Update {}

    @NotNull(groups = Update.class, message = "Expected update timestamp is required")
    private Instant expectedUpdatedAt;

    @NotBlank(message = "Name is required")
    @Size(max = 100, message = "Name must not exceed 100 characters")
    private String name;

    private Boolean deceased;

    @PastOrPresent(message = "Birth date cannot be in the future")
    private LocalDate birthDate;

    @Min(value = 1000, message = "Birth year must have four digits")
    private Integer birthYear;

    @JsonIgnore
    @AssertTrue(groups = Create.class, message = "Birth date or birth year is required")
    public boolean isBirthSpecified() {
        return birthDate != null || birthYear != null;
    }

    @JsonIgnore
    @AssertTrue(message = "Provide either birth date or birth year")
    public boolean isBirthPrecisionValid() {
        return birthDate == null || birthYear == null;
    }

    @JsonIgnore
    @AssertTrue(message = "Birth year cannot be in the future")
    public boolean isBirthYearPastOrPresent() {
        return birthYear == null || birthYear <= Year.now().getValue();
    }

    @NotNull(message = "Sex is required")
    private Sex sex;

    @Size(max = 100, message = "Breed must not exceed 100 characters")
    private String breed;

    @JsonIgnore @Getter(AccessLevel.NONE) @Setter(AccessLevel.NONE)
    private boolean breedSupplied;

    @JsonSetter("breed")
    public void setBreed(String breed) {
        this.breed = breed;
        breedSupplied = true;
    }

    public boolean hasBreedUpdate() {
        return breedSupplied || breed != null;
    }

    @Size(max = 100, message = "Coat must not exceed 100 characters")
    private String coat;

    @Size(max = 100, message = "Color must not exceed 100 characters")
    private String color;

    @Size(max = 100, message = "Food brand must not exceed 100 characters")
    private String foodBrand;
    private UUID foodBrandId;

    @Size(max = 255, message = "Food detail must not exceed 255 characters")
    private String foodDetail;
    private UUID foodVarietyId;

    private boolean approveFoodBrand;
    private Set<String> approveCatalogOptions;
    private Map<String, UUID> catalogOptionIds;

    @JsonIgnore
    private boolean reviewedIntake;

    @JsonIgnore
    private boolean approveFoodVariety;

    @Size(max = 100, message = "Litter brand must not exceed 100 characters")
    private String litterBrand;

    @JsonIgnore @Getter(AccessLevel.NONE) @Setter(AccessLevel.NONE)
    private boolean foodBrandSupplied;

    @JsonIgnore @Getter(AccessLevel.NONE) @Setter(AccessLevel.NONE)
    private boolean foodDetailSupplied;

    @JsonIgnore @Getter(AccessLevel.NONE) @Setter(AccessLevel.NONE)
    private boolean litterBrandSupplied;

    @JsonSetter("foodBrand")
    public void setFoodBrand(String foodBrand) {
        this.foodBrand = foodBrand;
        foodBrandSupplied = true;
    }

    @JsonSetter("foodDetail")
    public void setFoodDetail(String foodDetail) {
        this.foodDetail = foodDetail;
        foodDetailSupplied = true;
    }

    @JsonSetter("litterBrand")
    public void setLitterBrand(String litterBrand) {
        this.litterBrand = litterBrand;
        litterBrandSupplied = true;
    }

    public boolean hasFoodBrandUpdate() {
        return foodBrandSupplied || foodBrand != null;
    }

    public boolean hasFoodDetailUpdate() {
        return foodDetailSupplied || foodDetail != null;
    }

    public boolean hasLitterBrandUpdate() {
        return litterBrandSupplied || litterBrand != null;
    }

    @Size(max = 255, message = "Personality must not exceed 255 characters")
    private String personality;

    @Size(max = 2000, message = "Care instructions must not exceed 2000 characters")
    private String careInstructions;

    @JsonIgnore @Getter(AccessLevel.NONE) @Setter(AccessLevel.NONE)
    private boolean careInstructionsSupplied;

    @JsonSetter("careInstructions")
    public void setCareInstructions(String careInstructions) {
        this.careInstructions = careInstructions;
        careInstructionsSupplied = true;
    }

    public boolean hasCareInstructionsUpdate() {
        return careInstructionsSupplied || careInstructions != null;
    }

    @Size(max = 10000, message = "Notes must not exceed 10000 characters")
    private String notes;

    @Size(max = 100, message = "Last internal dewormer name must not exceed 100 characters")
    private String lastInternalDewormerName;

    @JsonIgnore @Getter(AccessLevel.NONE) @Setter(AccessLevel.NONE)
    private boolean lastInternalDewormerNameSupplied;

    @JsonSetter("lastInternalDewormerName")
    public void setLastInternalDewormerName(String lastInternalDewormerName) {
        this.lastInternalDewormerName = lastInternalDewormerName;
        lastInternalDewormerNameSupplied = true;
    }

    public boolean hasLastInternalDewormerNameUpdate() {
        return lastInternalDewormerNameSupplied || lastInternalDewormerName != null;
    }

    @PastOrPresent(message = "Last internal deworming date cannot be in the future")
    private LocalDate lastInternalDewormingDate;

    @Size(max = 100, message = "Last external dewormer name must not exceed 100 characters")
    private String lastExternalDewormerName;

    @JsonIgnore @Getter(AccessLevel.NONE) @Setter(AccessLevel.NONE)
    private boolean lastExternalDewormerNameSupplied;

    @JsonSetter("lastExternalDewormerName")
    public void setLastExternalDewormerName(String lastExternalDewormerName) {
        this.lastExternalDewormerName = lastExternalDewormerName;
        lastExternalDewormerNameSupplied = true;
    }

    public boolean hasLastExternalDewormerNameUpdate() {
        return lastExternalDewormerNameSupplied || lastExternalDewormerName != null;
    }

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
