package com.allegaeon.catworld.model;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.util.UUID;

@Getter
@EqualsAndHashCode
@NoArgsConstructor
@AllArgsConstructor
@Embeddable
public class SensitiveStayContextCatId implements Serializable {

    @Column(name = "context_id", nullable = false, updatable = false)
    private UUID contextId;

    @Column(name = "cat_id", nullable = false, updatable = false)
    private UUID catId;
}
