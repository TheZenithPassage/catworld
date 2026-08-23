package com.allegaeon.catworld.repository;

import com.allegaeon.catworld.model.Cat;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface CatRepository extends JpaRepository<Cat, UUID> {

    Page<Cat> findByOwner_Id(UUID ownerId, Pageable pageable);

    Page<Cat> findByVet_Id(UUID vetId, Pageable pageable);

    boolean existsByCreatedBy_Id(UUID createdById);
}
