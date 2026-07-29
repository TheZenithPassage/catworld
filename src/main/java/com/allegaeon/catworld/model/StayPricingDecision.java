package com.allegaeon.catworld.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Entity
@Builder
@Table(name = "stay_pricing_decisions")
public class StayPricingDecision {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, updatable = false)
    private UUID stayId;

    @Column(precision = 19, scale = 0, updatable = false)
    private BigDecimal retainedNightlyRate;

    @Column(updatable = false)
    private Long previousNumberOfNights;

    @Column(nullable = false, updatable = false)
    private long newNumberOfNights;

    @Column(precision = 19, scale = 0, updatable = false)
    private BigDecimal previousAgreedAmount;

    @Column(nullable = false, precision = 19, scale = 0, updatable = false)
    private BigDecimal newAgreedAmount;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "decided_by_id", nullable = false, updatable = false)
    private UserAccount decidedBy;

    @Column(nullable = false, updatable = false)
    private Instant decidedAt;

    @Column(columnDefinition = "TEXT", updatable = false)
    private String reason;
}
