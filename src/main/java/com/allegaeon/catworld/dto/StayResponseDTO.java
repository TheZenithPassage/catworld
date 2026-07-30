package com.allegaeon.catworld.dto;

import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StayResponseDTO {

    private UUID stayId;
    private LocalDateTime startAt;
    private LocalDateTime endAt;
    private LocalDateTime cancelledAt;
    private Instant createdAt;
    private Instant updatedAt;
    private String notes;
    private Set<UUID> catIds;
    private UUID ownerId;
    private String ownerName;
    private Set<StayCatSummaryDTO> cats;
    private long numberOfNights;
    private BigDecimal retainedNightlyRate;
    private BigDecimal suggestedAmount;
    private BigDecimal agreedAmount;
    private BigDecimal totalPaid;
    private BigDecimal remainingAmount;
    private PaymentCondition paymentCondition;
    private boolean outstandingCollectionEligible;
    private List<StayPaymentResponseDTO> payments;
    private boolean canDelete;

}
