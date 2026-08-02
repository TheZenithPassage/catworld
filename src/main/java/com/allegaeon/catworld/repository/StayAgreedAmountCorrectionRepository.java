package com.allegaeon.catworld.repository;

import com.allegaeon.catworld.model.StayAgreedAmountCorrection;
import org.springframework.data.repository.Repository;

import java.util.List;
import java.util.UUID;

public interface StayAgreedAmountCorrectionRepository
        extends Repository<StayAgreedAmountCorrection, UUID> {

    <S extends StayAgreedAmountCorrection> S saveAndFlush(S correction);

    long count();

    List<StayAgreedAmountCorrection> findAllByStayId(UUID stayId);

    boolean existsByDecidedBy_Id(UUID decidedById);
}
