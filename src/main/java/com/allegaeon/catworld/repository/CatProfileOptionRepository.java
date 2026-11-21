package com.allegaeon.catworld.repository;

import com.allegaeon.catworld.model.CatProfileOption;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface CatProfileOptionRepository extends JpaRepository<CatProfileOption, UUID> {
    List<CatProfileOption> findAllByOrderByNameAscIdAsc();

    Optional<CatProfileOption> findByCategoryAndNormalizedKey(String category, byte[] normalizedKey);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    Optional<CatProfileOption> findLockedByCategoryAndNormalizedKey(String category, byte[] normalizedKey);

    @Modifying
    @Query(value = """
            INSERT INTO cat_profile_options (id, category, name, normalized_key) VALUES (:id, :category, :name, :key)
            ON DUPLICATE KEY UPDATE id = id
            """, nativeQuery = true)
    void insertIfAbsent(byte[] id, String category, String name, byte[] key);
}
