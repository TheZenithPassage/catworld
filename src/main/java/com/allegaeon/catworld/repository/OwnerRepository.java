package com.allegaeon.catworld.repository;

import com.allegaeon.catworld.model.Owner;
import com.allegaeon.catworld.repository.projection.OwnerLookupCandidateProjection;
import com.allegaeon.catworld.repository.projection.OwnerLookupCatProjection;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Slice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Repository
public interface OwnerRepository extends JpaRepository<Owner, UUID> {

    boolean existsByCreatedBy_Id(UUID createdById);

    boolean existsByIdAndCatsIsNotEmpty(UUID id);

    @Query("""
            select distinct o.id
            from Owner o
            join o.cats c
            where o.id in :candidateIds
            """)
    Set<UUID> findOwnerIdsReferencedByCats(@Param("candidateIds") Collection<UUID> candidateIds);

    @Query(value = """
            select bin_to_uuid(o.id) as id, o.full_name as fullName
            from owners o
            where o.full_name collate utf8mb4_0900_ai_ci
                    like concat('%', convert(:query using utf8mb4) collate utf8mb4_0900_ai_ci, '%')
               or exists (
                    select 1
                    from cats matching_cat
                    where matching_cat.owner_id = o.id
                      and matching_cat.name collate utf8mb4_0900_ai_ci
                            like concat('%', convert(:query using utf8mb4) collate utf8mb4_0900_ai_ci, '%')
               )
            order by o.full_name collate utf8mb4_0900_ai_ci, o.id
            """, nativeQuery = true)
    Slice<OwnerLookupCandidateProjection> searchLookupCandidates(
            @Param("query") String query,
            Pageable pageable);

    @Query(value = """
            select bin_to_uuid(o.id) as id, o.full_name as fullName
            from owners o
            where o.id = :id
            """, nativeQuery = true)
    OwnerLookupCandidateProjection findLookupCandidateById(@Param("id") UUID id);

    @Query(value = """
            select bin_to_uuid(c.owner_id) as ownerId, bin_to_uuid(c.id) as id, c.name as name
            from cats c
            where c.owner_id in :ownerIds
            order by c.owner_id, c.name collate utf8mb4_0900_ai_ci, c.id
            """, nativeQuery = true)
    List<OwnerLookupCatProjection> findLookupCats(@Param("ownerIds") Collection<UUID> ownerIds);
}
