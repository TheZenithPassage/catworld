package com.allegaeon.catworld.repository;

import com.allegaeon.catworld.model.Cat;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.UUID;

@Repository
public interface CatRepository extends JpaRepository<Cat, UUID> {

    @Query(value = "select c from Cat c join fetch c.owner", countQuery = "select count(c) from Cat c")
    Page<Cat> findOverview(Pageable pageable);

    @Query(value = "select c from Cat c join fetch c.owner where lower(c.name) like lower(concat('%', :query, '%')) escape '!' or lower(c.owner.fullName) like lower(concat('%', :query, '%')) escape '!'",
            countQuery = "select count(c) from Cat c where lower(c.name) like lower(concat('%', :query, '%')) escape '!' or lower(c.owner.fullName) like lower(concat('%', :query, '%')) escape '!'")
    Page<Cat> searchOverview(@Param("query") String query, Pageable pageable);

    @Query(value = "select c from Cat c join fetch c.owner where lower(c.name) like lower(concat('%', :query, '%')) escape '!'",
            countQuery = "select count(c) from Cat c where lower(c.name) like lower(concat('%', :query, '%')) escape '!'")
    Page<Cat> search(@Param("query") String query, Pageable pageable);

    @Query("select c from Cat c where c.owner.id in :ownerIds order by c.name asc, c.id asc")
    java.util.List<Cat> findLookupCatsByOwnerIds(@Param("ownerIds") java.util.Collection<UUID> ownerIds);

    Page<Cat> findByOwner_Id(UUID ownerId, Pageable pageable);

    Page<Cat> findByVet_Id(UUID vetId, Pageable pageable);

    boolean existsByCreatedBy_Id(UUID createdById);
}
