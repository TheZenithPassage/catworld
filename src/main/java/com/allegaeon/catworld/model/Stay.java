package com.allegaeon.catworld.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Builder
@Table(name = "stays")
public class Stay extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private LocalDateTime startAt;

    @Column(nullable = false)
    private LocalDateTime endAt;

    private LocalDateTime cancelledAt;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(precision = 19, scale = 0)
    @DecimalMin(value = "0", inclusive = false)
    @Digits(integer = 19, fraction = 0)
    private BigDecimal retainedNightlyRate;

    @Column(precision = 19, scale = 0)
    @DecimalMin("0")
    @Digits(integer = 19, fraction = 0)
    private BigDecimal agreedAmount;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "owner_id", nullable = false)
    private Owner owner;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "created_by_id", nullable = false, updatable = false)
    private UserAccount createdBy;

    @Builder.Default
    @OneToMany(fetch = FetchType.LAZY, mappedBy = "stay", cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<StayCat> stayCats = new HashSet<>();

    @Transient
    public StayStatus getStatus() {
        if (cancelledAt != null) return StayStatus.CANCELLED;

        LocalDateTime now = LocalDateTime.now();

        if (now.isBefore(startAt)) return StayStatus.RESERVED;
        if (now.isBefore(endAt)) return StayStatus.CHECKED_IN;
        return StayStatus.CHECKED_OUT;
    }

}
