package com.allegaeon.catworld.repository;

import com.allegaeon.catworld.model.Cat;
import com.allegaeon.catworld.model.OperationsTask;
import com.allegaeon.catworld.model.Owner;
import com.allegaeon.catworld.model.Stay;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Slice;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.Repository;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.UUID;

public interface OperationsTaskLinkRepository extends Repository<OperationsTask, UUID> {
    @Query("""
            select o as owner, case
                when lower(o.fullName) = lower(:name) then 0
                when lower(o.fullName) like lower(:pattern) escape '!' then 1
                else 2
            end as nameRank
            from Owner o
            where lower(o.fullName) like lower(:pattern) escape '!'
               or exists (select 1 from Cat c where c.owner = o and lower(c.name) like lower(:pattern) escape '!')
            order by nameRank, o.fullName, o.id
            """)
    Slice<OwnerMatch> searchOwners(@Param("name") String name, @Param("pattern") String pattern, Pageable page);

    @Query("""
            select c as cat, case
                when lower(c.name) = lower(:name) then 0
                when lower(c.name) like lower(:pattern) escape '!' then 1
                else 2
            end as nameRank
            from Cat c join fetch c.owner o
            where lower(c.name) like lower(:pattern) escape '!'
               or lower(o.fullName) like lower(:pattern) escape '!'
            order by nameRank, c.name, o.fullName, c.id
            """)
    Slice<CatMatch> searchCats(@Param("name") String name, @Param("pattern") String pattern, Pageable page);

    @Query("""
            select s from Stay s join fetch s.owner o
            where lower(o.fullName) like lower(:pattern) escape '!'
               or exists (select 1 from StayCat sc where sc.stay = s and lower(sc.cat.name) like lower(:pattern) escape '!')
            order by
                case when s.cancelledAt is not null or s.movementStatus = CHECKED_OUT then 3
                     when s.movementStatus = CHECKED_IN then 0
                     when s.startAt >= :todayStart then 1 else 2 end,
                case when s.cancelledAt is null and s.movementStatus = CHECKED_IN then s.endAt
                     when s.cancelledAt is null and s.movementStatus = RESERVED and s.startAt >= :todayStart
                     then s.startAt end,
                case when s.cancelledAt is null and s.movementStatus = RESERVED and s.startAt < :todayStart
                     then s.startAt end desc,
                coalesce(s.cancelledAt, s.endAt) desc,
                s.id
            """)
    Slice<Stay> searchStays(@Param("pattern") String pattern, @Param("todayStart") LocalDateTime todayStart, Pageable page);

    interface OwnerMatch {
        Owner getOwner();
        int getNameRank();
    }

    interface CatMatch {
        Cat getCat();
        int getNameRank();
    }
}
