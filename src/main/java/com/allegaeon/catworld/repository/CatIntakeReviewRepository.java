package com.allegaeon.catworld.repository;

import com.allegaeon.catworld.model.CatIntakeReview;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface CatIntakeReviewRepository extends JpaRepository<CatIntakeReview, UUID> {
    @Query("""
            select r.id as id, o.id as ownerId, o.fullName as ownerName, r.catId as catId,
                   r.catName as catName, r.submittedAt as submittedAt
            from CatIntakeReview r join r.invitation i join i.owner o
            where r.approvedAt is null
              and (r.catId is null or exists (
                  select 1 from Cat c where c.id = r.catId and c.owner.id = o.id
              ))
            order by o.fullName, o.id, r.submittedAt, r.id
            """)
    List<PendingRow> findPendingRows();

    interface PendingRow {
        UUID getId();
        UUID getOwnerId();
        String getOwnerName();
        UUID getCatId();
        String getCatName();
        Instant getSubmittedAt();
    }

    @Query("""
            select r.id as id, r.catId as catId, r.submittedAt as submittedAt
            from CatIntakeReview r
            where r.approvedAt is null and r.catId in :catIds
              and exists (
                  select 1 from Cat c where c.id = r.catId and c.owner.id = r.invitation.owner.id
              )
            order by r.submittedAt, r.id
            """)
    List<PendingCatReview> findPendingForCats(@Param("catIds") Collection<UUID> catIds);

    interface PendingCatReview {
        UUID getId();
        UUID getCatId();
        Instant getSubmittedAt();
    }

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select r from CatIntakeReview r where r.id = :id")
    Optional<CatIntakeReview> findByIdForUpdate(@Param("id") UUID id);
}
