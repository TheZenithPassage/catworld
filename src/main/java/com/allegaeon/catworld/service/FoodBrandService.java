package com.allegaeon.catworld.service;

import com.allegaeon.catworld.dto.CatRequestDTO;
import com.allegaeon.catworld.dto.FoodBrandOption;
import com.allegaeon.catworld.exception.BadRequestException;
import com.allegaeon.catworld.exception.ResourceNotFoundException;
import com.allegaeon.catworld.model.Cat;
import com.allegaeon.catworld.model.FoodBrand;
import com.allegaeon.catworld.repository.FoodBrandRepository;
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

    @Transactional(readOnly = true)
    public List<FoodBrandOption> approvedBrands() {
        return brands.findAllByOrderByNameAscIdAsc().stream()
                .map(brand -> new FoodBrandOption(brand.getId(), brand.getName()))
                .toList();
    }

    @Transactional(readOnly = true)
    public String matchingName(String supplied) {
        String name = cleanName(supplied);
        if (name == null) return null;
        return brands.findByNormalizedKey(key(name)).map(FoodBrand::getName).orElse(name);
    }

    // A cat mutation owns the transaction, including any new catalog entry.
    void applyProfile(Cat cat, CatRequestDTO request, boolean approve) {
        if (request.hasFoodDetailUpdate()) {
            String detail = request.getFoodDetail();
            cat.setFoodDetail(detail == null || detail.isBlank() ? null : detail.strip());
        }

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

        byte[] key = key(name);
        var brand = brands.findByNormalizedKey(key).orElse(null);
        if (brand == null && approve) {
            brands.insertIfAbsent(binaryId(UUID.randomUUID()), name, key);
            // In MySQL's repeatable-read transactions a locking read sees a concurrent insert.
            brand = brands.findLockedByNormalizedKey(key).orElseThrow();
        }
        cat.setFoodBrand(brand == null ? request.getFoodBrand() : brand.getName());
        cat.setFoodBrandId(brand == null ? null : brand.getId());
    }
}
