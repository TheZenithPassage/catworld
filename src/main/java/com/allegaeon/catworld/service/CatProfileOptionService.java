package com.allegaeon.catworld.service;

import com.allegaeon.catworld.dto.CatProfileOptionDto;
import com.allegaeon.catworld.dto.CatRequestDTO;
import com.allegaeon.catworld.exception.BadRequestException;
import com.allegaeon.catworld.exception.ForbiddenException;
import com.allegaeon.catworld.model.Cat;
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

    void selectForApproval(CatRequestDTO request, Map<String, String> selected) {
        Set<String> approvals = new LinkedHashSet<>(FIELD_KEYS);
        approvals.retainAll(selected.keySet());
        request.setApproveCatalogOptions(approvals);
        if (approvals.contains(FOOD_BRAND.key())) request.setFoodBrand(selected.get(FOOD_BRAND.key()));
    }

    // The enclosing cat mutation owns the transaction, including newly approved options.
    void applyProfile(Cat cat, CatRequestDTO request) {
        Set<String> approvals = request.getApproveCatalogOptions() == null
                ? Set.of() : request.getApproveCatalogOptions();
        if (!FIELD_KEYS.containsAll(approvals)) {
            throw new BadRequestException("An unknown cat profile option was selected for approval");
        }
        boolean approveFood = request.isApproveFoodBrand() || approvals.contains(FOOD_BRAND.key());
        if ((approveFood || request.isApproveFoodVariety() || !approvals.isEmpty())
                && users.getCurrentUserAccount().getRole() != UserRole.ADMIN) {
            throw new ForbiddenException("Only administrators can approve cat profile options");
        }

        for (var field : CatProfileOptionField.values()) {
            if (field == FOOD_BRAND) {
                foodBrands.applyProfile(cat, request, approveFood);
            } else {
                applyOption(field, cat, suppliedName(field, request), approvals.contains(field.key()));
            }
        }
    }

    private void applyOption(CatProfileOptionField field, Cat cat, String supplied, boolean approve) {
        if (!approve && Objects.equals(field.nameOf(cat), supplied)) return;

        String name = cleanName(supplied);
        if (name == null) {
            if (approve) throw new BadRequestException("A name is required to approve " + field.key());
            field.setOption(cat, null, null);
            return;
        }

        byte[] normalizedKey = key(name);
        var option = options.findByCategoryAndNormalizedKey(field.key(), normalizedKey).orElse(null);
        if (option == null && approve) {
            options.insertIfAbsent(binaryId(UUID.randomUUID()), field.key(), name, normalizedKey);
            // A locking read sees a concurrent insert in MySQL repeatable-read transactions.
            option = options.findLockedByCategoryAndNormalizedKey(field.key(), normalizedKey).orElseThrow();
        }
        field.setOption(cat, option == null ? supplied : option.getName(), option == null ? null : option.getId());
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
