package com.allegaeon.catworld.repository;

import com.allegaeon.catworld.model.NightlyReferenceRateChange;
import org.springframework.data.repository.Repository;

import java.util.List;
import java.util.UUID;

public interface NightlyReferenceRateChangeRepository
        extends Repository<NightlyReferenceRateChange, UUID> {

    <S extends NightlyReferenceRateChange> S saveAndFlush(S change);

    long count();

    List<NightlyReferenceRateChange> findAll();

    boolean existsByChangedBy_Id(UUID changedById);
}
