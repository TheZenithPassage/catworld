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
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotNull;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Entity
@Builder
@Table(name = "stay_payments")
public class StayPayment extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "stay_id", nullable = false, updatable = false)
    private Stay stay;

    @Column(nullable = false, precision = 19, scale = 0)
    @NotNull
    @DecimalMin(value = "0", inclusive = false)
    @Digits(integer = 19, fraction = 0)
    private BigDecimal amount;

    @Column(nullable = false, updatable = false)
    @NotNull
    private LocalDate paymentDate;

    @Column(columnDefinition = "TEXT", updatable = false)
    private String note;

    @Builder.Default
    @Column(nullable = false)
    private boolean annulled = false;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "registered_by_id", nullable = false, updatable = false)
    private UserAccount registeredBy;

    public void changeAmount(BigDecimal newAmount) {
        this.amount = newAmount;
    }

    public void annul() {
        this.annulled = true;
    }
}
