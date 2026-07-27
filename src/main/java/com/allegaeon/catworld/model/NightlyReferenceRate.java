package com.allegaeon.catworld.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Builder
@Table(name = "nightly_reference_rates")
public class NightlyReferenceRate extends AuditableEntity {

    @Id
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private NightlyReferenceRateCategory category;

    @Column(precision = 19, scale = 4)
    private BigDecimal nightlyRate;
}
