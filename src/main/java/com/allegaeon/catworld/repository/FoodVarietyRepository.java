package com.allegaeon.catworld.repository;

import com.allegaeon.catworld.model.FoodVariety;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface FoodVarietyRepository extends JpaRepository<FoodVariety, UUID> {
    List<FoodVariety> findAllByOrderByNameAscIdAsc();

    @Query("""
            select variety from FoodVariety variety
            where variety.active = true and variety.brandId in (select brand.id from FoodBrand brand where brand.active = true)
            order by variety.name, variety.id
            """)
    List<FoodVariety> findAvailableVarieties();

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    Optional<FoodVariety> findLockedById(UUID id);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    Optional<FoodVariety> findLockedByBrandIdAndNormalizedKey(UUID brandId, byte[] normalizedKey);

    @Modifying
    @Query(value = """
            INSERT INTO food_varieties (id, brand_id, name, normalized_key) VALUES (:id, :brandId, :name, :key)
            ON DUPLICATE KEY UPDATE id = id
            """, nativeQuery = true)
    void insertIfAbsent(byte[] id, byte[] brandId, String name, byte[] key);
}
