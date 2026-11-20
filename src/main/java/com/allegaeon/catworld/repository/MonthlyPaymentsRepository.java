package com.allegaeon.catworld.repository;

import com.allegaeon.catworld.model.Stay;
import com.allegaeon.catworld.model.StayPayment;
import jakarta.persistence.EntityManager;
import jakarta.persistence.TypedQuery;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.YearMonth;
import java.util.List;
import java.util.UUID;

@Repository
@RequiredArgsConstructor
public class MonthlyPaymentsRepository {
    private static final String RECEIPT_SCOPE = """
            where payment.annulled = false
            """;

    private final EntityManager entityManager;

    public List<StayPayment> findReceipts(YearMonth month, UUID ownerId, UUID catId, int offset, int limit) {
        var query = entityManager.createQuery("""
                select payment from StayPayment payment
                join fetch payment.stay stay
                join fetch stay.owner
                """ + receiptScope(month, ownerId, catId) + "order by payment.paymentDate desc, payment.id asc",
                StayPayment.class);
        bindReceiptScope(query, month, ownerId, catId);
        return query.setFirstResult(offset).setMaxResults(limit).getResultList();
    }

    public ReceiptTotals summarizeReceipts(YearMonth month, UUID ownerId, UUID catId) {
        var query = entityManager.createQuery("""
                select count(payment), sum(payment.amount) from StayPayment payment
                join payment.stay stay
                """ + receiptScope(month, ownerId, catId), Object[].class);
        bindReceiptScope(query, month, ownerId, catId);
        Object[] result = query.getSingleResult();
        return new ReceiptTotals((Long) result[0], result[1] == null ? BigDecimal.ZERO : (BigDecimal) result[1]);
    }


    public List<CollectionBalance> findCollectionBalances(YearMonth month, UUID ownerId, UUID catId) {
        String arrivalFilter = month == null ? "" : " and stay.startAt >= :start and stay.startAt < :end ";
        var query = entityManager.createQuery("""
                select stay.id, stay.agreedAmount, coalesce(sum(payment.amount), 0)
                from Stay stay
                left join StayPayment payment on payment.stay = stay and payment.annulled = false
                where stay.cancelledAt is null and (stay.pricePending = true or stay.agreedAmount is not null)
                """ + arrivalFilter + entityScope(ownerId, catId) + """
                group by stay.id, stay.startAt, stay.agreedAmount, stay.pricePending
                having stay.pricePending = true or stay.agreedAmount > coalesce(sum(payment.amount), 0)
                order by stay.startAt asc, stay.id asc
                """, Object[].class);
        if (month != null) {
            query.setParameter("start", month.atDay(1).atStartOfDay())
                    .setParameter("end", month.plusMonths(1).atDay(1).atStartOfDay());
        }
        bindEntityScope(query, ownerId, catId);
        return query.getResultList().stream()
                .map(row -> new CollectionBalance((UUID) row[0], (BigDecimal) row[1], (BigDecimal) row[2]))
                .toList();
    }

    public List<Stay> findCollectionStays(List<UUID> stayIds) {
        return entityManager.createQuery("""
                select stay from Stay stay join fetch stay.owner where stay.id in :ids
                """, Stay.class)
                .setParameter("ids", stayIds).getResultList();
    }

    private String receiptScope(YearMonth month, UUID ownerId, UUID catId) {
        String paymentDateFilter = month == null ? "" : " and payment.paymentDate >= :start and payment.paymentDate < :end ";
        return RECEIPT_SCOPE + paymentDateFilter + entityScope(ownerId, catId);
    }

    private String entityScope(UUID ownerId, UUID catId) {
        if (ownerId != null) {
            return " and stay.owner.id = :ownerId ";
        }
        if (catId != null) {
            return """
                     and exists (select 1 from StayCat relation
                         where relation.stay = stay and relation.cat.id = :catId)
                    """;
        }
        return "";
    }

    private void bindReceiptScope(TypedQuery<?> query, YearMonth month, UUID ownerId, UUID catId) {
        if (month != null) {
            query.setParameter("start", month.atDay(1))
                    .setParameter("end", month.plusMonths(1).atDay(1));
        }
        bindEntityScope(query, ownerId, catId);
    }

    private void bindEntityScope(TypedQuery<?> query, UUID ownerId, UUID catId) {
        if (ownerId != null) {
            query.setParameter("ownerId", ownerId);
        } else if (catId != null) {
            query.setParameter("catId", catId);
        }
    }

    public record CollectionBalance(UUID stayId, BigDecimal agreed, BigDecimal paid) {
        public BigDecimal remaining() {
            return agreed == null ? null : agreed.subtract(paid);
        }
    }

    public record ReceiptTotals(long count, BigDecimal amount) {}
}
