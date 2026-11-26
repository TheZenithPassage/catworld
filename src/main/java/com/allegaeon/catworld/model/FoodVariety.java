package com.allegaeon.catworld.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import org.hibernate.annotations.ColumnDefault;

import java.util.UUID;

@Entity
@Table(name = "food_varieties", uniqueConstraints = @UniqueConstraint(
        name = "uk_food_variety_name", columnNames = {"brand_id", "normalized_key"}))
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class FoodVariety {
    @Id
    private UUID id;

    @Column(nullable = false)
    private UUID brandId;

    @Column(nullable = false, length = 255)
    private String name;

    @Column(nullable = false, length = 1020)
    private byte[] normalizedKey;

    @ColumnDefault("true")
    @Column(nullable = false)
    private boolean active = true;

    public void rename(String name, byte[] normalizedKey) {
        this.name = name;
        this.normalizedKey = normalizedKey;
    }

    public void setActive(boolean active) {
        this.active = active;
    }
}
