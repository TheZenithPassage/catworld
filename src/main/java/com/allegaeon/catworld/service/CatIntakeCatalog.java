package com.allegaeon.catworld.service;

import com.allegaeon.catworld.dto.CatProfileOptionDto;
import com.allegaeon.catworld.dto.FoodVarietyOption;
import com.allegaeon.catworld.exception.BadRequestException;
import com.allegaeon.catworld.exception.CatIntakeCatalogChangedException;

import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;
import java.util.regex.Pattern;

final class CatIntakeCatalog {
    static final String FOOD_BRAND = "foodBrand";
    static final String FOOD_DETAIL = "foodDetail";

    // Use the same whitespace characters as trim() and /\s+/ in the recipient form.
    private static final Pattern FORM_WHITESPACE = Pattern.compile(
            "[\\x09-\\x0d\\x20\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000\\ufeff]+");

    private final Map<String, List<CatProfileOptionDto>> options;
    private final List<FoodVarietyOption> varieties;
    private final Map<UUID, Option> byId = new HashMap<>();

    CatIntakeCatalog(Map<String, List<CatProfileOptionDto>> options, List<FoodVarietyOption> varieties) {
        this.options = options;
        this.varieties = varieties;
        options.forEach((field, values) -> values.forEach(option ->
                byId.put(option.id(), new Option(option.id(), field, null, option.name()))));
        varieties.forEach(variety ->
                byId.put(variety.id(), new Option(variety.id(), FOOD_DETAIL, variety.brandId(), variety.name())));
    }

    Map<String, List<CatProfileOptionDto>> options() {
        return options;
    }

    List<FoodVarietyOption> varieties() {
        return varieties;
    }

    Proposal propose(Map<String, String> supplied, Map<String, UUID> selection, Map<String, String> original,
                     Proposal previous) {
        removeBlankOptions(supplied);
        Map<String, String> result = new LinkedHashMap<>(supplied);
        Map<String, UUID> selected = new LinkedHashMap<>();
        String brand = supplied.getOrDefault(FOOD_BRAND, original.get(FOOD_BRAND));
        UUID brandId = exactId(FOOD_BRAND, brand, null);
        selection.forEach((field, id) -> {
            if (id == null || !isOption(field) || !supplied.containsKey(field)) {
                throw new BadRequestException("Supply the name for each selected catalog option");
            }
            requireSelection(field, supplied.get(field), id, brandId);
        });

        boolean sameOriginalBrand = sameName(brand, original.get(FOOD_BRAND));
        boolean samePreviousBrand = sameName(brand, previous.fields().getOrDefault(FOOD_BRAND, original.get(FOOD_BRAND)));
        for (var entry : supplied.entrySet()) {
            String field = entry.getKey();
            String name = entry.getValue();
            if (!isOption(field)) {
                if (Objects.equals(name, original.getOrDefault(field, "").strip())) result.remove(field);
                continue;
            }

            boolean variety = FOOD_DETAIL.equals(field);
            if ((!variety || sameOriginalBrand) && sameName(name, original.get(field))) {
                result.remove(field);
                continue;
            }
            UUID id = selection.get(field);
            boolean unchanged = (!variety || samePreviousBrand) && sameName(name, previous.fields().get(field));
            UUID previousId = previous.optionIds().get(field);
            if (id == null && previousId != null && unchanged) {
                unchanged = matches(byId.get(previousId), field, name, brandId);
                if (unchanged) id = previousId;
            }
            if (unchanged) {
                // A retained legacy diet predates brand-scoped variety approval.
                if (variety && previous.foodDetailBrand() == null) id = null;
            }
            if (id != null) {
                result.put(field, requireSelection(field, name, id, brandId).name());
                selected.put(field, id);
            } else if (unchanged) {
                result.put(field, previous.fields().get(field));
            } else {
                requireUnlisted(field, name, brandId);
                if (!variety) result.put(field, CatalogOptionName.cleanName(name));
            }
        }
        String foodDetailBrand = result.containsKey(FOOD_DETAIL) ? brand : null;
        if (samePreviousBrand && sameName(result.get(FOOD_DETAIL), previous.fields().get(FOOD_DETAIL))) {
            foodDetailBrand = previous.foodDetailBrand();
        }
        return new Proposal(result, selected, foodDetailBrand);
    }

    Map<String, UUID> displaySelections(Map<String, String> original, Proposal proposed) {
        var values = new LinkedHashMap<>(original);
        values.putAll(proposed.fields());
        UUID brandId = exactId(FOOD_BRAND, values.get(FOOD_BRAND), null);
        Map<String, UUID> result = new LinkedHashMap<>();
        values.forEach((field, value) -> {
            if (!isOption(field)) return;
            if (FOOD_DETAIL.equals(field) && !proposed.fields().containsKey(field)
                    && !sameName(values.get(FOOD_BRAND), original.get(FOOD_BRAND))) return;
            UUID persisted = proposed.optionIds().get(field);
            if (persisted != null) {
                Option option = byId.get(persisted);
                if (matches(option, field, value, brandId)) result.put(field, persisted);
                return;
            }
            UUID id = exactId(field, value, brandId);
            if (id != null) result.put(field, id);
        });
        return result;
    }

    void revalidateApproval(Map<String, String> accepted, String currentBrand, Proposal previous) {
        removeBlankOptions(accepted);
        String brand = accepted.getOrDefault(FOOD_BRAND, currentBrand);
        UUID brandId = exactId(FOOD_BRAND, brand, null);
        if (accepted.containsKey(FOOD_DETAIL) && previous.foodDetailBrand() != null
                && !sameName(previous.foodDetailBrand(), brand)) {
            throw new BadRequestException("Approve this variety together with its food brand");
        }
        accepted.replaceAll((field, name) -> {
            if (!isOption(field)) return name;
            if (FOOD_DETAIL.equals(field) && previous.foodDetailBrand() == null) return name;
            UUID persisted = previous.optionIds().get(field);
            if (persisted != null && sameName(name, previous.fields().get(field))) {
                return requireSelection(field, name, persisted, brandId).name();
            }
            UUID exact = exactId(field, name, brandId);
            if (exact != null) return byId.get(exact).name();
            return FOOD_DETAIL.equals(field) ? name : CatalogOptionName.cleanName(name);
        });
    }

    private Option requireSelection(String field, String name, UUID id, UUID brandId) {
        Option option = byId.get(id);
        if (option == null) throw new CatIntakeCatalogChangedException(field);
        if (!option.field().equals(field)) {
            throw new BadRequestException("The selected catalog option has a different category");
        }
        if (FOOD_DETAIL.equals(field) && !Objects.equals(option.brandId(), brandId)) {
            throw new BadRequestException("The selected variety belongs to a different food brand");
        }
        if (!sameName(option.name(), name)) {
            throw new BadRequestException("The selected catalog option does not match its name");
        }
        return option;
    }

    private void requireUnlisted(String field, String name, UUID brandId) {
        String search = searchKey(name);
        if (byId.values().stream().anyMatch(option -> inScope(option, field, brandId)
                && searchKey(option.name()).contains(search))) {
            throw new CatIntakeCatalogChangedException(field);
        }
    }

    private UUID exactId(String field, String name, UUID brandId) {
        if (name == null) return null;
        return byId.values().stream().filter(option -> matches(option, field, name, brandId))
                .map(Option::id).findFirst().orElse(null);
    }

    private boolean isOption(String field) {
        return FOOD_DETAIL.equals(field) || options.containsKey(field);
    }

    private void removeBlankOptions(Map<String, String> fields) {
        fields.entrySet().removeIf(entry -> isOption(entry.getKey())
                && (searchKey(entry.getValue()).isEmpty() || CatalogOptionName.cleanName(entry.getValue()) == null));
    }

    private static boolean matches(Option option, String field, String name, UUID brandId) {
        return option != null && inScope(option, field, brandId) && sameName(option.name(), name);
    }

    private static boolean inScope(Option option, String field, UUID brandId) {
        return option.field().equals(field) && (!FOOD_DETAIL.equals(field) || Objects.equals(option.brandId(), brandId));
    }

    private static boolean sameName(String left, String right) {
        return searchKey(left).equals(searchKey(right));
    }

    private static String searchKey(String value) {
        return value == null ? "" : FORM_WHITESPACE.matcher(value).replaceAll(" ").trim().toLowerCase(Locale.ROOT);
    }

    record Proposal(Map<String, String> fields, Map<String, UUID> optionIds, String foodDetailBrand) {}

    private record Option(UUID id, String field, UUID brandId, String name) {}
}
