package com.allegaeon.catworld.repository;

import com.allegaeon.catworld.model.StayCat;
import com.allegaeon.catworld.model.StayCatId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.Set;
import java.util.UUID;

@Repository
public interface StayCatRepository extends JpaRepository<StayCat, StayCatId> {

    boolean existsByCat_Id(UUID catId);

    @Query("""
            select distinct sc.cat.id
            from StayCat sc
            where sc.cat.id in :candidateIds
            """)
    Set<UUID> findCatIdsWithStayHistory(@Param("candidateIds") Collection<UUID> candidateIds);

}
