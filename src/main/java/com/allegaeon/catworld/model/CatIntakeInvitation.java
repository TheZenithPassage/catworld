package com.allegaeon.catworld.model;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "cat_intake_invitations")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class CatIntakeInvitation {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "owner_id", nullable = false, updatable = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    private Owner owner;

    @Column(columnDefinition = "CHAR(64)", nullable = false, unique = true, updatable = false)
    private String tokenHash;

    @Column(nullable = false, updatable = false)
    private boolean allowNewCats;

    @Column(columnDefinition = "MEDIUMTEXT", nullable = false)
    private String scopeSnapshot;

    @Column(nullable = false, updatable = false)
    private Instant expiresAt;
    private Instant revokedAt;
    private Instant submittedAt;

    public CatIntakeInvitation(Owner owner, String tokenHash, boolean allowNewCats, String scopeSnapshot,
                               Instant expiresAt) {
        this.owner = owner;
        this.tokenHash = tokenHash;
        this.allowNewCats = allowNewCats;
        this.scopeSnapshot = scopeSnapshot;
        this.expiresAt = expiresAt;
    }

    public boolean isOpenAt(Instant now) {
        return revokedAt == null && submittedAt == null && expiresAt.isAfter(now);
    }

    public void revoke(Instant now) {
        revokedAt = now;
        scopeSnapshot = "{}";
    }

    public void consume(Instant now) {
        submittedAt = now;
        scopeSnapshot = "{}";
    }
}
