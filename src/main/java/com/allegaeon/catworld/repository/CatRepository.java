package com.allegaeon.catworld.repository;

import com.allegaeon.catworld.model.Cat;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Slice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface CatRepository extends JpaRepository<Cat, UUID> {

    interface CatLookupProjection {
        UUID getId();
        String getName();
        String getOwnerName();
    }

    @Query(value = """
            select c.id as id, c.name as name, o.full_name as ownerName
            from cats c
            join owners o on o.id = c.owner_id
            where locate(
                convert(:query using utf8mb4) collate utf8mb4_0900_ai_ci,
                c.name collate utf8mb4_0900_ai_ci
            ) > 0
            order by c.name collate utf8mb4_0900_ai_ci, c.id
            """, nativeQuery = true)
    Slice<CatLookupProjection> searchLookupOptions(
            @Param("query") String query,
            Pageable pageable);

    boolean existsByCreatedBy_Id(UUID createdById);
}
