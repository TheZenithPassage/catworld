package com.allegaeon.catworld.repository;

import com.allegaeon.catworld.model.NightlyReferenceRate;
import com.allegaeon.catworld.model.NightlyReferenceRateCategory;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.Repository;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface NightlyReferenceRateRepository
        extends Repository<NightlyReferenceRate, NightlyReferenceRateCategory> {

    List<NightlyReferenceRate> findAll();

    Optional<NightlyReferenceRate> findById(NightlyReferenceRateCategory category);

    <S extends NightlyReferenceRate> S saveAndFlush(S rate);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select rate from NightlyReferenceRate rate where rate.category = :category")
    Optional<NightlyReferenceRate> findByCategoryForUpdate(
            @Param("category") NightlyReferenceRateCategory category);
}
