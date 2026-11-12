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

import java.time.LocalDate;
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
            select s.id as stayId, s.startAt as startAt, s.endAt as endAt,
                   o.id as ownerId, o.fullName as ownerName, c.id as catId, c.name as catName,
                   c.foodBrand as foodBrand, c.litterBrand as litterBrand,
                   c.lastRabiesDate as lastRabiesDate, c.lastTripleFelineDate as lastTripleFelineDate
            from Stay s
            join s.owner o
            left join s.stayCats sc
            left join sc.cat c
            where s.cancelledAt is null and s.startAt > :now and s.startAt < :endExclusive
            order by s.startAt, s.id, c.name, c.id
            """)
    List<ArrivalRow> findArrivalRows(@Param("now") LocalDateTime now,
                                     @Param("endExclusive") LocalDateTime endExclusive);

    interface ArrivalRow {
        UUID getStayId();
        LocalDateTime getStartAt();
        LocalDateTime getEndAt();
        UUID getOwnerId();
        String getOwnerName();
        UUID getCatId();
        String getCatName();
        String getFoodBrand();
        String getLitterBrand();
        LocalDate getLastRabiesDate();
        LocalDate getLastTripleFelineDate();
    }

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
