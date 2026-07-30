package com.allegaeon.catworld.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StayPaymentResponseDTO {

    private UUID paymentId;
    private BigDecimal amount;
    private LocalDate paymentDate;
    private String note;
    private PaymentState state;
    private String registeredByUsername;
    private Instant registeredAt;
}
