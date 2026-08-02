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
import com.allegaeon.catworld.dto.sensitiveactivity.SensitiveEconomicEventType;
import com.allegaeon.catworld.dto.sensitiveactivity.SensitiveOwnerContextDTO;
import com.allegaeon.catworld.dto.sensitiveactivity.SensitiveStayContextDTO;
import com.allegaeon.catworld.model.NightlyReferenceRateChange;
import com.allegaeon.catworld.model.SensitiveStayContext;
import com.allegaeon.catworld.model.StayAgreedAmountCorrection;
import com.allegaeon.catworld.model.StayPaymentAnnulment;
import com.allegaeon.catworld.model.StayPaymentEdit;
import com.allegaeon.catworld.model.StayPaymentRemoval;
import com.allegaeon.catworld.model.StayPricingDecision;
import com.allegaeon.catworld.model.UserAccount;
import com.allegaeon.catworld.validation.WholeMonetaryAmount;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.Comparator;
import java.util.Optional;

@Component
public class SensitiveEconomicActivityMapper {

    public SensitiveEconomicActivityResponseDTO map(
            NightlyReferenceRateChange change) {
        return new NightlyRateChangedActivityDTO(
                change.getId(),
                SensitiveEconomicEventType.NIGHTLY_RATE_CHANGED,
                change.getChangedAt(),
                actor(change.getChangedBy()),
                null,
                change.getCategory(),
                canonicalizeNullable(change.getPreviousNightlyRate()),
                canonicalizeNullable(change.getNewNightlyRate())
        );
    }

    public Optional<SensitiveEconomicActivityResponseDTO> map(
            StayPricingDecision decision) {
        if (!isEligiblePricingOverride(decision)) {
            return Optional.empty();
        }
        return Optional.of(new PricingOverrideActivityDTO(
                decision.getId(),
                SensitiveEconomicEventType.PRICING_OVERRIDE,
                decision.getDecidedAt(),
                actor(decision.getDecidedBy()),
                context(decision.getSensitiveContext()),
                WholeMonetaryAmount.canonicalize(
                        decision.getRetainedNightlyRate()
                ),
                decision.getNewNumberOfNights(),
                WholeMonetaryAmount.canonicalize(
                        decision.getNewAgreedAmount()
                ),
                decision.getReason()
        ));
    }

    public SensitiveEconomicActivityResponseDTO map(
            StayAgreedAmountCorrection correction) {
        return new AgreedAmountCorrectedActivityDTO(
                correction.getId(),
                SensitiveEconomicEventType.AGREED_AMOUNT_CORRECTED,
                correction.getDecidedAt(),
                actor(correction.getDecidedBy()),
                context(correction.getSensitiveContext()),
                canonicalizeNullable(correction.getPreviousAgreedAmount()),
                WholeMonetaryAmount.canonicalize(
                        correction.getNewAgreedAmount()
                ),
                correction.getReason()
        );
    }

    public SensitiveEconomicActivityResponseDTO map(StayPaymentEdit edit) {
        return new PaymentEditedActivityDTO(
                edit.getId(),
                SensitiveEconomicEventType.PAYMENT_EDITED,
                edit.getEditedAt(),
                actor(edit.getEditedBy()),
                context(edit.getSensitiveContext()),
                edit.getPaymentId(),
                WholeMonetaryAmount.canonicalize(edit.getPreviousAmount()),
                WholeMonetaryAmount.canonicalize(edit.getNewAmount()),
                edit.getPaymentDate(),
                edit.getPaymentNote(),
                actor(edit.getRegisteredBy()),
                edit.getRegisteredAt(),
                edit.getReason()
        );
    }

    public SensitiveEconomicActivityResponseDTO map(
            StayPaymentAnnulment annulment) {
        return new PaymentAnnulledActivityDTO(
                annulment.getId(),
                SensitiveEconomicEventType.PAYMENT_ANNULLED,
                annulment.getAnnulledAt(),
                actor(annulment.getAnnulledBy()),
                context(annulment.getSensitiveContext()),
                annulment.getPaymentId(),
                WholeMonetaryAmount.canonicalize(annulment.getAmount()),
                annulment.getPaymentDate(),
                annulment.getPaymentNote(),
                actor(annulment.getRegisteredBy()),
                annulment.getRegisteredAt(),
                annulment.getReason()
        );
    }

    public SensitiveEconomicActivityResponseDTO map(
            StayPaymentRemoval removal) {
        return new PaymentRemovedActivityDTO(
                removal.getId(),
                SensitiveEconomicEventType.PAYMENT_REMOVED,
                removal.getRemovedAt(),
                actor(removal.getRemovedBy()),
                context(removal.getSensitiveContext()),
                removal.getPaymentId(),
                WholeMonetaryAmount.canonicalize(removal.getAmount()),
                removal.getPaymentDate(),
                removal.getPaymentNote(),
                actor(removal.getRegisteredBy()),
                removal.getRegisteredAt(),
                removal.isAnnulled(),
                removal.getReason()
        );
    }

    private boolean isEligiblePricingOverride(StayPricingDecision decision) {
        if (decision.getSensitiveContext() == null
                || decision.getRetainedNightlyRate() == null
                || decision.getReason() == null
                || decision.getReason().isBlank()) {
            return false;
        }
        BigDecimal suggestion = decision.getRetainedNightlyRate()
                .multiply(BigDecimal.valueOf(decision.getNewNumberOfNights()));
        return suggestion.compareTo(decision.getNewAgreedAmount()) != 0;
    }

    private SensitiveActorDTO actor(UserAccount userAccount) {
        return new SensitiveActorDTO(
                userAccount.getId(),
                userAccount.getUsername()
        );
    }

    private SensitiveStayContextDTO context(SensitiveStayContext context) {
        return new SensitiveStayContextDTO(
                context.getStayId(),
                context.getStayStartAt(),
                context.getStayEndAt(),
                context.getStayCancelledAt(),
                new SensitiveOwnerContextDTO(
                        context.getOwnerId(),
                        context.getOwnerFullName()
                ),
                context.getCats().stream()
                        .map(cat -> new SensitiveCatContextDTO(
                                cat.getCatId(),
                                cat.getCatName()
                        ))
                        .sorted(Comparator.comparing(SensitiveCatContextDTO::id))
                        .toList()
        );
    }

    private BigDecimal canonicalizeNullable(BigDecimal amount) {
        return amount == null
                ? null
                : WholeMonetaryAmount.canonicalize(amount);
    }
}
