package com.allegaeon.catworld.service;

import com.allegaeon.catworld.dto.CatProfileOptionDto;
import com.allegaeon.catworld.dto.CatRequestDTO;
import com.allegaeon.catworld.exception.BadRequestException;
import com.allegaeon.catworld.exception.ForbiddenException;
import com.allegaeon.catworld.model.Cat;
import com.allegaeon.catworld.model.CatProfileOption;
import com.allegaeon.catworld.model.CatProfileOptionField;
import com.allegaeon.catworld.model.UserRole;
import com.allegaeon.catworld.repository.CatProfileOptionRepository;
import com.allegaeon.catworld.security.CurrentUserAccountService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;

import static com.allegaeon.catworld.model.CatProfileOptionField.FOOD_BRAND;
import static com.allegaeon.catworld.service.CatalogOptionName.binaryId;
import static com.allegaeon.catworld.service.CatalogOptionName.cleanName;
import static com.allegaeon.catworld.service.CatalogOptionName.key;

@Service
@RequiredArgsConstructor
public class CatProfileOptionService {
    private static final List<String> FIELD_KEYS = Arrays.stream(CatProfileOptionField.values())
            .map(CatProfileOptionField::key).toList();
    private static final List<String> MANAGED_FIELDS = Arrays.stream(CatProfileOptionField.values())
            .filter(CatProfileOptionField::isCatalogManaged).map(CatProfileOptionField::key).toList();
    private static final Set<String> COAT_LENGTHS = Set.of("Corto", "Largo", "Sin pelo");

    static boolean isFixedCoatLength(String value) {
        return value != null && COAT_LENGTHS.contains(value);
    }

    private final CatProfileOptionRepository options;
    private final FoodBrandService foodBrands;
    private final CurrentUserAccountService users;

    @Transactional(readOnly = true)
    public Map<String, List<CatProfileOptionDto>> approvedOptions() {
        Map<String, List<CatProfileOptionDto>> result = new LinkedHashMap<>();
        FIELD_KEYS.forEach(field -> result.put(field, new ArrayList<>()));
        for (var option : options.findAllByOrderByNameAscIdAsc()) {
            result.get(option.getCategory()).add(new CatProfileOptionDto(option.getId(), option.getName()));
        }
        result.put(FOOD_BRAND.key(), foodBrands.approvedBrands().stream()
                .map(brand -> new CatProfileOptionDto(brand.id(), brand.name())).toList());
        return result;
    }

    @Transactional
    public CatProfileOptionDto publish(String field, String suppliedName, UUID brandId) {
        requireAdministrator();
        String name = cleanName(suppliedName);
        boolean variety = CatIntakeCatalog.FOOD_DETAIL.equals(field);
        if (name == null || name.length() > (variety ? 255 : 100)) {
            throw new BadRequestException("Provide a valid catalog option name");
        }
        if (variety) return foodBrands.publishVariety(name, brandId);
        if (brandId != null || field == null || !MANAGED_FIELDS.contains(field)) {
            throw new BadRequestException("This cat profile field cannot be published");
        }
        if (FOOD_BRAND.key().equals(field)) return foodBrands.publishBrand(name);
        var option = findOrPublishOption(field, name);
        return new CatProfileOptionDto(option.getId(), option.getName());
    }

    private void requireAdministrator() {
        if (users.getCurrentUserAccount().getRole() != UserRole.ADMIN) {
            throw new ForbiddenException("Only administrators can approve cat profile options");
        }
    }

    void selectForApproval(CatRequestDTO request, Map<String, String> selected) {
        request.setReviewedIntake(true);
        Set<String> approvals = new LinkedHashSet<>(MANAGED_FIELDS);
        approvals.retainAll(selected.keySet());
        request.setApproveCatalogOptions(approvals);
        if (approvals.contains(FOOD_BRAND.key())) request.setFoodBrand(selected.get(FOOD_BRAND.key()));
    }

    // The enclosing cat mutation owns the transaction, including newly approved options.
    void applyProfile(Cat cat, CatRequestDTO request) {
        Set<String> approvals = request.getApproveCatalogOptions() == null
                ? Set.of() : request.getApproveCatalogOptions();
        if (!MANAGED_FIELDS.containsAll(approvals)) {
            throw new BadRequestException("An unknown cat profile option was selected for approval");
        }
        boolean approveFood = request.isApproveFoodBrand() || approvals.contains(FOOD_BRAND.key());
        if (approveFood || request.isApproveFoodVariety() || !approvals.isEmpty()) requireAdministrator();

        Map<String, UUID> selected = request.getCatalogOptionIds() == null ? Map.of() : request.getCatalogOptionIds();
        if (!MANAGED_FIELDS.containsAll(selected.keySet()) || selected.containsKey(FOOD_BRAND.key())
                || selected.values().stream().anyMatch(Objects::isNull)) {
            throw new BadRequestException("An unknown cat profile option was selected");
        }
        for (var field : CatProfileOptionField.values()) {
            if (field == FOOD_BRAND) {
                foodBrands.applyProfile(cat, request, approveFood);
            } else {
                String supplied = suppliedName(field, request);
                if (field.isCatalogManaged()) {
                    applyOption(field, cat, supplied, approvals.contains(field.key()), selected.get(field.key()));
                } else {
                    applyDescription(field, cat, supplied, request.isReviewedIntake());
                }
            }
        }
    }

    private void applyDescription(CatProfileOptionField field, Cat cat, String supplied, boolean reviewedIntake) {
        if (Objects.equals(field.nameOf(cat), supplied)) return;
        String description = supplied == null || supplied.isBlank() ? null : supplied.strip();
        if (field == CatProfileOptionField.COAT && description != null && !reviewedIntake
                && !isFixedCoatLength(description)) {
            throw new BadRequestException("Select a valid coat length");
        }
        field.setOption(cat, reviewedIntake && description != null ? supplied : description, null);
    }

    private void applyOption(CatProfileOptionField field, Cat cat, String supplied, boolean approve, UUID selected) {
        if (selected != null) {
            var option = options.findById(selected)
                    .filter(entry -> field.key().equals(entry.getCategory()))
                    .orElseThrow(() -> new BadRequestException("The selected catalog option does not belong to this field"));
            field.setOption(cat, option.getName(), option.getId());
            return;
        }
        if (!approve && Objects.equals(field.nameOf(cat), supplied)) return;

        String name = cleanName(supplied);
        if (name == null) {
            if (approve) throw new BadRequestException("A name is required to approve " + field.key());
            field.setOption(cat, null, null);
            return;
        }

        var option = approve ? findOrPublishOption(field.key(), name) : null;
        field.setOption(cat, option == null ? supplied : option.getName(), option == null ? null : option.getId());
    }

    private CatProfileOption findOrPublishOption(String field, String name) {
        byte[] normalizedKey = key(name);
        var option = options.findByCategoryAndNormalizedKey(field, normalizedKey).orElse(null);
        if (option == null) {
            options.insertIfAbsent(binaryId(UUID.randomUUID()), field, name, normalizedKey);
            // A locking read sees a concurrent insert in MySQL repeatable-read transactions.
            option = options.findLockedByCategoryAndNormalizedKey(field, normalizedKey).orElseThrow();
        }
        return option;
    }

    private String suppliedName(CatProfileOptionField field, CatRequestDTO request) {
        return switch (field) {
            case BREED -> request.getBreed();
            case COAT -> request.getCoat();
            case COLOR -> request.getColor();
            case FOOD_BRAND -> request.getFoodBrand();
            case INTERNAL_DEWORMER -> request.getLastInternalDewormerName();
            case EXTERNAL_DEWORMER -> request.getLastExternalDewormerName();
        };
    }
}
