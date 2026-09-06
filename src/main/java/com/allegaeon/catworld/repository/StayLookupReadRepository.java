package com.allegaeon.catworld.repository;

import com.allegaeon.catworld.model.Stay;
import com.allegaeon.catworld.model.StayCat;
import jakarta.persistence.EntityManager;
import jakarta.persistence.criteria.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Repository;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Repository
@RequiredArgsConstructor
public class StayLookupReadRepository {
    private final EntityManager entityManager;

    public Page<Stay> find(UUID ownerId, UUID catId, LocalDate from, LocalDate to, int page) {
        var cb = entityManager.getCriteriaBuilder();
        var query = cb.createQuery(Stay.class);
        var stay = query.from(Stay.class);
        stay.fetch("owner");
        query.select(stay).where(predicates(cb, query, stay, ownerId, catId, from, to))
                .orderBy(cb.asc(stay.get("startAt")), cb.asc(stay.get("id")));
        var items = entityManager.createQuery(query).setFirstResult(page * 5).setMaxResults(5).getResultList();
        var count = cb.createQuery(Long.class);
        var countStay = count.from(Stay.class);
        count.select(cb.count(countStay)).where(predicates(cb, count, countStay, ownerId, catId, from, to));
        return new PageImpl<>(items, PageRequest.of(page, 5), entityManager.createQuery(count).getSingleResult());
    }

    private Predicate[] predicates(CriteriaBuilder cb, CriteriaQuery<?> query, Root<Stay> stay,
            UUID ownerId, UUID catId, LocalDate from, LocalDate to) {
        List<Predicate> result = new ArrayList<>();
        if (ownerId != null) result.add(cb.equal(stay.get("owner").get("id"), ownerId));
        if (catId != null) {
            var cats = query.subquery(Integer.class);
            var link = cats.from(StayCat.class);
            cats.select(cb.literal(1)).where(cb.equal(link.get("stay"), stay),
                    cb.equal(link.get("cat").get("id"), catId));
            result.add(cb.exists(cats));
        }
        if (from != null) result.add(cb.greaterThanOrEqualTo(((org.hibernate.query.criteria.JpaExpression<?>) stay.get("endAt")).cast(LocalDate.class), from));
        if (to != null) result.add(cb.lessThanOrEqualTo(((org.hibernate.query.criteria.JpaExpression<?>) stay.get("startAt")).cast(LocalDate.class), to));
        return result.toArray(Predicate[]::new);
    }
}
