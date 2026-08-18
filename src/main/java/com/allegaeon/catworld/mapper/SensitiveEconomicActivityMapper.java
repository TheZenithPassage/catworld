package com.allegaeon.catworld.mapper;

import com.allegaeon.catworld.dto.sensitiveactivity.AgreedAmountCorrectedActivityDTO;
import com.allegaeon.catworld.dto.sensitiveactivity.NightlyRateChangedActivityDTO;
import com.allegaeon.catworld.dto.sensitiveactivity.PaymentAnnulledActivityDTO;
import com.allegaeon.catworld.dto.sensitiveactivity.PaymentEditedActivityDTO;
import com.allegaeon.catworld.dto.sensitiveactivity.PaymentRemovedActivityDTO;
import com.allegaeon.catworld.dto.sensitiveactivity.PricingOverrideActivityDTO;
import com.allegaeon.catworld.dto.sensitiveactivity.SensitiveActorDTO;
import com.allegaeon.catworld.dto.sensitiveactivity.SensitiveCatContextDTO;
import com.allegaeon.catworld.dto.sensitiveactivity.SensitiveEconomicActivityResponseDTO;
import com.allegaeon.catworld.dto.sensitiveactivity.SensitiveOwnerContextDTO;
import com.allegaeon.catworld.dto.sensitiveactivity.SensitiveStayContextDTO;
import com.allegaeon.catworld.model.NightlyReferenceRateCategory;
import com.allegaeon.catworld.repository.SensitiveEconomicActivityProjection;
import com.allegaeon.catworld.validation.WholeMonetaryAmount;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.UUID;

@Component
public class SensitiveEconomicActivityMapper {

    public SensitiveEconomicActivityResponseDTO map(
            SensitiveEconomicActivityProjection projection) {
        SensitiveActorDTO actor = actor(
                projection.actorId(),
                projection.actorUsername()
        );
        SensitiveStayContextDTO context = context(projection);
        return switch (projection.eventType()) {
            case NIGHTLY_RATE_CHANGED -> new NightlyRateChangedActivityDTO(
                    projection.eventId(),
                    projection.eventType(),
                    projection.occurredAt(),
                    actor,
                    null,
                    NightlyReferenceRateCategory.valueOf(
                            projection.rateCategory()),
                    canonicalizeNullable(projection.previousRate()),
                    canonicalizeNullable(projection.newRate())
            );
            case PRICING_OVERRIDE -> new PricingOverrideActivityDTO(
                    projection.eventId(),
                    projection.eventType(),
                    projection.occurredAt(),
                    actor,
                    context,
                    WholeMonetaryAmount.canonicalize(
                            projection.retainedNightlyRate()),
                    projection.numberOfNights(),
                    WholeMonetaryAmount.canonicalize(
                            projection.agreedAmount()),
                    projection.reason()
            );
            case AGREED_AMOUNT_CORRECTED ->
                    new AgreedAmountCorrectedActivityDTO(
                            projection.eventId(),
                            projection.eventType(),
                            projection.occurredAt(),
                            actor,
                            context,
                            canonicalizeNullable(
                                    projection.previousAgreedAmount()),
                            WholeMonetaryAmount.canonicalize(
                                    projection.newAgreedAmount()),
                            projection.reason()
                    );
            case PAYMENT_EDITED -> new PaymentEditedActivityDTO(
                    projection.eventId(),
                    projection.eventType(),
                    projection.occurredAt(),
                    actor,
                    context,
                    projection.paymentId(),
                    WholeMonetaryAmount.canonicalize(
                            projection.previousAmount()),
                    WholeMonetaryAmount.canonicalize(
                            projection.newAmount()),
                    projection.paymentDate(),
                    projection.paymentNote(),
                    actor(
                            projection.registeredById(),
                            projection.registeredByUsername()),
                    projection.registeredAt(),
                    projection.reason()
            );
            case PAYMENT_ANNULLED -> new PaymentAnnulledActivityDTO(
                    projection.eventId(),
                    projection.eventType(),
                    projection.occurredAt(),
                    actor,
                    context,
                    projection.paymentId(),
                    WholeMonetaryAmount.canonicalize(projection.amount()),
                    projection.paymentDate(),
                    projection.paymentNote(),
                    actor(
                            projection.registeredById(),
                            projection.registeredByUsername()),
                    projection.registeredAt(),
                    projection.reason()
            );
            case PAYMENT_REMOVED -> new PaymentRemovedActivityDTO(
                    projection.eventId(),
                    projection.eventType(),
                    projection.occurredAt(),
                    actor,
                    context,
                    projection.paymentId(),
                    WholeMonetaryAmount.canonicalize(projection.amount()),
                    projection.paymentDate(),
                    projection.paymentNote(),
                    actor(
                            projection.registeredById(),
                            projection.registeredByUsername()),
                    projection.registeredAt(),
                    projection.annulled(),
                    projection.reason()
            );
        };
    }

    private SensitiveActorDTO actor(UUID id, String username) {
        return new SensitiveActorDTO(id, username);
    }

    private SensitiveStayContextDTO context(
            SensitiveEconomicActivityProjection projection) {
        if (projection.contextId() == null) {
            return null;
        }
        return new SensitiveStayContextDTO(
                projection.stayId(),
                projection.stayStartAt(),
                projection.stayEndAt(),
                projection.stayCancelledAt(),
                new SensitiveOwnerContextDTO(
                        projection.ownerId(),
                        projection.ownerFullName()
                ),
                projection.cats().stream()
                        .map(cat -> new SensitiveCatContextDTO(
                                cat.id(),
                                cat.name()
                        ))
                        .toList()
        );
    }

    private BigDecimal canonicalizeNullable(BigDecimal amount) {
        return amount == null
                ? null
                : WholeMonetaryAmount.canonicalize(amount);
    }
}
