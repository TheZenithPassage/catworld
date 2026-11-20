package com.allegaeon.catworld.dto;

import com.allegaeon.catworld.model.Sex;
import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonSetter;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PastOrPresent;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Getter @Setter
@NoArgsConstructor(onConstructor_ = @JsonCreator)
@AllArgsConstructor
@Builder
public class CatRequestDTO {

    public interface Update {}

    @NotNull(groups = Update.class, message = "Expected update timestamp is required")
    private Instant expectedUpdatedAt;

    @NotBlank(message = "Name is required")
    @Size(max = 100, message = "Name must not exceed 100 characters")
    private String name;

    private Boolean deceased;

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
    private UUID foodBrandId;

    @Size(max = 255, message = "Food detail must not exceed 255 characters")
    private String foodDetail;

    private boolean approveFoodBrand;

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

    @Size(max = 10000, message = "Notes must not exceed 10000 characters")
    private String notes;

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
