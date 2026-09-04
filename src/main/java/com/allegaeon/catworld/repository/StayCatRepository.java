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

import java.util.Collection;
import java.util.Set;
import java.util.UUID;
import java.util.List;

@Repository
public interface StayCatRepository extends JpaRepository<StayCat, StayCatId> {

    @Query("select sc from StayCat sc join fetch sc.cat where sc.stay.id in :stayIds order by sc.cat.name asc, sc.cat.id asc")
    List<StayCat> findOverviewCatsByStayIds(@Param("stayIds") Collection<UUID> stayIds);

    @Query("select sc.stay from StayCat sc where sc.cat.id = :catId order by sc.stay.startAt desc, sc.stay.id asc")
    Page<Stay> findStaysByCatId(@Param("catId") UUID catId, Pageable pageable);

    @Query("select sc.cat from StayCat sc where sc.stay.id = :stayId order by sc.cat.name asc, sc.cat.id asc")
    Page<Cat> findCatsByStayId(@Param("stayId") UUID stayId, Pageable pageable);

    boolean existsByCat_Id(UUID catId);

    @Query("""
            select distinct sc.cat.id
            from StayCat sc
            where sc.cat.id in :candidateIds
            """)
    Set<UUID> findCatIdsWithStayHistory(@Param("candidateIds") Collection<UUID> candidateIds);

}
