package com.allegaeon.catworld.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.Getter;
import lombok.NoArgsConstructor;

import org.hibernate.annotations.ColumnDefault;

import java.util.UUID;

@Getter
@NoArgsConstructor
@Entity
@Table(name = "cat_profile_options", uniqueConstraints = @UniqueConstraint(
        name = "uk_cat_profile_option_key", columnNames = {"category", "normalized_key"}))
public class CatProfileOption {
    @Id
    private UUID id;

    @Column(nullable = false, length = 32)
    private String category;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(nullable = false, length = 400)
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
