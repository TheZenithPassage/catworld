package com.allegaeon.catworld.service;

import com.allegaeon.catworld.dto.CatProfileOptionDto;
import com.allegaeon.catworld.dto.FoodVarietyOption;
import com.allegaeon.catworld.dto.ManagedCatProfileOption;
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
    private static final String COAT = "coat";
    private static final String COLOR = "color";
    private static final String FOOD_DETAIL_BRAND_ID = "foodDetailBrand";

    // Use the same whitespace characters as trim() and /\s+/ in the recipient form.
    private static final Pattern FORM_WHITESPACE = Pattern.compile(
            "[\\x09-\\x0d\\x20\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000\\ufeff]+");

    private final Map<String, List<CatProfileOptionDto>> options;
    private final List<FoodVarietyOption> varieties;
    private final Map<UUID, Option> byId = new HashMap<>();

    CatIntakeCatalog(Map<String, List<CatProfileOptionDto>> options, List<FoodVarietyOption> varieties,
                     List<ManagedCatProfileOption> managed) {
        this.options = new LinkedHashMap<>(options);
        this.options.remove(COAT);
        this.options.remove(COLOR);
        this.varieties = varieties;
        managed.forEach(option -> byId.put(option.id(),
                new Option(option.id(), option.field(), option.brandId(), option.name(), false)));
        options.forEach((field, values) -> values.forEach(option ->
                byId.put(option.id(), new Option(option.id(), field, null, option.name(), true))));
        varieties.forEach(variety ->
                byId.put(variety.id(), new Option(variety.id(), FOOD_DETAIL, variety.brandId(), variety.name(), true)));
    }

    Map<String, List<CatProfileOptionDto>> options() {
        return options;
    }

    List<FoodVarietyOption> varieties() {
        return varieties;
    }

    Map<String, String> displayOriginal(Map<String, String> original, Map<String, UUID> originalIds) {
        var displayed = new LinkedHashMap<>(original);
        originalIds.forEach((field, id) -> {
            var option = byId.get(id);
            if (option != null && field.equals(option.field())) displayed.put(field, option.name());
        });
        return displayed;
    }

    Proposal propose(Map<String, String> supplied, Map<String, UUID> selection, Map<String, String> original,
                     Map<String, UUID> originalIds, Proposal previous) {
        removeBlankOptions(supplied);
        Map<String, String> result = new LinkedHashMap<>(supplied);
        Map<String, UUID> selected = new LinkedHashMap<>();
        String brand = supplied.getOrDefault(FOOD_BRAND, original.get(FOOD_BRAND));
        String previousBrand = previous.fields().getOrDefault(FOOD_BRAND, original.get(FOOD_BRAND));
        UUID brandId = selection.get(FOOD_BRAND);
        if (brandId == null && sameName(brand, previousBrand)) brandId = previous.optionIds().get(FOOD_BRAND);
        if (brandId == null && sameName(brand, original.get(FOOD_BRAND))) brandId = originalIds.get(FOOD_BRAND);
        UUID selectedBrand = brandId;
        selection.forEach((field, id) -> {
            if (id == null || !supplied.containsKey(field)
                    || (!isOption(field) && !COAT.equals(field) && !COLOR.equals(field))) {
                throw new BadRequestException("Supply the name for each selected catalog option");
            }
            if (!retainsSelection(field, supplied.get(field), id, selectedBrand, previous)
                    && !(id.equals(originalIds.get(field)) && sameName(supplied.get(field), original.get(field))
                    && (!FOOD_DETAIL.equals(field) || Objects.equals(selectedBrand, originalIds.get(FOOD_BRAND))))) {
                requireSelection(field, supplied.get(field), id, selectedBrand);
            }
        });

        boolean sameOriginalBrand = sameName(brand, original.get(FOOD_BRAND));
        boolean samePreviousBrand = sameName(brand, previousBrand);
        for (var entry : supplied.entrySet()) {
            String field = entry.getKey();
            String name = entry.getValue();
            if (!isOption(field)) {
                if (sameText(name, original.get(field))) {
                    result.remove(field);
                } else if (COAT.equals(field) || COLOR.equals(field)) {
                    String prior = previous.fields().get(field);
                    if (COAT.equals(field)) requireCoatLength(name, prior, original.get(field));
                    if (sameText(name, prior)) {
                        result.put(field, prior);
                        UUID previousId = previous.optionIds().get(field);
                        if (previousId != null) selected.put(field, previousId);
                    }
                }
                continue;
            }

            boolean variety = FOOD_DETAIL.equals(field);
            if ((!variety || sameOriginalBrand) && sameName(name, original.get(field))) {
                result.remove(field);
                continue;
            }

            UUID id = selection.get(field);
            UUID previousId = previous.optionIds().get(field);
            boolean unchanged = (!variety || samePreviousBrand || (previousId != null
                    && byId.containsKey(previousId) && Objects.equals(byId.get(previousId).brandId(), brandId)))
                    && sameName(name, previous.fields().get(field));
            if (unchanged && (id == null || id.equals(previousId))) {
                result.put(field, previous.fields().get(field));
                if (previousId != null && retainsSelection(field, name, previousId, brandId, previous)) {
                    selected.put(field, previousId);
                }
            } else if (id != null) {
                result.put(field, requireSelection(field, name, id, brandId).name());
                selected.put(field, id);
            } else {
                requireUnlisted(field, name, brandId);
                if (!variety) result.put(field, CatalogOptionName.cleanName(name));
            }
        }
        String foodDetailBrand = result.containsKey(FOOD_DETAIL) ? brand : null;
        if (result.containsKey(FOOD_DETAIL)) {
            if (sameName(result.get(FOOD_DETAIL), previous.fields().get(FOOD_DETAIL))
                    && (samePreviousBrand || (brandId != null && brandId.equals(expectedVarietyBrand(previous))))) {
                foodDetailBrand = previous.foodDetailBrand();
            }
            if (foodDetailBrand != null && brandId != null) selected.put(FOOD_DETAIL_BRAND_ID, brandId);
        }
        return new Proposal(result, selected, foodDetailBrand);
    }

    Map<String, UUID> displaySelections(Map<String, UUID> originalIds, Proposal proposed) {
        var result = new LinkedHashMap<>(originalIds);
        proposed.fields().keySet().forEach(result::remove);
        if (proposed.fields().containsKey(FOOD_BRAND)) result.remove(FOOD_DETAIL);
        proposed.optionIds().forEach((field, id) -> {
            if (proposed.fields().containsKey(field)) result.put(field, id);
        });
        return result;
    }

    String reviewVarietyBrand(Proposal proposal, UUID currentBrandId) {
        if (proposal.fields().containsKey(FOOD_BRAND) || proposal.foodDetailBrand() == null) {
            return proposal.foodDetailBrand();
        }
        var brand = byId.get(currentBrandId);
        return brand != null && currentBrandId.equals(expectedVarietyBrand(proposal))
                ? brand.name() : proposal.foodDetailBrand();
    }

    Map<String, UUID> revalidateApproval(Map<String, String> accepted, String currentBrand, UUID currentBrandId,
                                         String currentCoat, Proposal previous) {
        removeBlankOptions(accepted);
        String brand = accepted.getOrDefault(FOOD_BRAND, currentBrand);
        var reviewed = new LinkedHashMap<String, UUID>();
        UUID reviewedBrand = reviewedSelection(FOOD_BRAND, brand, previous);
        UUID brandId = !accepted.containsKey(FOOD_BRAND) ? currentBrandId
                : reviewedBrand == null ? exactId(FOOD_BRAND, brand, null) : reviewedBrand;
        UUID expectedBrand = expectedVarietyBrand(previous);
        if (accepted.containsKey(FOOD_DETAIL) && previous.foodDetailBrand() != null
                && (expectedBrand == null ? !sameName(previous.foodDetailBrand(), brand) : !expectedBrand.equals(brandId))) {
            throw new BadRequestException("Approve this variety together with its food brand");
        }
        accepted.replaceAll((field, name) -> {
            if (COAT.equals(field)) {
                requireCoatLength(name, previous.fields().get(field), currentCoat);
                if (sameText(name, previous.fields().get(field))) return previous.fields().get(field);
                if (sameText(name, currentCoat)) return currentCoat;
            }
            if (!isOption(field)) return name;
            if (FOOD_DETAIL.equals(field) && previous.foodDetailBrand() == null) return name;
            UUID persisted = reviewedSelection(field, name, previous);
            if (persisted != null) {
                reviewed.put(field, persisted);
                return name; // The mutation resolves the label using the accepted ID.
            }
            UUID exact = exactId(field, name, brandId);
            if (exact != null) return byId.get(exact).name();
            return FOOD_DETAIL.equals(field) ? name : CatalogOptionName.cleanName(name);
        });
        return reviewed;
    }

    private UUID expectedVarietyBrand(Proposal proposal) {
        UUID brandId = proposal.optionIds().get(FOOD_DETAIL_BRAND_ID);
        if (brandId != null) return brandId;
        brandId = proposal.optionIds().get(FOOD_BRAND);
        if (brandId != null) return brandId;
        var variety = byId.get(proposal.optionIds().get(FOOD_DETAIL));
        return variety == null ? null : variety.brandId();
    }

    private UUID reviewedSelection(String field, String name, Proposal previous) {
        UUID id = previous.optionIds().get(field);
        if (id == null || !sameName(name, previous.fields().get(field))) return null;
        Option option = byId.get(id);
        if (option == null || !field.equals(option.field())) {
            // Pre-existing coat and color options are never hidden by catalog management.
            throw new CatIntakeCatalogChangedException(field);
        }
        return id;
    }

    private boolean retainsSelection(String field, String name, UUID id, UUID brandId, Proposal previous) {
        Option option = byId.get(id);
        return id.equals(previous.optionIds().get(field)) && sameName(name, previous.fields().get(field))
                && option != null && inScope(option, field, brandId);
    }

    private void requireCoatLength(String name, String proposed, String existing) {
        if (!CatProfileOptionService.isFixedCoatLength(name) && !sameText(name, proposed) && !sameText(name, existing)) {
            throw new BadRequestException("Select a valid coat length");
        }
    }

    private boolean sameText(String name, String saved) {
        return saved != null && name.equals(saved.strip());
    }

    private Option requireSelection(String field, String name, UUID id, UUID brandId) {
        Option option = byId.get(id);
        if (option == null || !option.active()) throw new CatIntakeCatalogChangedException(field);
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
        if (byId.values().stream().anyMatch(option -> option.active() && inScope(option, field, brandId)
                && searchKey(option.name()).contains(search))) {
            throw new CatIntakeCatalogChangedException(field);
        }
    }

    private UUID exactId(String field, String name, UUID brandId) {
        if (name == null) return null;
        return byId.values().stream()
                .filter(option -> option.active() && inScope(option, field, brandId) && sameName(option.name(), name))
                .map(Option::id).findFirst().orElse(null);
    }

    private boolean isOption(String field) {
        return FOOD_DETAIL.equals(field) || options.containsKey(field);
    }

    private void removeBlankOptions(Map<String, String> fields) {
        fields.entrySet().removeIf(entry -> isOption(entry.getKey())
                && (searchKey(entry.getValue()).isEmpty() || CatalogOptionName.cleanName(entry.getValue()) == null));
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

    private record Option(UUID id, String field, UUID brandId, String name, boolean active) {}
}
