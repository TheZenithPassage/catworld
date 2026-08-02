package com.allegaeon.catworld.repository;

import com.allegaeon.catworld.model.StayPayment;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.Repository;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface StayPaymentRepository extends Repository<StayPayment, UUID> {

    <S extends StayPayment> S saveAndFlush(S payment);

    Optional<StayPayment> findByIdAndStay_Id(UUID paymentId, UUID stayId);

    List<StayPayment> findAllByStay_IdOrderByCreatedAtAscIdAsc(UUID stayId);

    List<StayPayment> findAllByStay_IdInOrderByCreatedAtAscIdAsc(
            Collection<UUID> stayIds);

    @Query("""
            select coalesce(sum(payment.amount), 0)
            from StayPayment payment
            where payment.stay.id = :stayId
              and payment.annulled = false
            """)
    BigDecimal sumActiveAmountByStayId(@Param("stayId") UUID stayId);

    boolean existsByStay_Id(UUID stayId);

    boolean existsByRegisteredBy_Id(UUID registeredById);

    void delete(StayPayment payment);

    void flush();

    long count();
}
