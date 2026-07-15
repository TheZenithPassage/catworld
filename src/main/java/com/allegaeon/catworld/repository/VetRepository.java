package com.allegaeon.catworld.repository;

import com.allegaeon.catworld.model.Vet;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.Set;
import java.util.UUID;

@Repository
public interface VetRepository extends JpaRepository<Vet, UUID> {

    boolean existsByIdAndCatsIsNotEmpty(UUID id);

    @Query("""
            select distinct v.id
            from Vet v
            join v.cats c
            where v.id in :candidateIds
            """)
    Set<UUID> findVetIdsReferencedByCats(@Param("candidateIds") Collection<UUID> candidateIds);
}
