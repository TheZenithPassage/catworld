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
@Table(name = "cat_intake_reviews")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class CatIntakeReview {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "invitation_id", nullable = false, updatable = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    private CatIntakeInvitation invitation;

    // An intake proposal must never prevent an existing cat from being deleted.
    private UUID catId;

    @Column(length = 100, nullable = false, updatable = false)
    private String catName;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String originalFields;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String proposedFields;

    @Column(nullable = false, updatable = false)
    private Instant submittedAt;

    private Instant approvedAt;

    public CatIntakeReview(CatIntakeInvitation invitation, UUID catId, String catName, String originalFields,
                           String proposedFields, Instant submittedAt) {
        this.invitation = invitation;
        this.catId = catId;
        this.catName = catName;
        this.originalFields = originalFields;
        this.proposedFields = proposedFields;
        this.submittedAt = submittedAt;
    }

    public void approve(UUID approvedCatId, Instant now) {
        catId = approvedCatId;
        approvedAt = now;
        originalFields = "{}";
        proposedFields = "{}";
    }
}
