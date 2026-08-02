package com.allegaeon.catworld.dto.sensitiveactivity;

import java.time.Instant;
import java.util.UUID;

public sealed interface SensitiveEconomicActivityResponseDTO
        permits NightlyRateChangedActivityDTO,
        PricingOverrideActivityDTO,
        AgreedAmountCorrectedActivityDTO,
        PaymentEditedActivityDTO,
        PaymentAnnulledActivityDTO,
        PaymentRemovedActivityDTO {

    UUID eventId();

    SensitiveEconomicEventType eventType();

    Instant occurredAt();

    SensitiveActorDTO actor();

    SensitiveStayContextDTO affectedContext();
}

