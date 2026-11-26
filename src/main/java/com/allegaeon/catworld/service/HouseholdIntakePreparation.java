package com.allegaeon.catworld.service;

import com.allegaeon.catworld.exception.ResourceNotFoundException;
import com.allegaeon.catworld.model.Cat;
import com.allegaeon.catworld.model.LitterPreference;
import com.allegaeon.catworld.repository.CatPhotoRepository;
import com.allegaeon.catworld.repository.CatRepository;
import com.allegaeon.catworld.repository.StayCatRepository;
import com.allegaeon.catworld.repository.StayRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class HouseholdIntakePreparation {
    private final CatRepository cats;
    private final StayRepository stays;
    private final StayCatRepository stayCats;
    private final Clock clock;
    private final CatPhotoRepository photos;

    private static final List<String> PROFILE_FIELDS = List.of(
            "name", "sex", "breed", "coat", "color", "personality", "foodBrand", "foodDetail", "litterBrand",
            "lastInternalDewormerName", "lastInternalDewormingDate",
            "lastExternalDewormerName", "lastExternalDewormingDate", "careInstructions");

    public List<Cat> livingCats(UUID ownerId) {
        return cats.findByOwner_IdAndDeceasedFalseOrderByNameAscIdAsc(ownerId);
    }

    public Map<UUID, Preparation> prepare(UUID ownerId, List<Cat> cats, UUID stayId) {
        LocalDateTime now = LocalDateTime.now(clock);
        if (stayId != null && !stays.isPendingArrivalForOwner(stayId, ownerId)) {
            throw new ResourceNotFoundException("Stay", stayId);
        }

        List<Cat> household = cats.stream()
                .filter(cat -> !cat.isDeceased() && cat.getOwner() != null && ownerId.equals(cat.getOwner().getId()))
                .toList();
        if (household.isEmpty()) {
            return Map.of();
        }

        List<UUID> catIds = household.stream().map(Cat::getId).toList();
        var photographed = photos.findPresentCatIds(catIds);
        Map<UUID, LocalDate> departures = new HashMap<>();
        for (var stay : stayCats.findPreparationStaysForOwnerCats(ownerId, catIds, now, stayId)) {
            LocalDate departure = stay.getEndAt().toLocalDate();
            if (stay.getStayId().equals(stayId)) {
                departures.put(stay.getCatId(), departure);
            } else {
                departures.putIfAbsent(stay.getCatId(), departure);
            }
        }

        Map<UUID, Preparation> result = new LinkedHashMap<>();
        for (Cat cat : household) {
            LocalDate through = departures.getOrDefault(cat.getId(), now.toLocalDate());
            var missing = new ArrayList<>(missingProfileFields(cat, photographed.contains(cat.getId())));
            if (cat.getLitterPreference() == LitterPreference.OWN && !StringUtils.hasText(cat.getDisplayedLitterDetail())) {
                missing.add("litterDetail");
            }
            for (var conflict : StayVaccineCoverage.findConflicts(
                    cat.getLastRabiesDate(), cat.getLastTripleFelineDate(), through, through)) {
                missing.add(switch (conflict.vaccineType()) {
                    case RABIES -> "lastRabiesDate";
                    case TRIPLE_FELINE -> "lastTripleFelineDate";
                });
            }
            result.put(cat.getId(), new Preparation(through, List.copyOf(missing)));
        }
        return result;
    }

    static List<String> missingProfileFields(Cat cat, boolean hasPhoto) {
        var profile = CatIntakeFields.displayedSnapshot(cat);
        List<String> fields = new ArrayList<>();
        if (!profile.containsKey("birthDate") && !profile.containsKey("birthYear")) fields.add("birthDate");
        PROFILE_FIELDS.stream().filter(field -> !StringUtils.hasText(profile.get(field))).forEach(fields::add);
        if (!hasPhoto) fields.add("profilePhoto");
        return fields;
    }

    public record Preparation(LocalDate through, List<String> requestedFields) {}
}
