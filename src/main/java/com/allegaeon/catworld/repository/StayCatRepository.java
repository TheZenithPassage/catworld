package com.allegaeon.catworld.repository;

import com.allegaeon.catworld.model.StayCat;
import com.allegaeon.catworld.model.StayCatId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import com.allegaeon.catworld.model.Stay;
import com.allegaeon.catworld.model.Cat;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.Set;
import java.util.UUID;
import java.util.List;

@Repository
public interface StayCatRepository extends JpaRepository<StayCat, StayCatId> {

    @Query("select sc from StayCat sc join fetch sc.cat where sc.stay.id in :stayIds order by sc.cat.name asc, sc.cat.id asc")
    List<StayCat> findOverviewCatsByStayIds(@Param("stayIds") Collection<UUID> stayIds);

    @Query("""
            select sc.cat.id as catId, s.id as stayId, s.endAt as endAt
            from StayCat sc join sc.stay s
            where sc.cat.id in :catIds and sc.cat.owner.id = :ownerId and s.owner.id = :ownerId
                and s.cancelledAt is null and (s.startAt > :now or s.id = :selectedStayId)
            order by s.startAt, s.id
            """)
    List<UpcomingCatStay> findPreparationStaysForOwnerCats(@Param("ownerId") UUID ownerId,
                                                          @Param("catIds") Collection<UUID> catIds,
                                                          @Param("now") LocalDateTime now,
                                                          @Param("selectedStayId") UUID selectedStayId);

    interface UpcomingCatStay {
        UUID getCatId();
        UUID getStayId();
        LocalDateTime getEndAt();
    }

    @Query("select sc.stay from StayCat sc where sc.cat.id = :catId order by sc.stay.startAt desc, sc.stay.id asc")
    Page<Stay> findStaysByCatId(@Param("catId") UUID catId, Pageable pageable);

    @Query("select sc.cat from StayCat sc where sc.stay.id = :stayId order by sc.cat.name asc, sc.cat.id asc")
    Page<Cat> findCatsByStayId(@Param("stayId") UUID stayId, Pageable pageable);

    boolean existsByCat_Id(UUID catId);

    @Query("""
            select count(sc) > 0
            from StayCat sc join sc.stay s
            left join StayActualMovement d
                on d.id.stayId = s.id and d.id.type = com.allegaeon.catworld.model.StayMovementType.DEPARTURE
            where sc.cat.id in :catIds and s.id <> :stayId and s.cancelledAt is null
              and (s.movementStatus = com.allegaeon.catworld.model.StayStatus.CHECKED_IN
                or (s.movementStatus = com.allegaeon.catworld.model.StayStatus.CHECKED_OUT
                  and d.occurredAtUtc > :arrivalUtc))
            """)
    boolean hasOverlappingActualOccupancy(@Param("catIds") Collection<UUID> catIds,
                                          @Param("stayId") UUID stayId,
                                          @Param("arrivalUtc") LocalDateTime arrivalUtc);

    @Query("""
            select distinct sc.cat.id
            from StayCat sc
            where sc.cat.id in :candidateIds
            """)
    Set<UUID> findCatIdsWithStayHistory(@Param("candidateIds") Collection<UUID> candidateIds);

}
