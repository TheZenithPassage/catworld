package com.allegaeon.catworld.repository;

import com.allegaeon.catworld.model.StayCat;
import com.allegaeon.catworld.model.StayCatId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface StayCatRepository extends JpaRepository<StayCat, StayCatId> {

    boolean existsByCat_Id(UUID catId);

}
