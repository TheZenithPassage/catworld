package com.allegaeon.catworld.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Entity
@Table(name = "litter_rates")
public class LitterRate {
    public static final long CURRENT_ID = 1L;

    @Id
    private Long id;

    @Setter
    @Column(precision = 19, scale = 0)
    @DecimalMin(value = "0", inclusive = false)
    @Digits(integer = 19, fraction = 0)
    private BigDecimal litterRatePerKg;
}
