package com.allegaeon.catworld.repository;

import com.allegaeon.catworld.model.CatIntakePhoto;
import com.allegaeon.catworld.model.CatIntakeReview;
import com.allegaeon.catworld.model.CatPhotoFrame;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface CatIntakePhotoRepository extends JpaRepository<CatIntakePhoto, UUID> {
    @Query("select p.id from CatIntakePhoto p where p.review.id = :reviewId and p.portraitSha256 is null order by p.id")
    List<UUID> findIdsByReview(@Param("reviewId") UUID reviewId);

    @Query("select p.content from CatIntakePhoto p where p.review.id = :reviewId and p.id = :photoId")
    Optional<byte[]> findContent(@Param("reviewId") UUID reviewId, @Param("photoId") UUID photoId);

    @Query("""
            select p.review from CatIntakePhoto p
            where p.review.invitation.id = :inviteId and p.id = :photoId
              and p.review.approvedAt is null and p.review.dismissedAt is null
            """)
    Optional<CatIntakeReview> findPendingReview(@Param("inviteId") UUID inviteId, @Param("photoId") UUID photoId);

    interface Portrait {
        UUID getId();
        CatPhotoFrame getFrame();
    }

    @Query("select p.id as id, p.frame as frame from CatIntakePhoto p where p.review.id = :reviewId and p.portraitSha256 is not null")
    Optional<Portrait> findPortrait(@Param("reviewId") UUID reviewId);

    @Modifying
    @Query("delete from CatIntakePhoto p where p.review.id = :reviewId and p.portraitSha256 is not null")
    void deletePortrait(@Param("reviewId") UUID reviewId);

    @Modifying
    @Query("delete from CatIntakePhoto p where p.review.id = :reviewId and p.portraitSha256 is null")
    void deleteEvidence(@Param("reviewId") UUID reviewId);

    List<CatIntakePhoto> findByReview_IdAndIdIn(UUID reviewId, Collection<UUID> ids);

    @Modifying
    @Query("delete from CatIntakePhoto p where p.review.id = :reviewId")
    void deleteByReview(@Param("reviewId") UUID reviewId);

    @Modifying
    @Query("delete from CatIntakePhoto p where p.review.id = :reviewId and p.portraitSha256 is null and p.id not in :retainedIds")
    void deleteUnretained(@Param("reviewId") UUID reviewId, @Param("retainedIds") Collection<UUID> retainedIds);
}
