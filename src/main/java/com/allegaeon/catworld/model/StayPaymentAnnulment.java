package com.allegaeon.catworld.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Entity
@Builder
@Table(name = "stay_payment_annulments")
public class StayPaymentAnnulment {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, updatable = false)
    private UUID stayId;

    @Column(nullable = false, unique = true, updatable = false)
    private UUID paymentId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "annulled_by_id", nullable = false, updatable = false)
    private UserAccount annulledBy;

    @Column(nullable = false, updatable = false)
    private Instant annulledAt;

    @Column(nullable = false, columnDefinition = "TEXT", updatable = false)
    @NotBlank
    private String reason;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(
            name = "sensitive_context_id",
            updatable = false,
            unique = true
    )
    private SensitiveStayContext sensitiveContext;

    @Column(precision = 19, scale = 0, updatable = false)
    @DecimalMin(value = "0", inclusive = false)
    @Digits(integer = 19, fraction = 0)
    private BigDecimal amount;

    @Column(updatable = false)
    private LocalDate paymentDate;

    @Column(columnDefinition = "TEXT", updatable = false)
    private String paymentNote;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "registered_by_id", updatable = false)
    private UserAccount registeredBy;

    @Column(updatable = false)
    private Instant registeredAt;
}
