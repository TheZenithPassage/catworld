package com.allegaeon.catworld.repository;

import com.allegaeon.catworld.model.StayPricingDecision;
import org.springframework.data.repository.Repository;

import java.util.List;
import java.util.UUID;

public interface StayPricingDecisionRepository
        extends Repository<StayPricingDecision, UUID> {

    <S extends StayPricingDecision> S saveAndFlush(S decision);

    long count();

    List<StayPricingDecision> findAllByStayIdOrderByDecidedAtAsc(UUID stayId);

    List<StayPricingDecision> findAllBySensitiveContextIsNotNull();

    boolean existsByDecidedBy_Id(UUID decidedById);
}
