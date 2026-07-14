package com.allegaeon.catworld.repository;

import com.allegaeon.catworld.model.Owner;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.Set;
import java.util.UUID;

@Repository
public interface OwnerRepository extends JpaRepository<Owner, UUID> {

    boolean existsByIdAndCatsIsNotEmpty(UUID id);

    @Query("""
            select distinct o.id
            from Owner o
            join o.cats c
            where o.id in :candidateIds
            """)
    Set<UUID> findOwnerIdsReferencedByCats(@Param("candidateIds") Collection<UUID> candidateIds);
}
