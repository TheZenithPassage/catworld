package com.allegaeon.catworld.model;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

import java.util.UUID;

@Entity
@Table(name = "cat_intake_photos")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class CatIntakePhoto {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "review_id", nullable = false, updatable = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    private CatIntakeReview review;

    @Lob
    @Column(columnDefinition = "MEDIUMBLOB", nullable = false, updatable = false)
    private byte[] content;

    public CatIntakePhoto(CatIntakeReview review, byte[] content) {
        this.review = review;
        this.content = content;
    }
}
