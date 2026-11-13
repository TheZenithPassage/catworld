package com.allegaeon.catworld.repository;

import com.allegaeon.catworld.model.CareRecord;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDate;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface CareRecordRepository extends JpaRepository<CareRecord, UUID> {

    List<CareRecord> findByStay_IdOrderByBusinessDateAscRecordedAtAscIdAsc(UUID stayId);

    List<CareRecord> findByBusinessDateAndStay_IdInAndAnnulledAtIsNullOrderByRecordedAtAscIdAsc(
            LocalDate businessDate, Collection<UUID> stayIds);

    Optional<CareRecord> findByStay_IdAndCatIdAndBusinessDateAndRoutineIdAndActiveSlot(
            UUID stayId, UUID catId, LocalDate businessDate, UUID routineId, String activeSlot);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select r from CareRecord r where r.id = :id")
    Optional<CareRecord> findByIdForUpdate(UUID id);
}
