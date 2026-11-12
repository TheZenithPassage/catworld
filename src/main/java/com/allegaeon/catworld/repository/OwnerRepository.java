package com.allegaeon.catworld.repository;

import com.allegaeon.catworld.model.Owner;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

@Repository
public interface OwnerRepository extends JpaRepository<Owner, UUID> {

    @Query("select o from Owner o")
    Page<Owner> findOverview(Pageable pageable);

    @Query("select o from Owner o where lower(o.fullName) like lower(concat('%', :query, '%')) escape '!'")
    Page<Owner> searchOverview(@Param("query") String query, Pageable pageable);

    @Query(value = """
            select distinct o from Owner o left join o.cats c
            where lower(o.fullName) like lower(concat('%', :query, '%')) escape '!'
               or lower(c.name) like lower(concat('%', :query, '%')) escape '!'
            """, countQuery = """
            select count(distinct o.id) from Owner o left join o.cats c
            where lower(o.fullName) like lower(concat('%', :query, '%')) escape '!'
               or lower(c.name) like lower(concat('%', :query, '%')) escape '!'
            """)
    Page<Owner> search(@Param("query") String query, Pageable pageable);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select o from Owner o where o.id = :id")
    Optional<Owner> findByIdForUpdate(@Param("id") UUID id);

    boolean existsByCreatedBy_Id(UUID createdById);

    boolean existsByIdAndCatsIsNotEmpty(UUID id);

    @Query("""
            select distinct o.id
            from Owner o
            join o.cats c
            where o.id in :candidateIds
            """)
    Set<UUID> findOwnerIdsReferencedByCats(@Param("candidateIds") Collection<UUID> candidateIds);
}
