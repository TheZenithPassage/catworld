package com.allegaeon.catworld.service;

import com.allegaeon.catworld.dto.CatRequestDTO;
import com.allegaeon.catworld.dto.FoodBrandOption;
import com.allegaeon.catworld.exception.BadRequestException;
import com.allegaeon.catworld.exception.ForbiddenException;
import com.allegaeon.catworld.exception.ResourceNotFoundException;
import com.allegaeon.catworld.model.Cat;
import com.allegaeon.catworld.model.FoodBrand;
import com.allegaeon.catworld.model.UserRole;
import com.allegaeon.catworld.repository.FoodBrandRepository;
import com.allegaeon.catworld.security.CurrentUserAccountService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Locale;
import java.util.Objects;
import java.util.UUID;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
public class FoodBrandService {
    private static final Pattern WHITESPACE = Pattern.compile("\\s+", Pattern.UNICODE_CHARACTER_CLASS);

    private final FoodBrandRepository brands;
    private final CurrentUserAccountService users;

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
    void applyProfile(Cat cat, CatRequestDTO request) {
        if (request.hasFoodDetailUpdate()) {
            String detail = request.getFoodDetail();
            cat.setFoodDetail(detail == null || detail.isBlank() ? null : detail.strip());
        }

        boolean approve = request.isApproveFoodBrand();
        if (approve && users.getCurrentUserAccount().getRole() != UserRole.ADMIN) {
            throw new ForbiddenException("Only administrators can approve food brands");
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
            UUID id = UUID.randomUUID();
            byte[] binaryId = ByteBuffer.allocate(16)
                    .putLong(id.getMostSignificantBits()).putLong(id.getLeastSignificantBits()).array();
            brands.insertIfAbsent(binaryId, name, key);
            // In MySQL's repeatable-read transactions a locking read sees a concurrent insert.
            brand = brands.findLockedByNormalizedKey(key).orElseThrow();
        }
        cat.setFoodBrand(brand == null ? request.getFoodBrand() : brand.getName());
        cat.setFoodBrandId(brand == null ? null : brand.getId());
    }

    private static String cleanName(String supplied) {
        if (supplied == null) return null;
        String cleaned = WHITESPACE.matcher(supplied).replaceAll(" ").trim();
        return cleaned.isEmpty() ? null : cleaned;
    }

    private static byte[] key(String name) {
        // A binary key keeps the database collation from treating distinct spellings as equal.
        return name.toLowerCase(Locale.ROOT).getBytes(StandardCharsets.UTF_8);
    }
}
