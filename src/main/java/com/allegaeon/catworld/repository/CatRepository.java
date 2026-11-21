package com.allegaeon.catworld.repository;

import com.allegaeon.catworld.model.Cat;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CatRepository extends JpaRepository<Cat, UUID> {
    // A catalog deletion may commit in the same clock tick as the editor's original read.
    String ADVANCE_UPDATED_AT = "greatest(current_timestamp(6), timestampadd(microsecond, 1, updated_at))";

    @Modifying
    @Query(value = "update cats set breed = :name, breed_option_id = null, updated_at = " + ADVANCE_UPDATED_AT
            + " where breed_option_id = :id", nativeQuery = true)
    void freezeBreed(byte[] id, String name);

    @Modifying
    @Query(value = "update cats set last_internal_dewormer_name = :name, last_internal_dewormer_option_id = null,"
            + " updated_at = " + ADVANCE_UPDATED_AT + " where last_internal_dewormer_option_id = :id", nativeQuery = true)
    void freezeInternalDewormer(byte[] id, String name);

    @Modifying
    @Query(value = "update cats set last_external_dewormer_name = :name, last_external_dewormer_option_id = null,"
            + " updated_at = " + ADVANCE_UPDATED_AT + " where last_external_dewormer_option_id = :id", nativeQuery = true)
    void freezeExternalDewormer(byte[] id, String name);

    @Modifying
    @Query(value = "update cats set litter_detail = :name, litter_detail_option_id = null, updated_at = "
            + ADVANCE_UPDATED_AT + " where litter_detail_option_id = :id", nativeQuery = true)
    void freezeLitterDetail(byte[] id, String name);

    @Modifying
    @Query(value = "update cats set food_detail = :name, food_variety_id = null, updated_at = " + ADVANCE_UPDATED_AT
            + " where food_variety_id = :id", nativeQuery = true)
    void freezeFoodVariety(byte[] id, String name);

    @Modifying
    @Query(value = """
            update cats set
                food_detail = case when food_variety_id is null then food_detail
                    else (select v.name from food_varieties v where v.id = cats.food_variety_id) end,
                food_variety_id = null, food_brand = :name, food_brand_id = null,
                updated_at =
            """ + ADVANCE_UPDATED_AT + " where food_brand_id = :id", nativeQuery = true)
    void freezeFoodBrand(byte[] id, String name);

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

    List<Cat> findByOwner_IdAndDeceasedFalseOrderByNameAscIdAsc(UUID ownerId);

    Page<Cat> findByVet_Id(UUID vetId, Pageable pageable);

    List<Cat> findByOwner_IdAndIdInAndDeceasedFalse(UUID ownerId, Collection<UUID> ids);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select c from Cat c where c.id = :id")
    Optional<Cat> findByIdForUpdate(@Param("id") UUID id);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select c from Cat c where c.id in :ids and c.owner.id = :ownerId and c.deceased = false order by c.id")
    List<Cat> findScopedForUpdate(@Param("ids") Collection<UUID> ids, @Param("ownerId") UUID ownerId);

    boolean existsByCreatedBy_Id(UUID createdById);
}
