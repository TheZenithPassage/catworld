package com.allegaeon.catworld.repository;

import com.allegaeon.catworld.model.StayPayment;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Repository
@RequiredArgsConstructor
public class MonthlyPaymentsRepository {
    private static final String RECEIPT_SCOPE = """
            where payment.annulled = false
              and payment.paymentDate >= :start and payment.paymentDate < :end
            """;

    private final EntityManager entityManager;

    public List<StayPayment> findReceipts(LocalDate start, LocalDate end, int offset, int limit) {
        return entityManager.createQuery("""
                select payment from StayPayment payment
                join fetch payment.stay stay
                join fetch stay.owner
                """ + RECEIPT_SCOPE + "order by payment.paymentDate desc, payment.id asc", StayPayment.class)
                .setParameter("start", start).setParameter("end", end)
                .setFirstResult(offset).setMaxResults(limit).getResultList();
    }

    public ReceiptTotals summarizeReceipts(LocalDate start, LocalDate end) {
        Object[] result = entityManager.createQuery("""
                select count(payment), sum(payment.amount) from StayPayment payment
                """ + RECEIPT_SCOPE, Object[].class)
                .setParameter("start", start).setParameter("end", end).getSingleResult();
        return new ReceiptTotals((Long) result[0], result[1] == null ? BigDecimal.ZERO : (BigDecimal) result[1]);
    }

    public record ReceiptTotals(long count, BigDecimal amount) {}
}
