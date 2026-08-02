package com.allegaeon.catworld.repository;

import com.allegaeon.catworld.model.StayPaymentRemoval;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.Repository;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Set;
import java.util.UUID;

public interface StayPaymentRemovalRepository
        extends Repository<StayPaymentRemoval, UUID> {

    <S extends StayPaymentRemoval> S saveAndFlush(S removal);

    List<StayPaymentRemoval> findAll();

    boolean existsByStayId(UUID stayId);

    boolean existsByRegisteredBy_Id(UUID registeredById);

    boolean existsByRemovedBy_Id(UUID removedById);

    @Query("""
            select distinct removal.stayId
            from StayPaymentRemoval removal
            where removal.stayId in :stayIds
            """)
    Set<UUID> findStayIdsWithRemovalHistory(
            @Param("stayIds") Collection<UUID> stayIds);

    long count();
}

