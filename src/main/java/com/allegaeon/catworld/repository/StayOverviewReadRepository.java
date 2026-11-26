package com.allegaeon.catworld.repository;

import com.allegaeon.catworld.dto.StayDateFilter;
import com.allegaeon.catworld.model.Stay;
import com.allegaeon.catworld.model.StayCat;
import com.allegaeon.catworld.model.StayStatus;
import jakarta.persistence.EntityManager;
import jakarta.persistence.criteria.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.stereotype.Repository;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Repository
@RequiredArgsConstructor
public class StayOverviewReadRepository {
    private final EntityManager entityManager;
    private final java.time.Clock clock;

    public Page<Stay> find(int page, int size, Set<StayStatus> statuses,
            UUID ownerId, UUID catId) {
        return find(page, size, statuses, ownerId, catId,
                new StayDateFilter(null, null, null));
    }

    public Page<Stay> find(int page, int size, Set<StayStatus> statuses,
            UUID ownerId, UUID catId, StayDateFilter dates) {
        CriteriaBuilder cb = entityManager.getCriteriaBuilder();
        CriteriaQuery<Stay> query = cb.createQuery(Stay.class);
        Root<Stay> stay = query.from(Stay.class);
        stay.fetch("owner", JoinType.INNER);
        List<Predicate> predicates = predicates(cb, query, stay, statuses, ownerId, catId, dates);
        query.select(stay).where(predicates.toArray(Predicate[]::new))
                .orderBy(cb.asc(stay.get("startAt")), cb.asc(stay.get("id")));

        List<Stay> items = entityManager.createQuery(query).setFirstResult(page * size)
                .setMaxResults(size).getResultList();

        CriteriaQuery<Long> countQuery = cb.createQuery(Long.class);
        Root<Stay> countStay = countQuery.from(Stay.class);
        List<Predicate> countPredicates = predicates(cb, countQuery, countStay, statuses,
                ownerId, catId, dates);
        countQuery.select(cb.count(countStay)).where(countPredicates.toArray(Predicate[]::new));
        return new PageImpl<>(items, org.springframework.data.domain.PageRequest.of(page, size),
                entityManager.createQuery(countQuery).getSingleResult());
    }

    public List<Stay> findCollection(StayDateFilter dates) {
        CriteriaBuilder cb = entityManager.getCriteriaBuilder();
        CriteriaQuery<Stay> query = cb.createQuery(Stay.class);
        Root<Stay> stay = query.from(Stay.class);
        query.select(stay).where(StayDatePredicates.matching(cb, stay, dates, clock.getZone()).toArray(Predicate[]::new))
                .orderBy(cb.asc(stay.get("startAt")), cb.asc(stay.get("id")));
        return entityManager.createQuery(query).getResultList();
    }

    private List<Predicate> predicates(CriteriaBuilder cb, CriteriaQuery<?> query, Root<Stay> stay,
            Set<StayStatus> statuses, UUID ownerId, UUID catId,
            StayDateFilter dates) {
        List<Predicate> result = new ArrayList<>(StayDatePredicates.matching(cb, stay, dates, clock.getZone()));
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
            var movementStatuses = statuses.stream().filter(status -> status != StayStatus.CANCELLED).toList();
            if (!movementStatuses.isEmpty()) {
                visible.add(cb.and(cb.isNull(stay.get("cancelledAt")), stay.get("movementStatus").in(movementStatuses)));
            }
            result.add(cb.or(visible.toArray(Predicate[]::new)));
        }

        return result;
    }
}
