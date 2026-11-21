package com.allegaeon.catworld.service;

import com.allegaeon.catworld.dto.CatProfileOptionDto;
import com.allegaeon.catworld.dto.CatRequestDTO;
import com.allegaeon.catworld.dto.FoodBrandOption;
import com.allegaeon.catworld.dto.FoodVarietyOption;
import com.allegaeon.catworld.dto.ManagedCatProfileOption;
import com.allegaeon.catworld.exception.BadRequestException;
import com.allegaeon.catworld.exception.ResourceNotFoundException;
import com.allegaeon.catworld.model.Cat;
import com.allegaeon.catworld.model.FoodBrand;
import com.allegaeon.catworld.model.FoodVariety;
import com.allegaeon.catworld.repository.FoodBrandRepository;
import com.allegaeon.catworld.repository.FoodVarietyRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;

import static com.allegaeon.catworld.service.CatProfileOptionService.hiddenName;
import static com.allegaeon.catworld.service.CatalogOptionName.binaryId;
import static com.allegaeon.catworld.service.CatalogOptionName.cleanName;
import static com.allegaeon.catworld.service.CatalogOptionName.key;

@Service
@RequiredArgsConstructor
public class FoodBrandService {
    private final FoodBrandRepository brands;
    private final FoodVarietyRepository varieties;

    @Transactional(readOnly = true)
    public List<FoodBrandOption> approvedBrands() {
        return brands.findAllByActiveTrueOrderByNameAscIdAsc().stream()
                .map(brand -> new FoodBrandOption(brand.getId(), brand.getName()))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<FoodVarietyOption> approvedVarieties() {
        return varieties.findAvailableVarieties().stream()
                .map(variety -> new FoodVarietyOption(variety.getId(), variety.getBrandId(), variety.getName()))
                .toList();
    }

    CatProfileOptionDto publishBrand(String name) {
        var brand = findOrPublishBrand(name);
        return new CatProfileOptionDto(brand.getId(), brand.getName());
    }

    CatProfileOptionDto publishVariety(String name, UUID brandId) {
        if (brandId == null || brands.findLockedById(brandId).filter(FoodBrand::isActive).isEmpty()) {
            throw new BadRequestException("An approved food brand is required");
        }
        var variety = findOrPublishVariety(name, brandId);
        if (!variety.isActive()) throw hiddenName();
        return new CatProfileOptionDto(variety.getId(), variety.getName());
    }

    List<ManagedCatProfileOption> managedOptions() {
        var result = new ArrayList<ManagedCatProfileOption>();
        brands.findAllByOrderByNameAscIdAsc().stream().map(FoodBrandService::managedBrand).forEach(result::add);
        varieties.findAllByOrderByNameAscIdAsc().stream().map(FoodBrandService::managedVariety).forEach(result::add);
        return result;
    }

    ManagedCatProfileOption changeOption(String field, UUID id, String name, Boolean active) {
        if (CatIntakeCatalog.FOOD_BRAND.equals(field)) {
            var brand = brands.findLockedById(id).orElseThrow(() -> new ResourceNotFoundException("Food brand", id));
            if (name != null) brand.rename(name, key(name));
            else brand.setActive(active);
            brands.flush();
            return managedBrand(brand);
        }
        var variety = varieties.findLockedById(id).orElseThrow(() -> new ResourceNotFoundException("Food variety", id));
        if (name != null) variety.rename(name, key(name));
        else variety.setActive(active);
        varieties.flush();
        return managedVariety(variety);
    }

    private static ManagedCatProfileOption managedBrand(FoodBrand brand) {
        return new ManagedCatProfileOption(brand.getId(), CatIntakeCatalog.FOOD_BRAND, brand.getName(), null,
                brand.isActive());
    }

    private static ManagedCatProfileOption managedVariety(FoodVariety variety) {
        return new ManagedCatProfileOption(variety.getId(), CatIntakeCatalog.FOOD_DETAIL, variety.getName(),
                variety.getBrandId(), variety.isActive());
    }

    // A cat mutation owns the transaction, including any new catalog entry.
    void applyProfile(Cat cat, CatRequestDTO request, boolean approve, Map<String, UUID> reviewedOptions) {
        UUID previousBrand = cat.getFoodBrandId();
        applyBrand(cat, request, approve, reviewedOptions.get(CatIntakeCatalog.FOOD_BRAND));
        if (!Objects.equals(previousBrand, cat.getFoodBrandId())) {
            cat.setFoodVarietyId(null);
        }
        applyVariety(cat, request, reviewedOptions.get(CatIntakeCatalog.FOOD_DETAIL));
    }

    private void applyBrand(Cat cat, CatRequestDTO request, boolean approve, UUID reviewedId) {
        UUID brandId = reviewedId == null ? request.getFoodBrandId() : reviewedId;
        if (brandId != null) {
            if (brandId.equals(cat.getFoodBrandId())) return;
            var brand = brands.findLockedById(brandId).filter(entry -> reviewedId != null || entry.isActive())
                    .orElseThrow(() -> new BadRequestException("The selected food brand is unavailable"));
            cat.setFoodBrand(brand.getName());
            cat.setFoodBrandId(brand.getId());
            return;
        }
        if (!approve && !request.hasFoodBrandUpdate()) return;

        if (!approve && (Objects.equals(cat.getFoodBrand(), request.getFoodBrand())
                || Objects.equals(cat.getDisplayedFoodBrand(), request.getFoodBrand()))) return;
        String name = cleanName(request.getFoodBrand());
        if (name == null) {
            if (approve) throw new BadRequestException("A food brand is required for approval");
            cat.setFoodBrand(null);
            cat.setFoodBrandId(null);
            return;
        }

        var brand = approve ? findOrPublishBrand(name) : null;
        cat.setFoodBrand(brand == null ? request.getFoodBrand() : brand.getName());
        cat.setFoodBrandId(brand == null ? null : brand.getId());
    }

    private FoodBrand findOrPublishBrand(String name) {
        byte[] key = key(name);
        brands.insertIfAbsent(binaryId(UUID.randomUUID()), name, key);
        // In MySQL's repeatable-read transactions a locking read sees a concurrent insert.
        var brand = brands.findLockedByNormalizedKey(key).orElseThrow();
        if (!brand.isActive()) throw hiddenName();
        return brand;
    }

    private void applyVariety(Cat cat, CatRequestDTO request, UUID reviewedId) {
        UUID selectedId = reviewedId == null ? request.getFoodVarietyId() : reviewedId;
        if (selectedId != null) {
            if (selectedId.equals(cat.getFoodVarietyId())) return;
            if (reviewedId == null) requireActiveBrand(cat.getFoodBrandId());
            var variety = varieties.findLockedById(selectedId).filter(entry -> reviewedId != null || entry.isActive())
                    .orElseThrow(() -> new BadRequestException("The selected food variety is unavailable"));
            if (!Objects.equals(variety.getBrandId(), cat.getFoodBrandId())) {
                throw new BadRequestException("The selected variety belongs to a different food brand");
            }
            setVariety(cat, variety);
            return;
        }
        if (!request.hasFoodDetailUpdate()) return;
        String supplied = request.getFoodDetail();
        String detail = supplied == null || supplied.isBlank() ? null : supplied.strip();
        if (!request.isApproveFoodVariety()) {
            if (Objects.equals(cat.getFoodDetail(), detail) || Objects.equals(cat.getDisplayedFoodDetail(), detail)) return;
            cat.setFoodVarietyId(null);
            cat.setFoodDetail(detail);
            return;
        }

        String name = cleanName(detail);
        if (name == null) throw new BadRequestException("A food variety name is required for approval");
        UUID brandId = cat.getFoodBrandId();
        if (brandId == null) {
            cat.setFoodDetail(detail);
            cat.setFoodVarietyId(null);
            return;
        }
        requireActiveBrand(brandId);
        var variety = findOrPublishVariety(name, brandId);
        if (!variety.isActive()) throw hiddenName();
        setVariety(cat, variety);
    }

    private void requireActiveBrand(UUID brandId) {
        if (brandId == null || brands.findLockedById(brandId).filter(FoodBrand::isActive).isEmpty()) {
            throw new BadRequestException("The selected food brand is unavailable");
        }
    }

    private FoodVariety findOrPublishVariety(String name, UUID brandId) {
        byte[] normalizedKey = key(name);
        varieties.insertIfAbsent(binaryId(UUID.randomUUID()), binaryId(brandId), name, normalizedKey);
        return varieties.findLockedByBrandIdAndNormalizedKey(brandId, normalizedKey).orElseThrow();
    }

    private void setVariety(Cat cat, FoodVariety variety) {
        cat.setFoodDetail(variety.getName());
        cat.setFoodVarietyId(variety.getId());
    }

}
