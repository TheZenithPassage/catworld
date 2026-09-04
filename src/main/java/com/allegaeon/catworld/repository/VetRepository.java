package com.allegaeon.catworld.repository;

import com.allegaeon.catworld.model.Vet;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.Set;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

@Repository
public interface VetRepository extends JpaRepository<Vet, UUID> {

    @Query("select v from Vet v")
    Page<Vet> findOverview(Pageable pageable);

    @Query("select v from Vet v where lower(v.name) like lower(concat('%', :query, '%')) escape '!'")
    Page<Vet> searchOverview(@Param("query") String query, Pageable pageable);

    @Query("select v from Vet v where lower(v.name) like lower(concat('%', :query, '%')) escape '!'")
    Page<Vet> search(@Param("query") String query, Pageable pageable);

    boolean existsByCreatedBy_Id(UUID createdById);

    boolean existsByIdAndCatsIsNotEmpty(UUID id);

    @Query("""
            select distinct v.id
            from Vet v
            join v.cats c
            where v.id in :candidateIds
            """)
    Set<UUID> findVetIdsReferencedByCats(@Param("candidateIds") Collection<UUID> candidateIds);
}
