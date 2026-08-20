package com.allegaeon.catworld.repository;

import com.allegaeon.catworld.model.Vet;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Slice;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.Set;
import java.util.UUID;

@Repository
public interface VetRepository extends JpaRepository<Vet, UUID> {

    boolean existsByCreatedBy_Id(UUID createdById);

    boolean existsByIdAndCatsIsNotEmpty(UUID id);

    @Query("""
            select distinct v.id
            from Vet v
            join v.cats c
            where v.id in :candidateIds
            """)
    Set<UUID> findVetIdsReferencedByCats(@Param("candidateIds") Collection<UUID> candidateIds);

    @Query(value = """
            select v.id as id, v.name as name
            from vets v
            where v.name collate utf8mb4_0900_ai_ci
                like concat('%', :query, '%') collate utf8mb4_0900_ai_ci
            order by v.name collate utf8mb4_0900_ai_ci, v.id
            """, nativeQuery = true)
    Slice<VetLookupProjection> searchLookupOptions(
            @Param("query") String query,
            Pageable pageable);
}
