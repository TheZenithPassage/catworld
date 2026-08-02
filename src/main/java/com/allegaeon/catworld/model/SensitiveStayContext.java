package com.allegaeon.catworld.model;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotBlank;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Entity
@Builder
@Table(name = "sensitive_stay_contexts")
public class SensitiveStayContext {

    @Id
    private UUID id;

    @Column(nullable = false, updatable = false)
    private UUID stayId;

    @Column(nullable = false, updatable = false)
    private UUID ownerId;

    @Column(nullable = false, updatable = false)
    @NotBlank
    private String ownerFullName;

    @Column(nullable = false, updatable = false)
    private LocalDateTime stayStartAt;

    @Column(nullable = false, updatable = false)
    private LocalDateTime stayEndAt;

    @Column(updatable = false)
    private LocalDateTime stayCancelledAt;

    @Builder.Default
    @OneToMany(
            mappedBy = "context",
            fetch = FetchType.LAZY,
            cascade = CascadeType.ALL
    )
    private List<SensitiveStayContextCat> cats = new ArrayList<>();

    public void addCat(UUID catId, String catName) {
        cats.add(
                SensitiveStayContextCat.builder()
                        .id(new SensitiveStayContextCatId(id, catId))
                        .context(this)
                        .catName(catName)
                        .build()
        );
    }
}
