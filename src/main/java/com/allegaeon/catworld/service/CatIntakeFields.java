package com.allegaeon.catworld.service;

import com.allegaeon.catworld.dto.CatRequestDTO;
import com.allegaeon.catworld.exception.BadRequestException;
import com.allegaeon.catworld.model.Cat;
import com.allegaeon.catworld.model.CatProfileOptionField;
import com.allegaeon.catworld.model.LitterPreference;
import com.allegaeon.catworld.model.Sex;
import jakarta.validation.Validator;
import jakarta.validation.groups.Default;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;

@Component
@RequiredArgsConstructor
class CatIntakeFields {
    static final String LITTER_VALUE = "litterBrand";
    static final String LITTER_DETAIL = "litterDetail";
    private static final Set<String> BIRTH_FIELDS = Set.of("birthDate", "birthYear");
    private static final Set<String> ALLOWED = Set.of("name", "birthDate", "birthYear", "sex", "breed", "coat", "color",
            "personality", "foodBrand", "foodDetail", LITTER_VALUE, LITTER_DETAIL, "careInstructions",
            "lastInternalDewormerName", "lastInternalDewormingDate",
            "lastExternalDewormerName", "lastExternalDewormingDate", "lastTripleFelineDate", "lastRabiesDate");
    private static final Set<String> REQUIRED_REGISTRATION_DETAILS = Set.of(
            "breed", "coat", "color", "personality", "foodBrand", "foodDetail", LITTER_VALUE);

    private final Validator validator;

    static Map<String, String> snapshot(Cat cat) {
        Map<String, String> result = new LinkedHashMap<>();
        put(result, "name", cat.getName());
        put(result, "birthDate", cat.getBirthDate());
        put(result, "birthYear", cat.getBirthYear());
        put(result, "sex", cat.getSex());
        put(result, "breed", cat.getBreed());
        put(result, "coat", cat.getCoat());
        put(result, "color", cat.getColor());
        put(result, "personality", cat.getPersonality());
        put(result, "foodBrand", cat.getFoodBrand());
        put(result, "foodDetail", cat.getFoodDetail());
        put(result, LITTER_VALUE, cat.getStoredLitterValue());
        put(result, LITTER_DETAIL, cat.getLitterDetail());
        put(result, "careInstructions", cat.getCareInstructions());
        put(result, "lastInternalDewormerName", cat.getLastInternalDewormerName());
        put(result, "lastInternalDewormingDate", cat.getLastInternalDewormingDate());
        put(result, "lastExternalDewormerName", cat.getLastExternalDewormerName());
        put(result, "lastExternalDewormingDate", cat.getLastExternalDewormingDate());
        put(result, "lastTripleFelineDate", cat.getLastTripleFelineDate());
        put(result, "lastRabiesDate", cat.getLastRabiesDate());
        return result;
    }

    Map<String, UUID> originalSelections(Map<String, String> original, Cat current) {
        if (current == null) return Map.of();
        var result = new LinkedHashMap<String, UUID>();
        for (var field : CatProfileOptionField.values()) {
            UUID id = field.idOf(current);
            if (id != null && Objects.equals(original.get(field.key()), field.nameOf(current))) {
                result.put(field.key(), id);
            }
        }
        if (current.getFoodVarietyId() != null && result.containsKey(CatIntakeCatalog.FOOD_BRAND)
                && Objects.equals(original.get(CatIntakeCatalog.FOOD_DETAIL), current.getFoodDetail())) {
            result.put(CatIntakeCatalog.FOOD_DETAIL, current.getFoodVarietyId());
        }
        return result;
    }

    static Map<String, String> displayedSnapshot(Cat cat) {
        var result = snapshot(cat);
        for (var field : CatProfileOptionField.values()) {
            put(result, field.key(), field.displayedNameOf(cat));
        }
        put(result, CatIntakeCatalog.FOOD_DETAIL, cat.getDisplayedFoodDetail());
        put(result, LITTER_VALUE, cat.getDisplayedLitterValue());
        return result;
    }

    Map<String, String> nonBlank(Map<String, String> supplied) {
        if (supplied == null) throw new BadRequestException("Cat fields are required");
        if (!ALLOWED.containsAll(supplied.keySet())) throw new BadRequestException("An intake field is not editable");
        Map<String, String> result = new LinkedHashMap<>();
        supplied.forEach((key, value) -> {
            if (value != null && !value.isBlank()) result.put(key, value.strip());
        });
        if (result.keySet().containsAll(BIRTH_FIELDS)) {
            throw new BadRequestException("Provide either birth date or birth year");
        }
        if (result.containsKey(LITTER_DETAIL)) {
            if (LitterPreference.fromLegacyValue(result.get(LITTER_VALUE)) == LitterPreference.SHARED) {
                throw new BadRequestException("A litter detail can only be saved for own litter");
            }
            result.put(LITTER_VALUE, LitterPreference.OWN.legacyValueWithDetail(result.get(LITTER_DETAIL)));
        }
        return result;
    }

    Map<String, String> sharedFields(Map<String, String> saved) {
        var result = new LinkedHashMap<>(saved);
        result.keySet().retainAll(ALLOWED);
        return result;
    }

    void requireRegistrationDetails(Map<String, String> proposed) {
        if (!proposed.keySet().containsAll(REQUIRED_REGISTRATION_DETAILS)) {
            throw new BadRequestException("New cats require breed, coat, color, personality, food brand and detail, and litter");
        }
    }

    Map<String, String> merge(Cat current, Map<String, String> changes) {
        var result = current == null ? new LinkedHashMap<String, String>() : displayedSnapshot(current);
        if (changes.keySet().stream().anyMatch(BIRTH_FIELDS::contains)) {
            result.keySet().removeAll(BIRTH_FIELDS);
        }
        if (changes.containsKey(LITTER_VALUE)) result.remove(LITTER_DETAIL);
        result.putAll(changes);
        return result;
    }

    Map<String, String> comparisonBaseline(Map<String, String> original, Map<String, String> proposed) {
        var baseline = new LinkedHashMap<>(original);
        baseline.keySet().removeIf(key -> !canReview(key, proposed));
        return baseline;
    }

    boolean canReview(String key, Map<String, String> proposed) {
        return proposed.containsKey(key)
                || (LITTER_DETAIL.equals(key) && proposed.containsKey(LITTER_VALUE))
                || (BIRTH_FIELDS.contains(key) && proposed.keySet().stream().anyMatch(BIRTH_FIELDS::contains));
    }

    boolean isConflict(String key, Map<String, String> original, Map<String, String> current) {
        if (BIRTH_FIELDS.contains(key)) {
            return BIRTH_FIELDS.stream().anyMatch(part -> !Objects.equals(original.get(part), current.get(part)));
        }
        if (LITTER_VALUE.equals(key)) {
            return !Objects.equals(original.get(key), current.get(key))
                    || !Objects.equals(effectiveLitterDetail(original), effectiveLitterDetail(current));
        }
        return !Objects.equals(original.get(key), current.get(key));
    }

    private static String effectiveLitterDetail(Map<String, String> fields) {
        return fields.getOrDefault(LITTER_DETAIL, LitterPreference.detailFromLegacyValue(fields.get(LITTER_VALUE)));
    }

    CatRequestDTO request(UUID ownerId, Cat current, Map<String, String> values) {
        CatRequestDTO request = CatRequestDTO.builder()
                .ownerId(ownerId)
                .name(values.get("name"))
                .birthDate(date(values, "birthDate"))
                .birthYear(year(values.get("birthYear")))
                .sex(sex(values.get("sex")))
                .breed(values.get("breed"))
                .coat(values.get("coat"))
                .color(values.get("color"))
                .personality(values.get("personality"))
                .foodBrand(changedValue(values.get("foodBrand"), current == null ? null : current.getDisplayedFoodBrand()))
                .foodDetail(changedValue(values.get("foodDetail"), current == null ? null : current.getDisplayedFoodDetail()))
                .litterBrand(changedValue(values.get(LITTER_VALUE), current == null ? null : current.getDisplayedLitterValue()))
                .careInstructions(values.get("careInstructions"))
                .lastInternalDewormerName(values.get("lastInternalDewormerName"))
                .lastInternalDewormingDate(date(values, "lastInternalDewormingDate"))
                .lastExternalDewormerName(values.get("lastExternalDewormerName"))
                .lastExternalDewormingDate(date(values, "lastExternalDewormingDate"))
                .lastTripleFelineDate(date(values, "lastTripleFelineDate"))
                .lastRabiesDate(date(values, "lastRabiesDate"))
                .notes(current == null ? null : current.getNotes())
                .vetId(current == null || current.getVet() == null ? null : current.getVet().getId())
                .build();
        String litterDetail = values.get(LITTER_DETAIL);
        if (litterDetail != null && litterDetail.length() > 100) {
            throw new BadRequestException("Litter detail must not exceed 100 characters");
        }
        var violations = validator.validate(request, Default.class, CatRequestDTO.Create.class);
        if (!violations.isEmpty()) {
            var violation = violations.iterator().next();
            throw new BadRequestException(violation.getMessage());
        }
        return request;
    }

    private static String changedValue(String value, String current) {
        return Objects.equals(value, current) ? null : value;
    }

    private static void put(Map<String, String> fields, String key, Object value) {
        if (value != null) fields.put(key, value.toString());
    }

    static LocalDate date(Map<String, String> values, String key) {
        String value = values.get(key);
        if (value == null) return null;
        try {
            LocalDate date = LocalDate.parse(value);
            if (date.getYear() < 1000 || date.getYear() > 9999) throw new BadRequestException("Invalid " + key);
            return date;
        } catch (DateTimeParseException ignored) {
            throw new BadRequestException("Invalid " + key);
        }
    }

    private static Sex sex(String value) {
        if (value == null) return null;
        try {
            return Sex.valueOf(value);
        } catch (IllegalArgumentException ignored) {
            throw new BadRequestException("Invalid sex");
        }
    }

    private static Integer year(String value) {
        if (value == null) return null;
        if (!value.matches("[0-9]{4}")) throw new BadRequestException("Invalid birthYear");
        return Integer.valueOf(value);
    }
}
