package com.allegaeon.catworld.service;

import com.allegaeon.catworld.exception.ResourceNotFoundException;
import com.allegaeon.catworld.model.Cat;
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

    public List<Cat> livingCats(UUID ownerId) {
        return cats.findByOwner_IdAndDeceasedFalseOrderByNameAscIdAsc(ownerId);
    }

    public Map<UUID, Preparation> prepare(UUID ownerId, List<Cat> cats, UUID stayId) {
        LocalDateTime now = LocalDateTime.now(clock);
        if (stayId != null && !stays.isUpcomingArrivalForOwner(stayId, ownerId, now,
                OperationsArrivalsService.arrivalWindowEndExclusive(now))) {
            throw new ResourceNotFoundException("Stay", stayId);
        }

        List<Cat> household = cats.stream()
                .filter(cat -> !cat.isDeceased() && cat.getOwner() != null && ownerId.equals(cat.getOwner().getId()))
                .toList();
        if (household.isEmpty()) {
            return Map.of();
        }

        List<UUID> catIds = household.stream().map(Cat::getId).toList();
        Map<UUID, LocalDate> departures = new HashMap<>();
        for (var upcoming : stayCats.findUpcomingStaysForOwnerCats(ownerId, catIds, now)) {
            LocalDate departure = upcoming.getEndAt().toLocalDate();
            if (upcoming.getStayId().equals(stayId)) {
                departures.put(upcoming.getCatId(), departure);
            } else {
                departures.putIfAbsent(upcoming.getCatId(), departure);
            }
        }

        Map<UUID, Preparation> result = new LinkedHashMap<>();
        for (Cat cat : household) {
            LocalDate through = departures.getOrDefault(cat.getId(), now.toLocalDate());
            result.put(cat.getId(), new Preparation(through, requestedFields(cat.getFoodBrand(), cat.getLitterBrand(),
                    cat.getLastRabiesDate(), cat.getLastTripleFelineDate(), through)));
        }
        return result;
    }

    public static List<String> requestedFields(String foodBrand, String litterBrand, LocalDate lastRabiesDate,
                                               LocalDate lastTripleFelineDate, LocalDate through) {
        List<String> fields = new ArrayList<>(4);
        if (!StringUtils.hasText(foodBrand)) {
            fields.add("foodBrand");
        }
        if (!StringUtils.hasText(litterBrand)) {
            fields.add("litterBrand");
        }
        for (var conflict : StayVaccineCoverage.findConflicts(lastRabiesDate, lastTripleFelineDate, through)) {
            fields.add(switch (conflict.vaccineType()) {
                case RABIES -> "lastRabiesDate";
                case TRIPLE_FELINE -> "lastTripleFelineDate";
            });
        }
        return List.copyOf(fields);
    }

    public record Preparation(LocalDate through, List<String> requestedFields) {}
}
