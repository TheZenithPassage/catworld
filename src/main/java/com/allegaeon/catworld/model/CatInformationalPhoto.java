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
@Table(name = "cat_informational_photos")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class CatInformationalPhoto {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "cat_id", nullable = false, updatable = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    private Cat cat;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @Lob
    @Column(nullable = false, updatable = false, columnDefinition = "MEDIUMBLOB")
    private byte[] content;

    public CatInformationalPhoto(Cat cat, Instant createdAt, byte[] content) {
        this.cat = cat;
        this.createdAt = createdAt;
        this.content = content;
    }
}
