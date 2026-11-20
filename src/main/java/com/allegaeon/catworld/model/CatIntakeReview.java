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
@Table(name = "cat_intake_reviews", uniqueConstraints = {
        @UniqueConstraint(name = "uk_cat_intake_review_cat", columnNames = {"invitation_id", "cat_id"}),
        @UniqueConstraint(name = "uk_cat_intake_review_draft", columnNames = {"invitation_id", "draft_id"})
})
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

    @Column(updatable = false)
    private UUID draftId;

    @Column(nullable = false)
    private long revision;

    @Column(length = 100, nullable = false)
    private String catName;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String originalFields;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String proposedFields;

    @Column(nullable = false)
    private Instant submittedAt;

    private Instant approvedAt;

    private Instant dismissedAt;

    public CatIntakeReview(CatIntakeInvitation invitation, UUID catId, UUID draftId, String catName, String originalFields,
                           String proposedFields, Instant submittedAt) {
        this.invitation = invitation;
        this.catId = catId;
        this.draftId = draftId;
        replaceProposal(catName, originalFields, proposedFields, submittedAt);
    }

    public CatIntakeReview(CatIntakeInvitation invitation, UUID catId, String catName, String originalFields,
                           String proposedFields, Instant submittedAt) {
        this(invitation, catId, null, catName, originalFields, proposedFields, submittedAt);
    }

    public void replaceProposal(String catName, String originalFields, String proposedFields, Instant submittedAt) {
        this.catName = catName;
        this.originalFields = originalFields;
        this.proposedFields = proposedFields;
        this.submittedAt = submittedAt;
        revision++;
    }

    public void approve(UUID approvedCatId, Instant now) {
        catId = approvedCatId;
        approvedAt = now;
        clearProposal();
    }

    public boolean isPending() {
        return approvedAt == null && dismissedAt == null;
    }

    public void dismiss(Instant now) {
        dismissedAt = now;
        clearProposal();
    }

    private void clearProposal() {
        originalFields = "{}";
        proposedFields = "{}";
    }
}
