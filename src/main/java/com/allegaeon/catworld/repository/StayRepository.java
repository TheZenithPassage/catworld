package com.allegaeon.catworld.repository;

import com.allegaeon.catworld.model.Stay;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

@Repository
public interface StayRepository extends JpaRepository<Stay, UUID> {

    boolean existsByCreatedBy_Id(UUID createdById);

    boolean existsByOwner_Id(UUID ownerId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select stay from Stay stay where stay.id = :stayId")
    Optional<Stay> findByIdForUpdate(@Param("stayId") UUID stayId);

    @Query("""
            select distinct s.owner.id
            from Stay s
            where s.owner.id in :candidateIds
            """)
    Set<UUID> findOwnerIdsReferencedByStays(@Param("candidateIds") Collection<UUID> candidateIds);
}
