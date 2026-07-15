package com.allegaeon.catworld.repository;

import com.allegaeon.catworld.model.Stay;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.Set;
import java.util.UUID;

@Repository
public interface StayRepository extends JpaRepository<Stay, UUID> {

    boolean existsByOwner_Id(UUID ownerId);

    @Query("""
            select distinct s.owner.id
            from Stay s
            where s.owner.id in :candidateIds
            """)
    Set<UUID> findOwnerIdsReferencedByStays(@Param("candidateIds") Collection<UUID> candidateIds);
}
