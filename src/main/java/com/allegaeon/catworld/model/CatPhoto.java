package com.allegaeon.catworld.model;

import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(name = "cat_photos")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class CatPhoto {
    @Id
    @Column(name = "cat_id", columnDefinition = "BINARY(16)")
    private UUID catId;

    @Lob
    @Column(nullable = false, columnDefinition = "MEDIUMBLOB")
    private byte[] content;

    @Column(nullable = false)
    private int width;

    @Column(nullable = false)
    private int height;

    @Column(name = "byte_size", nullable = false)
    private int byteSize;

    @Column(nullable = false, length = 64)
    private String sha256;
}
