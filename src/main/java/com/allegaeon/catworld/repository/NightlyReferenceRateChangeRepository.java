package com.allegaeon.catworld.repository;

import com.allegaeon.catworld.model.NightlyReferenceRateChange;
import org.springframework.data.repository.Repository;

import java.util.UUID;

public interface NightlyReferenceRateChangeRepository
        extends Repository<NightlyReferenceRateChange, UUID> {

    <S extends NightlyReferenceRateChange> S saveAndFlush(S change);

    long count();

    boolean existsByChangedBy_Id(UUID changedById);
}
