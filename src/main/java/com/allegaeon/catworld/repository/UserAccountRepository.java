package com.allegaeon.catworld.repository;

import com.allegaeon.catworld.model.UserAccount;
import com.allegaeon.catworld.model.UserRole;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserAccountRepository extends JpaRepository<UserAccount, UUID> {

    Optional<UserAccount> findByUsername(String username);

    boolean existsByUsername(String username);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select account from UserAccount account where account.role = :role and account.enabled = true")
    List<UserAccount> findEnabledByRoleForUpdate(@Param("role") UserRole role);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("""
            update UserAccount account
            set account.role = :role, account.updatedAt = :updatedAt
            where account.id = :id
            """)
    void updateRole(
            @Param("id") UUID id,
            @Param("role") UserRole role,
            @Param("updatedAt") Instant updatedAt);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("""
            update UserAccount account
            set account.enabled = :enabled, account.updatedAt = :updatedAt
            where account.id = :id
            """)
    void updateEnabled(
            @Param("id") UUID id,
            @Param("enabled") boolean enabled,
            @Param("updatedAt") Instant updatedAt);
}
