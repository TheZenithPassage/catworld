package com.allegaeon.catworld.repository;

import com.allegaeon.catworld.model.StayActualMovement;
import com.allegaeon.catworld.model.StayActualMovementId;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

public interface StayActualMovementRepository extends JpaRepository<StayActualMovement, StayActualMovementId> {

    List<StayActualMovement> findAllByIdStayId(UUID stayId);

    List<StayActualMovement> findAllByIdStayIdIn(Collection<UUID> stayIds);
}
