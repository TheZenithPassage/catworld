package com.allegaeon.catworld.repository;

import com.allegaeon.catworld.model.CatIntakeInvitation;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface CatIntakeInvitationRepository extends JpaRepository<CatIntakeInvitation, UUID> {
    boolean existsByTokenHashAndRevokedAtIsNullAndSubmittedAtIsNullAndExpiresAtAfter(String tokenHash, Instant now);

    @Query("""
            select i.owner.id as ownerId, i.allowNewCats as allowNewCats,
                   i.scopeSnapshot as scopeSnapshot, i.expiresAt as expiresAt
            from CatIntakeInvitation i
            where i.tokenHash = :tokenHash and i.revokedAt is null and i.submittedAt is null and i.expiresAt > :now
            """)
    Optional<OpenScope> findOpenScope(@Param("tokenHash") String tokenHash, @Param("now") Instant now);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            select i from CatIntakeInvitation i
            where i.owner.id = :ownerId and i.revokedAt is null and i.submittedAt is null
            """)
    List<CatIntakeInvitation> findOutstandingByOwnerForUpdate(@Param("ownerId") UUID ownerId);

    Optional<CatIntakeInvitation> findByOwner_IdAndRevokedAtIsNullAndSubmittedAtIsNullAndExpiresAtAfter(UUID ownerId,
                                                                                                      Instant now);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select i from CatIntakeInvitation i where i.tokenHash = :tokenHash")
    Optional<CatIntakeInvitation> findByTokenHashForUpdate(@Param("tokenHash") String tokenHash);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select i from CatIntakeInvitation i where i.id = :id")
    Optional<CatIntakeInvitation> findByIdForUpdate(@Param("id") UUID id);

    interface OpenScope {
        UUID getOwnerId();
        boolean getAllowNewCats();
        String getScopeSnapshot();
        Instant getExpiresAt();
    }
}
