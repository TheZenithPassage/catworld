package com.allegaeon.catworld.repository;

import com.allegaeon.catworld.model.StayPaymentAnnulment;
import org.springframework.data.repository.Repository;

import java.util.List;
import java.util.UUID;

public interface StayPaymentAnnulmentRepository
        extends Repository<StayPaymentAnnulment, UUID> {

    <S extends StayPaymentAnnulment> S saveAndFlush(S annulment);

    List<StayPaymentAnnulment> findAllByStayIdOrderByAnnulledAtAsc(UUID stayId);

    long count();
}
