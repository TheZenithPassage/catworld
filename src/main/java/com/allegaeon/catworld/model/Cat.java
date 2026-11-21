package com.allegaeon.catworld.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.Formula;

import java.time.LocalDate;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Builder
@Table(name = "cats")
public class Cat extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private boolean deceased;

    private LocalDate birthDate;

    private Integer birthYear;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Sex sex;

    private String breed;
    private UUID breedOptionId;
    @Formula("(select catalog.name from cat_profile_options catalog where catalog.id = breed_option_id)")
    private String currentBreed;
    private String coat;
    private UUID coatOptionId;
    private String color;
    private UUID colorOptionId;
    private String foodBrand;
    private UUID foodBrandId;
    @Formula("(select catalog.name from food_brands catalog where catalog.id = food_brand_id)")
    private String currentFoodBrand;
    private String foodDetail;
    private UUID foodVarietyId;
    @Formula("(select catalog.name from food_varieties catalog where catalog.id = food_variety_id)")
    private String currentFoodDetail;
    private String litterBrand;
    @Enumerated(EnumType.STRING)
    @Column(length = 6)
    private LitterPreference litterPreference;
    @Column(length = 100)
    private String litterDetail;
    private UUID litterDetailOptionId;
    @Formula("(select catalog.name from cat_profile_options catalog where catalog.id = litter_detail_option_id)")
    private String currentLitterDetail;
    private String personality;

    @Column(length = 2000)
    private String careInstructions;

    @Column(columnDefinition = "TEXT")
    private String notes;

    private String lastInternalDewormerName;
    private UUID lastInternalDewormerOptionId;
    @Formula("(select catalog.name from cat_profile_options catalog where catalog.id = last_internal_dewormer_option_id)")
    private String currentLastInternalDewormerName;
    private LocalDate lastInternalDewormingDate;
    private String lastExternalDewormerName;
    private UUID lastExternalDewormerOptionId;
    @Formula("(select catalog.name from cat_profile_options catalog where catalog.id = last_external_dewormer_option_id)")
    private String currentLastExternalDewormerName;
    private LocalDate lastExternalDewormingDate;
    private LocalDate lastTripleFelineDate;
    private LocalDate lastRabiesDate;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "owner_id", nullable = false)
    private Owner owner;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vet_id")
    private Vet vet;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "created_by_id", nullable = false, updatable = false)
    private UserAccount createdBy;

    public String getDisplayedBreed() {
        return currentBreed == null ? breed : currentBreed;
    }

    public void setBreedOptionId(UUID id) {
        breedOptionId = id;
        currentBreed = null;
    }

    public String getDisplayedFoodBrand() {
        return currentFoodBrand == null ? foodBrand : currentFoodBrand;
    }

    public void setFoodBrandId(UUID id) {
        foodBrandId = id;
        currentFoodBrand = null;
    }

    public String getDisplayedFoodDetail() {
        return currentFoodDetail == null ? foodDetail : currentFoodDetail;
    }

    public void setFoodVarietyId(UUID id) {
        foodVarietyId = id;
        currentFoodDetail = null;
    }

    public LitterPreference getLitterPreference() {
        return litterPreference == null ? LitterPreference.fromLegacyValue(litterBrand) : litterPreference;
    }

    public String getLitterDetail() {
        return litterPreference == null ? LitterPreference.detailFromLegacyValue(litterBrand) : litterDetail;
    }

    public String getDisplayedLitterDetail() {
        return currentLitterDetail == null ? getLitterDetail() : currentLitterDetail;
    }

    public String getStoredLitterValue() {
        return litterValue(getLitterDetail());
    }

    public String getDisplayedLitterValue() {
        return litterValue(getDisplayedLitterDetail());
    }

    private String litterValue(String detail) {
        LitterPreference preference = getLitterPreference();
        if (preference == null) return null;
        return preference.legacyValueWithDetail(detail);
    }

    public void setLitterPreference(LitterPreference preference) {
        litterDetail = preference == LitterPreference.OWN ? getLitterDetail() : null;
        litterPreference = preference;
        litterBrand = preference == null ? null : preference.legacyValue();
        if (preference != LitterPreference.OWN) setLitterDetailOptionId(null);
    }

    public void setLitterDetailOptionId(UUID id) {
        litterDetailOptionId = id;
        currentLitterDetail = null;
    }

    public String getDisplayedLastInternalDewormerName() {
        return currentLastInternalDewormerName == null ? lastInternalDewormerName : currentLastInternalDewormerName;
    }

    public void setLastInternalDewormerOptionId(UUID id) {
        lastInternalDewormerOptionId = id;
        currentLastInternalDewormerName = null;
    }

    public String getDisplayedLastExternalDewormerName() {
        return currentLastExternalDewormerName == null ? lastExternalDewormerName : currentLastExternalDewormerName;
    }

    public void setLastExternalDewormerOptionId(UUID id) {
        lastExternalDewormerOptionId = id;
        currentLastExternalDewormerName = null;
    }

    @Builder.Default
    @OneToMany(fetch = FetchType.LAZY, mappedBy = "cat")
    private Set<StayCat> stayCats = new HashSet<>();

}
