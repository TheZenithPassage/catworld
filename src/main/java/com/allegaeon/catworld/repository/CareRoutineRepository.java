package com.allegaeon.catworld.repository;

import com.allegaeon.catworld.model.CareRoutine;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface CareRoutineRepository extends JpaRepository<CareRoutine, UUID> {

    List<CareRoutine> findAllByOrderByNameAscIdAsc();

    List<CareRoutine> findAllByActiveTrueOrderByNameAscIdAsc();

    @Lock(LockModeType.PESSIMISTIC_READ)
    @Query("select r from CareRoutine r where r.id = :id")
    Optional<CareRoutine> findByIdForRead(UUID id);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select r from CareRoutine r where r.id = :id")
    Optional<CareRoutine> findByIdForUpdate(UUID id);
}
