package com.allegaeon.catworld.model;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
@Entity @Table(name = "transfer_rates")
public class TransferRate {
    @Id private Long id;
    @Column(precision = 19, scale = 0) private BigDecimal transferRate;
}
