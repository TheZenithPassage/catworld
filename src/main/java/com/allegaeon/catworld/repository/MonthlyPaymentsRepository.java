package com.allegaeon.catworld.repository;

import com.allegaeon.catworld.model.Stay;
import com.allegaeon.catworld.model.StayPayment;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

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


    public List<CollectionBalance> findCollectionBalances(LocalDate start, LocalDate end) {
        return entityManager.createQuery("""
                select stay.id, stay.agreedAmount, coalesce(sum(payment.amount), 0)
                from Stay stay
                left join StayPayment payment on payment.stay = stay and payment.annulled = false
                where stay.cancelledAt is null and (stay.pricePending = true or stay.agreedAmount is not null)
                  and stay.startAt >= :start and stay.startAt < :end
                group by stay.id, stay.startAt, stay.agreedAmount, stay.pricePending
                having stay.pricePending = true or stay.agreedAmount > coalesce(sum(payment.amount), 0)
                order by stay.startAt asc, stay.id asc
                """, Object[].class)
                .setParameter("start", start.atStartOfDay()).setParameter("end", end.atStartOfDay())
                .getResultList().stream()
                .map(row -> new CollectionBalance((UUID) row[0], (BigDecimal) row[1], (BigDecimal) row[2]))
                .toList();
    }

    public List<Stay> findCollectionStays(List<UUID> stayIds) {
        return entityManager.createQuery("""
                select stay from Stay stay join fetch stay.owner where stay.id in :ids
                """, Stay.class)
                .setParameter("ids", stayIds).getResultList();
    }

    public record CollectionBalance(UUID stayId, BigDecimal agreed, BigDecimal paid) {
        public BigDecimal remaining() {
            return agreed == null ? null : agreed.subtract(paid);
        }
    }

    public record ReceiptTotals(long count, BigDecimal amount) {}
}
