package com.allegaeon.catworld.repository;

import com.allegaeon.catworld.dto.sensitiveactivity.SensitiveEconomicEventType;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public record SensitiveEconomicActivityProjection(
        UUID eventId,
        SensitiveEconomicEventType eventType,
        Instant occurredAt,
        UUID actorId,
        String actorUsername,
        UUID contextId,
        UUID stayId,
        UUID ownerId,
        String ownerFullName,
        LocalDateTime stayStartAt,
        LocalDateTime stayEndAt,
        LocalDateTime stayCancelledAt,
        List<CatProjection> cats,
        String rateCategory,
        BigDecimal previousRate,
        BigDecimal newRate,
        BigDecimal retainedNightlyRate,
        Long numberOfNights,
        BigDecimal agreedAmount,
        BigDecimal previousAgreedAmount,
        BigDecimal newAgreedAmount,
        UUID paymentId,
        BigDecimal previousAmount,
        BigDecimal newAmount,
        BigDecimal amount,
        LocalDate paymentDate,
        String paymentNote,
        UUID registeredById,
        String registeredByUsername,
        Instant registeredAt,
        Boolean annulled,
        String reason) {

    public record CatProjection(UUID id, String name) {
    }
}
