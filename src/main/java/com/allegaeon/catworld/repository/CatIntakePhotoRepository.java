package com.allegaeon.catworld.repository;

import com.allegaeon.catworld.model.CatIntakePhoto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface CatIntakePhotoRepository extends JpaRepository<CatIntakePhoto, UUID> {
    @Query("select p.id from CatIntakePhoto p where p.review.id = :reviewId order by p.id")
    List<UUID> findIdsByReview(@Param("reviewId") UUID reviewId);

    @Query("select p.content from CatIntakePhoto p where p.review.id = :reviewId and p.id = :photoId")
    Optional<byte[]> findContent(@Param("reviewId") UUID reviewId, @Param("photoId") UUID photoId);

    List<CatIntakePhoto> findByReview_IdAndIdIn(UUID reviewId, Collection<UUID> ids);

    @Modifying
    @Query("delete from CatIntakePhoto p where p.review.id = :reviewId")
    void deleteByReview(@Param("reviewId") UUID reviewId);
}
