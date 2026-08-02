package com.allegaeon.catworld.repository;

import com.allegaeon.catworld.model.StayPaymentEdit;
import org.springframework.data.repository.Repository;

import java.util.List;
import java.util.UUID;

public interface StayPaymentEditRepository
        extends Repository<StayPaymentEdit, UUID> {

    <S extends StayPaymentEdit> S saveAndFlush(S edit);

    List<StayPaymentEdit> findAllByStayIdOrderByEditedAtAsc(UUID stayId);

    List<StayPaymentEdit> findAllBySensitiveContextIsNotNull();

    boolean existsByEditedBy_Id(UUID editedById);

    boolean existsByRegisteredBy_Id(UUID registeredById);

    long count();
}
