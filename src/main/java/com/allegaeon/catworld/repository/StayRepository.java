package com.allegaeon.catworld.repository;

import com.allegaeon.catworld.model.LitterPreference;
import com.allegaeon.catworld.model.Stay;
import com.allegaeon.catworld.model.StayStatus;
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
                   s.movementStatus as status, s.arrivalTransferRequired as transferRequired,
                   coalesce(c.currentFoodBrand, c.foodBrand) as foodBrand,
                   c.litterPreference as litterChoice, c.litterBrand as legacyLitterBrand,
                   coalesce(c.currentLitterDetail, c.litterDetail) as litterDetail,
                   c.lastRabiesDate as lastRabiesDate, c.lastTripleFelineDate as lastTripleFelineDate,
                   c as profile, case when exists (select p.catId from CatPhoto p where p.catId = c.id)
                       then true else false end as hasPhoto
            from Stay s
            join s.owner o
            left join s.stayCats sc
            left join sc.cat c
            where s.cancelledAt is null and s.movementStatus = RESERVED
                and (:endExclusive is null or s.startAt < :endExclusive)
            order by s.startAt, s.id, c.name, c.id
            """)
    List<ArrivalRow> findArrivalRows(@Param("endExclusive") LocalDateTime endExclusive);

    @Query("""
            select s.id as stayId, s.startAt as startAt, s.endAt as endAt,
                   o.id as ownerId, o.fullName as ownerName, c.id as catId, c.name as catName,
                   s.movementStatus as status, s.departureTransferRequired as transferRequired
            from Stay s
            join s.owner o
            left join s.stayCats sc
            left join sc.cat c
            where s.cancelledAt is null and s.movementStatus in (RESERVED, CHECKED_IN)
                and (:endExclusive is null or s.endAt < :endExclusive)
            order by s.endAt, s.id, c.name, c.id
            """)
    List<MovementRow> findDepartureRows(@Param("endExclusive") LocalDateTime endExclusive);

    @Query("""
            select count(s) > 0 from Stay s
            where s.id = :stayId and s.owner.id = :ownerId and s.cancelledAt is null
                and s.movementStatus = RESERVED
            """)
    boolean isPendingArrivalForOwner(@Param("stayId") UUID stayId, @Param("ownerId") UUID ownerId);

    interface MovementRow {
        UUID getStayId();
        LocalDateTime getStartAt();
        LocalDateTime getEndAt();
        UUID getOwnerId();
        String getOwnerName();
        UUID getCatId();
        String getCatName();
        StayStatus getStatus();
        boolean getTransferRequired();
    }

    interface ArrivalRow extends MovementRow {
        String getFoodBrand();
        LitterPreference getLitterChoice();
        String getLegacyLitterBrand();
        String getLitterDetail();
        LocalDate getLastRabiesDate();
        LocalDate getLastTripleFelineDate();
        com.allegaeon.catworld.model.Cat getProfile();
        boolean getHasPhoto();
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
