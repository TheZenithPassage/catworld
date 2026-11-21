package com.allegaeon.catworld.service;

import com.allegaeon.catworld.dto.CatProfileOptionDto;
import com.allegaeon.catworld.dto.CatRequestDTO;
import com.allegaeon.catworld.dto.FoodBrandOption;
import com.allegaeon.catworld.dto.FoodVarietyOption;
import com.allegaeon.catworld.dto.ManagedCatProfileOption;
import com.allegaeon.catworld.exception.BadRequestException;
import com.allegaeon.catworld.exception.CatCatalogOptionInUseException;
import com.allegaeon.catworld.exception.CatIntakeCatalogChangedException;
import com.allegaeon.catworld.exception.ResourceNotFoundException;
import com.allegaeon.catworld.model.Cat;
import com.allegaeon.catworld.model.FoodBrand;
import com.allegaeon.catworld.model.FoodVariety;
import com.allegaeon.catworld.repository.CatIntakeReviewRepository;
import com.allegaeon.catworld.repository.FoodBrandRepository;
import com.allegaeon.catworld.repository.FoodVarietyRepository;
import com.allegaeon.catworld.repository.CatRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;

import static com.allegaeon.catworld.service.CatProfileOptionService.hiddenName;
import static com.allegaeon.catworld.service.CatalogOptionName.binaryId;
import static com.allegaeon.catworld.service.CatalogOptionName.cleanName;
import static com.allegaeon.catworld.service.CatalogOptionName.key;
import static com.allegaeon.catworld.service.CatalogOptionName.sameName;

@Service
@RequiredArgsConstructor
public class FoodBrandService {
    private final FoodBrandRepository brands;
    private final FoodVarietyRepository varieties;
    private final CatRepository cats;
    private final CatIntakeReviewRepository reviews;

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

    void deleteOption(String field, UUID id) {
        if (CatIntakeCatalog.FOOD_DETAIL.equals(field)) {
            var missing = new ResourceNotFoundException("Food variety", id);
            var brandId = varieties.findById(id).map(FoodVariety::getBrandId).orElseThrow(() -> missing);
            brands.findLockedById(brandId).orElseThrow(() -> missing);
            var variety = varieties.findLockedById(id).orElseThrow(() -> missing);
            requireUnusedVariety(id);
            varieties.delete(variety);
            return;
        }
        var brand = brands.findLockedById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Food brand", id));
        if (cats.existsByFoodBrandId(id) || reviews.referencesPendingOption(id)) {
            throw new CatCatalogOptionInUseException();
        }
        for (var variety : varieties.findLockedByBrandIdOrderById(id)) {
            requireUnusedVariety(variety.getId());
        }
        varieties.deleteVarietiesByBrandId(id);
        brands.delete(brand);
    }

    private void requireUnusedVariety(UUID id) {
        if (cats.existsByFoodVarietyId(id) || reviews.referencesPendingOption(id)) {
            throw new CatCatalogOptionInUseException();
        }
    }

    void lockSubmittedReferences(Map<String, Set<UUID>> references) {
        for (UUID id : references.getOrDefault(CatIntakeCatalog.FOOD_BRAND, Set.of())) {
            if (brands.findLockedById(id).isEmpty()) throw new CatIntakeCatalogChangedException(CatIntakeCatalog.FOOD_BRAND);
        }
        for (UUID id : references.getOrDefault(CatIntakeCatalog.FOOD_DETAIL, Set.of())) {
            if (varieties.findLockedById(id).isEmpty()) throw new CatIntakeCatalogChangedException(CatIntakeCatalog.FOOD_DETAIL);
        }
    }

    private static ManagedCatProfileOption managedBrand(FoodBrand brand) {
        return new ManagedCatProfileOption(brand.getId(), CatIntakeCatalog.FOOD_BRAND, brand.getName(), null,
                brand.isActive());
    }

    private static ManagedCatProfileOption managedVariety(FoodVariety variety) {
        return new ManagedCatProfileOption(variety.getId(), CatIntakeCatalog.FOOD_DETAIL, variety.getName(),
                variety.getBrandId(), variety.isActive());
    }

    void applyProfile(Cat cat, CatRequestDTO request, Map<String, UUID> reviewedOptions) {
        UUID previousBrand = cat.getFoodBrandId();
        applyBrand(cat, request, reviewedOptions.get(CatIntakeCatalog.FOOD_BRAND));
        boolean brandChanged = !Objects.equals(previousBrand, cat.getFoodBrandId());
        if (brandChanged) {
            cat.setFoodDetail(cat.getDisplayedFoodDetail());
            cat.setFoodVarietyId(null);
        }
        applyVariety(cat, request, reviewedOptions.get(CatIntakeCatalog.FOOD_DETAIL), brandChanged);
    }

    private void applyBrand(Cat cat, CatRequestDTO request, UUID reviewedId) {
        UUID brandId = reviewedId == null ? request.getFoodBrandId() : reviewedId;
        if (brandId != null) {
            if (brandId.equals(cat.getFoodBrandId())) return;
            var brand = brands.findLockedById(brandId).filter(entry -> reviewedId != null || entry.isActive())
                    .orElseThrow(() -> new BadRequestException("The selected food brand is unavailable"));
            cat.setFoodBrand(brand.getName());
            cat.setFoodBrandId(brand.getId());
            return;
        }
        if (!request.hasFoodBrandUpdate()) return;
        String supplied = request.getFoodBrand();
        boolean unlinked = request.isUnlinkedIntakeOption(CatIntakeCatalog.FOOD_BRAND);
        if (!unlinked && (sameName(cat.getFoodBrand(), supplied) || sameName(cat.getDisplayedFoodBrand(), supplied))) {
            return;
        }

        String name = cleanName(supplied);
        var brand = name == null || unlinked ? null
                : brands.findLockedByNormalizedKey(key(name)).filter(FoodBrand::isActive).orElse(null);
        cat.setFoodBrand(brand == null ? (name == null ? null : supplied) : brand.getName());
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

    private void applyVariety(Cat cat, CatRequestDTO request, UUID reviewedId, boolean brandChanged) {
        UUID selectedId = reviewedId == null ? request.getFoodVarietyId() : reviewedId;
        if (selectedId != null) {
            if (selectedId.equals(cat.getFoodVarietyId())) return;
            requireSelectableBrand(cat.getFoodBrandId(), reviewedId != null);
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
        boolean unlinked = request.isUnlinkedIntakeOption(CatIntakeCatalog.FOOD_DETAIL);
        if (!brandChanged && !unlinked
                && (sameName(cat.getFoodDetail(), supplied) || sameName(cat.getDisplayedFoodDetail(), supplied))) {
            return;
        }

        String name = cleanName(supplied);
        UUID brandId = cat.getFoodBrandId();
        FoodVariety variety = null;
        if (name != null && brandId != null && !unlinked
                && brands.findLockedById(brandId).filter(FoodBrand::isActive).isPresent()) {
            variety = varieties.findLockedByBrandIdAndNormalizedKey(brandId, key(name))
                    .filter(FoodVariety::isActive).orElse(null);
        }
        if (variety != null) {
            setVariety(cat, variety);
        } else {
            cat.setFoodDetail(name == null ? null : supplied.strip());
            cat.setFoodVarietyId(null);
        }
    }

    private void requireSelectableBrand(UUID brandId, boolean reviewed) {
        if (brandId == null || brands.findLockedById(brandId).filter(brand -> reviewed || brand.isActive()).isEmpty()) {
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
