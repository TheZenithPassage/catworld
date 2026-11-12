package com.allegaeon.catworld.dto;

import com.allegaeon.catworld.dto.overview.OverviewPage;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public record MonthlyCollections(OverviewPage<StayBalance> stays, String knownTotal, long pendingPriceCount) {

    public record StayBalance(UUID stayId, LocalDateTime arrival, String ownerName, List<String> cats,
                             String agreedAmount, String paidAmount, String remainingAmount, String notes) {}
}
