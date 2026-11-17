package com.allegaeon.catworld.repository;

import com.allegaeon.catworld.dto.GalleryPublicationSummary;
import com.allegaeon.catworld.dto.PublicGalleryEntry;
import com.allegaeon.catworld.model.GalleryPublication;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface GalleryPublicationRepository extends JpaRepository<GalleryPublication, UUID> {

    @Query("""
            select new com.allegaeon.catworld.dto.GalleryPublicationSummary(
                p.id, p.name, p.description, p.kind, p.publishedAt, p.version)
            from GalleryPublication p
            order by p.updatedAt desc, p.id
            """)
    List<GalleryPublicationSummary> findSummaries();

    @Query("""
            select new com.allegaeon.catworld.dto.PublicGalleryEntry(
                p.id, p.name, p.description, p.kind, p.width, p.height)
            from GalleryPublication p
            where p.publishedAt is not null
            order by p.publishedAt desc, p.id
            """)
    List<PublicGalleryEntry> findPublishedEntries();

    @Query("select p from GalleryPublication p where p.id = :id and p.publishedAt is not null")
    Optional<GalleryPublication> findPublishedById(UUID id);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select p from GalleryPublication p where p.id = :id")
    Optional<GalleryPublication> findForUpdate(UUID id);
}
