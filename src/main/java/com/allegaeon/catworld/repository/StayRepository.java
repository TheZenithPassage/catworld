package com.allegaeon.catworld.repository;

import com.allegaeon.catworld.model.Stay;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

@Repository
public interface StayRepository extends JpaRepository<Stay, UUID> {

    Page<Stay> findByOwner_Id(UUID ownerId, Pageable pageable);

    boolean existsByCreatedBy_Id(UUID createdById);

    boolean existsByOwner_Id(UUID ownerId);

    @Query("""
            select s from Stay s
            join fetch s.owner
            left join fetch s.stayCats sc
            left join fetch sc.cat
            where s.cancelledAt is null
              and s.startAt < :windowEnd
              and s.endAt >= :windowStart
            """)
    List<Stay> findForOperationsAgenda(@Param("windowStart") LocalDateTime windowStart,
                                       @Param("windowEnd") LocalDateTime windowEnd);

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
