package com.allegaeon.catworld.repository;

import com.allegaeon.catworld.model.CatPhoto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.Collection;
import java.util.Set;
import java.util.UUID;

public interface CatPhotoRepository extends JpaRepository<CatPhoto, UUID> {
    @Query("select p.catId from CatPhoto p where p.catId in :catIds")
    Set<UUID> findPresentCatIds(Collection<UUID> catIds);
}
