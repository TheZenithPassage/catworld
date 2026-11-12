package com.allegaeon.catworld.service;

import com.allegaeon.catworld.dto.CatRequestDTO;
import com.allegaeon.catworld.exception.BadRequestException;
import com.allegaeon.catworld.model.Cat;
import com.allegaeon.catworld.model.Sex;
import jakarta.validation.Validator;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Component
@RequiredArgsConstructor
class CatIntakeFields {
    private static final Set<String> ALLOWED = Set.of("name", "birthDate", "sex", "breed", "coat", "color",
            "personality", "foodBrand", "litterBrand", "lastInternalDewormerName", "lastInternalDewormingDate",
            "lastExternalDewormerName", "lastExternalDewormingDate", "lastTripleFelineDate", "lastRabiesDate");

    private final Validator validator;

    Map<String, String> snapshot(Cat cat) {
        Map<String, String> result = new LinkedHashMap<>();
        put(result, "name", cat.getName());
        put(result, "birthDate", cat.getBirthDate());
        put(result, "sex", cat.getSex());
        put(result, "breed", cat.getBreed());
        put(result, "coat", cat.getCoat());
        put(result, "color", cat.getColor());
        put(result, "personality", cat.getPersonality());
        put(result, "foodBrand", cat.getFoodBrand());
        put(result, "litterBrand", cat.getLitterBrand());
        put(result, "lastInternalDewormerName", cat.getLastInternalDewormerName());
        put(result, "lastInternalDewormingDate", cat.getLastInternalDewormingDate());
        put(result, "lastExternalDewormerName", cat.getLastExternalDewormerName());
        put(result, "lastExternalDewormingDate", cat.getLastExternalDewormingDate());
        put(result, "lastTripleFelineDate", cat.getLastTripleFelineDate());
        put(result, "lastRabiesDate", cat.getLastRabiesDate());
        return result;
    }

    Map<String, String> nonBlank(Map<String, String> supplied) {
        if (supplied == null) throw new BadRequestException("Cat fields are required");
        if (!ALLOWED.containsAll(supplied.keySet())) throw new BadRequestException("An intake field is not editable");
        Map<String, String> result = new LinkedHashMap<>();
        supplied.forEach((key, value) -> {
            if (value != null && !value.isBlank()) result.put(key, value.strip());
        });
        return result;
    }

    CatRequestDTO request(UUID ownerId, Cat current, Map<String, String> values) {
        CatRequestDTO request = CatRequestDTO.builder()
                .ownerId(ownerId)
                .name(values.get("name"))
                .birthDate(date(values, "birthDate"))
                .sex(sex(values.get("sex")))
                .breed(values.get("breed"))
                .coat(values.get("coat"))
                .color(values.get("color"))
                .personality(values.get("personality"))
                .foodBrand(values.get("foodBrand"))
                .litterBrand(values.get("litterBrand"))
                .lastInternalDewormerName(values.get("lastInternalDewormerName"))
                .lastInternalDewormingDate(date(values, "lastInternalDewormingDate"))
                .lastExternalDewormerName(values.get("lastExternalDewormerName"))
                .lastExternalDewormingDate(date(values, "lastExternalDewormingDate"))
                .lastTripleFelineDate(date(values, "lastTripleFelineDate"))
                .lastRabiesDate(date(values, "lastRabiesDate"))
                .notes(current == null ? null : current.getNotes())
                .vetId(current == null || current.getVet() == null ? null : current.getVet().getId())
                .build();
        var violations = validator.validate(request);
        if (!violations.isEmpty()) {
            var violation = violations.iterator().next();
            throw new BadRequestException(violation.getMessage());
        }
        return request;
    }

    private static void put(Map<String, String> fields, String key, Object value) {
        if (value != null) fields.put(key, value.toString());
    }

    private static LocalDate date(Map<String, String> values, String key) {
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
}
