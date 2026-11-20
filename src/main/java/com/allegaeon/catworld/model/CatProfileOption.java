package com.allegaeon.catworld.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Getter
@NoArgsConstructor
@Entity
@Table(name = "cat_profile_options")
public class CatProfileOption {
    @Id
    private UUID id;

    @Column(nullable = false, length = 32)
    private String category;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(nullable = false, length = 400)
    private byte[] normalizedKey;
}
