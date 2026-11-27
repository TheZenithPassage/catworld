package com.allegaeon.catworld.repository;

import com.allegaeon.catworld.model.OperationsTaskTransition;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface OperationsTaskTransitionRepository extends JpaRepository<OperationsTaskTransition, UUID> {

    Optional<OperationsTaskTransition> findFirstByTask_IdOrderByRevisionDesc(UUID taskId);
}
