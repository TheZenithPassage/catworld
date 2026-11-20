package com.allegaeon.catworld.repository;

import com.allegaeon.catworld.model.LitterRate;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;

public interface LitterRateRepository extends JpaRepository<LitterRate, Long> {
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select rate from LitterRate rate where rate.id = 1")
    LitterRate findCurrentForUpdate();
}
