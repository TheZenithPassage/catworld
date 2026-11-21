package com.allegaeon.catworld.repository;

import com.allegaeon.catworld.dto.CatInformationalPhotoSummary;
import com.allegaeon.catworld.model.CatInformationalPhoto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface CatInformationalPhotoRepository extends JpaRepository<CatInformationalPhoto, UUID> {
    @Query("""
            select new com.allegaeon.catworld.dto.CatInformationalPhotoSummary(photo.id, photo.createdAt)
            from CatInformationalPhoto photo
            where photo.cat.id = :catId
            order by photo.createdAt desc, photo.id desc
            """)
    List<CatInformationalPhotoSummary> findGallery(UUID catId);

    @Query("select photo.content from CatInformationalPhoto photo where photo.cat.id = :catId and photo.id = :photoId")
    Optional<byte[]> findContent(UUID catId, UUID photoId);

    @Modifying
    @Transactional
    @Query("delete from CatInformationalPhoto photo where photo.cat.id = :catId and photo.id = :photoId")
    int deletePhoto(UUID catId, UUID photoId);
}
