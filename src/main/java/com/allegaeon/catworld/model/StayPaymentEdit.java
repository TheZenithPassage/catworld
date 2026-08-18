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
import jakarta.validation.constraints.NotNull;
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
@Table(name = "stay_payment_edits")
public class StayPaymentEdit {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, updatable = false)
    private UUID stayId;

    @Column(nullable = false, updatable = false)
    private UUID paymentId;

    @Column(nullable = false, precision = 19, scale = 0, updatable = false)
    @NotNull
    @DecimalMin(value = "0", inclusive = false)
    @Digits(integer = 19, fraction = 0)
    private BigDecimal previousAmount;

    @Column(nullable = false, precision = 19, scale = 0, updatable = false)
    @NotNull
    @DecimalMin(value = "0", inclusive = false)
    @Digits(integer = 19, fraction = 0)
    private BigDecimal newAmount;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "edited_by_id", nullable = false, updatable = false)
    private UserAccount editedBy;

    @Column(nullable = false, updatable = false)
    private Instant editedAt;

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
