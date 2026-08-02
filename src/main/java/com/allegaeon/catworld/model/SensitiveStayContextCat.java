package com.allegaeon.catworld.model;

import jakarta.persistence.Column;
import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.MapsId;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotBlank;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Entity
@Builder
@Table(name = "sensitive_stay_context_cats")
public class SensitiveStayContextCat {

    @EmbeddedId
    private SensitiveStayContextCatId id;

    @MapsId("contextId")
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "context_id", nullable = false, updatable = false)
    private SensitiveStayContext context;

    @Column(nullable = false, updatable = false)
    @NotBlank
    private String catName;

    public java.util.UUID getCatId() {
        return id.getCatId();
    }
}

