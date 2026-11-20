package com.allegaeon.catworld.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Entity
@Table(name = "food_brands", uniqueConstraints = @UniqueConstraint(
        name = "uk_food_brands_key", columnNames = "normalized_key"))
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class FoodBrand {
    @Id
    private UUID id;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(nullable = false, length = 400)
    private byte[] normalizedKey;
}
