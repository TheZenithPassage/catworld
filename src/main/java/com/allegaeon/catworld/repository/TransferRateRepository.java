package com.allegaeon.catworld.repository;
import com.allegaeon.catworld.model.TransferRate;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.Repository;
import java.util.Optional;
public interface TransferRateRepository extends Repository<TransferRate, Long> {
 Optional<TransferRate> findById(Long id);
 <S extends TransferRate> S saveAndFlush(S rate);
 @Lock(LockModeType.PESSIMISTIC_WRITE) @Query("select rate from TransferRate rate where rate.id = 1") Optional<TransferRate> findCurrentForUpdate();
}
