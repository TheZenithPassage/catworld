package com.allegaeon.catworld.service;

import com.allegaeon.catworld.dto.CatProfileOptionDto;
import com.allegaeon.catworld.dto.CatRequestDTO;
import com.allegaeon.catworld.dto.FoodBrandOption;
import com.allegaeon.catworld.dto.FoodVarietyOption;
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

import java.util.List;
import java.util.Objects;
import java.util.UUID;

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
        return brands.findAllByOrderByNameAscIdAsc().stream()
                .map(brand -> new FoodBrandOption(brand.getId(), brand.getName()))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<FoodVarietyOption> approvedVarieties() {
        return varieties.findAllByOrderByNameAscIdAsc().stream()
                .map(variety -> new FoodVarietyOption(variety.getId(), variety.getBrandId(), variety.getName()))
                .toList();
    }

    CatProfileOptionDto publishBrand(String name) {
        var brand = findOrPublishBrand(name);
        return new CatProfileOptionDto(brand.getId(), brand.getName());
    }

    CatProfileOptionDto publishVariety(String name, UUID brandId) {
        if (brandId == null || !brands.existsById(brandId)) {
            throw new BadRequestException("An approved food brand is required");
        }
        var variety = findOrPublishVariety(name, brandId);
        return new CatProfileOptionDto(variety.getId(), variety.getName());
    }

    // A cat mutation owns the transaction, including any new catalog entry.
    void applyProfile(Cat cat, CatRequestDTO request, boolean approve) {
        UUID previousBrand = cat.getFoodBrandId();
        applyBrand(cat, request, approve);
        if (!Objects.equals(previousBrand, cat.getFoodBrandId())) {
            cat.setFoodVarietyId(null);
        }
        applyVariety(cat, request);
    }

    private void applyBrand(Cat cat, CatRequestDTO request, boolean approve) {
        UUID brandId = request.getFoodBrandId();
        if (brandId != null) {
            var brand = brands.findById(brandId)
                    .orElseThrow(() -> new ResourceNotFoundException("Food brand", brandId));
            cat.setFoodBrand(brand.getName());
            cat.setFoodBrandId(brand.getId());
            return;
        }
        if (!approve && !request.hasFoodBrandUpdate()) return;

        if (!approve && Objects.equals(cat.getFoodBrand(), request.getFoodBrand())) return;
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
        var brand = brands.findByNormalizedKey(key).orElse(null);
        if (brand == null) {
            brands.insertIfAbsent(binaryId(UUID.randomUUID()), name, key);
            // In MySQL's repeatable-read transactions a locking read sees a concurrent insert.
            brand = brands.findLockedByNormalizedKey(key).orElseThrow();
        }
        return brand;
    }

    private void applyVariety(Cat cat, CatRequestDTO request) {
        UUID selectedId = request.getFoodVarietyId();
        if (selectedId != null) {
            var variety = varieties.findById(selectedId)
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
            if (!Objects.equals(cat.getFoodDetail(), detail)) cat.setFoodVarietyId(null);
            cat.setFoodDetail(detail);
            return;
        }

        String name = cleanName(detail);
        if (name == null) throw new BadRequestException("A food variety name is required for approval");
        UUID brandId = approvedBrandForVariety(cat);
        if (brandId == null) {
            cat.setFoodDetail(detail);
            cat.setFoodVarietyId(null);
            return;
        }
        setVariety(cat, findOrPublishVariety(name, brandId));
    }

    private FoodVariety findOrPublishVariety(String name, UUID brandId) {
        byte[] normalizedKey = key(name);
        var variety = varieties.findByBrandIdAndNormalizedKey(brandId, normalizedKey).orElse(null);
        if (variety == null) {
            varieties.insertIfAbsent(binaryId(UUID.randomUUID()), binaryId(brandId), name, normalizedKey);
            // The locking read also sees any concurrent insert in MySQL's repeatable-read transaction.
            variety = varieties.findLockedByBrandIdAndNormalizedKey(brandId, normalizedKey).orElseThrow();
        }
        return variety;
    }

    private void setVariety(Cat cat, FoodVariety variety) {
        cat.setFoodDetail(variety.getName());
        cat.setFoodVarietyId(variety.getId());
    }

    private UUID approvedBrandForVariety(Cat cat) {
        if (cat.getFoodBrandId() != null) return cat.getFoodBrandId();
        String name = cleanName(cat.getFoodBrand());
        if (name == null) return null;
        var brand = brands.findByNormalizedKey(key(name)).orElse(null);
        if (brand == null) return null;
        cat.setFoodBrandId(brand.getId());
        return brand.getId();
    }
}
