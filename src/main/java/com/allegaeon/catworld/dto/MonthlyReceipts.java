package com.allegaeon.catworld.dto;

import com.allegaeon.catworld.dto.overview.OverviewPage;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record MonthlyReceipts(OverviewPage<Receipt> payments, String totalAmount) {

    public record Receipt(UUID id, LocalDate paymentDate, String amount, UUID stayId,
                          String ownerName, List<String> cats, String note) {}
}
