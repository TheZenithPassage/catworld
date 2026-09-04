package com.allegaeon.catworld.repository;

import com.allegaeon.catworld.dto.PaymentCondition;
import com.allegaeon.catworld.model.Stay;
import com.allegaeon.catworld.model.StayCat;
import com.allegaeon.catworld.model.StayPayment;
import com.allegaeon.catworld.model.StayStatus;
import jakarta.persistence.EntityManager;
import jakarta.persistence.criteria.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Repository
@RequiredArgsConstructor
public class StayOverviewReadRepository {
    private final EntityManager entityManager;

    public Page<Stay> find(int page, int size, LocalDateTime now, Set<StayStatus> statuses,
            UUID ownerId, UUID catId, Set<PaymentCondition> paymentConditions, Boolean outstandingOnly) {
        CriteriaBuilder cb = entityManager.getCriteriaBuilder();
        CriteriaQuery<Stay> query = cb.createQuery(Stay.class);
        Root<Stay> stay = query.from(Stay.class);
        stay.fetch("owner", JoinType.INNER);
        List<Predicate> predicates = predicates(cb, query, stay, now, statuses, ownerId, catId,
                paymentConditions, outstandingOnly);
        query.select(stay).where(predicates.toArray(Predicate[]::new))
                .orderBy(cb.asc(stay.get("startAt")), cb.asc(stay.get("id")));

        List<Stay> items = entityManager.createQuery(query).setFirstResult(page * size)
                .setMaxResults(size).getResultList();

        CriteriaQuery<Long> countQuery = cb.createQuery(Long.class);
        Root<Stay> countStay = countQuery.from(Stay.class);
        List<Predicate> countPredicates = predicates(cb, countQuery, countStay, now, statuses,
                ownerId, catId, paymentConditions, outstandingOnly);
        countQuery.select(cb.count(countStay)).where(countPredicates.toArray(Predicate[]::new));
        return new PageImpl<>(items, org.springframework.data.domain.PageRequest.of(page, size),
                entityManager.createQuery(countQuery).getSingleResult());
    }

    private List<Predicate> predicates(CriteriaBuilder cb, CriteriaQuery<?> query, Root<Stay> stay,
            LocalDateTime now, Set<StayStatus> statuses, UUID ownerId, UUID catId,
            Set<PaymentCondition> paymentConditions, Boolean outstandingOnly) {
        List<Predicate> result = new ArrayList<>();
        if (ownerId != null) result.add(cb.equal(stay.get("owner").get("id"), ownerId));
        if (catId != null) {
            Subquery<Integer> cats = query.subquery(Integer.class);
            Root<StayCat> sc = cats.from(StayCat.class);
            cats.select(cb.literal(1)).where(cb.equal(sc.get("stay").get("id"), stay.get("id")),
                    cb.equal(sc.get("cat").get("id"), catId));
            result.add(cb.exists(cats));
        }
        if (statuses != null && !statuses.isEmpty()) {
            List<Predicate> visible = new ArrayList<>();
            if (statuses.contains(StayStatus.CANCELLED)) visible.add(cb.isNotNull(stay.get("cancelledAt")));
            if (statuses.contains(StayStatus.RESERVED)) visible.add(cb.and(cb.isNull(stay.get("cancelledAt")), cb.greaterThan(stay.get("startAt"), now)));
            if (statuses.contains(StayStatus.CHECKED_IN)) visible.add(cb.and(cb.isNull(stay.get("cancelledAt")), cb.lessThanOrEqualTo(stay.get("startAt"), now), cb.greaterThan(stay.get("endAt"), now)));
            if (statuses.contains(StayStatus.CHECKED_OUT)) visible.add(cb.and(cb.isNull(stay.get("cancelledAt")), cb.lessThanOrEqualTo(stay.get("endAt"), now)));
            result.add(cb.or(visible.toArray(Predicate[]::new)));
        }

        Subquery<Long> activeCount = query.subquery(Long.class);
        Root<StayPayment> countPayment = activeCount.from(StayPayment.class);
        activeCount.select(cb.count(countPayment)).where(cb.equal(countPayment.get("stay").get("id"), stay.get("id")), cb.isFalse(countPayment.get("annulled")));
        Subquery<BigDecimal> activeSum = query.subquery(BigDecimal.class);
        Root<StayPayment> sumPayment = activeSum.from(StayPayment.class);
        activeSum.select(cb.coalesce(cb.sum(sumPayment.get("amount")), BigDecimal.ZERO)).where(cb.equal(sumPayment.get("stay").get("id"), stay.get("id")), cb.isFalse(sumPayment.get("annulled")));

        if (paymentConditions != null && !paymentConditions.isEmpty()) {
            List<Predicate> visible = new ArrayList<>();
            if (paymentConditions.contains(PaymentCondition.NO_PAYMENT)) visible.add(cb.equal(activeCount, 0L));
            if (paymentConditions.contains(PaymentCondition.PARTIAL_PAYMENT)) visible.add(cb.and(cb.greaterThan(activeCount, 0L), cb.greaterThan(stay.get("agreedAmount"), activeSum)));
            if (paymentConditions.contains(PaymentCondition.FULL_PAYMENT)) visible.add(cb.and(cb.greaterThan(activeCount, 0L), cb.equal(stay.get("agreedAmount"), activeSum)));
            result.add(cb.or(visible.toArray(Predicate[]::new)));
        }
        if (Boolean.TRUE.equals(outstandingOnly)) {
            result.add(cb.and(cb.isNull(stay.get("cancelledAt")), cb.isNotNull(stay.get("agreedAmount")), cb.greaterThan(stay.get("agreedAmount"), activeSum)));
        }
        return result;
    }
}
