package com.allegaeon.catworld.repository;

import com.allegaeon.catworld.model.FoodBrand;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface FoodBrandRepository extends JpaRepository<FoodBrand, UUID> {
    List<FoodBrand> findAllByOrderByNameAscIdAsc();

    Optional<FoodBrand> findByNormalizedKey(byte[] normalizedKey);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    Optional<FoodBrand> findLockedByNormalizedKey(byte[] normalizedKey);

    @Modifying
    @Query(value = """
            INSERT INTO food_brands (id, name, normalized_key) VALUES (:id, :name, :key)
            ON DUPLICATE KEY UPDATE id = id
            """, nativeQuery = true)
    void insertIfAbsent(byte[] id, String name, byte[] key);
}
