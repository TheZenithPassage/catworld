package com.allegaeon.catworld.service;

import com.allegaeon.catworld.dto.sensitiveactivity.SensitiveEconomicActivityFilter;
import com.allegaeon.catworld.dto.sensitiveactivity.SensitiveEconomicActivityResponseDTO;
import com.allegaeon.catworld.exception.BadRequestException;
import com.allegaeon.catworld.mapper.SensitiveEconomicActivityMapper;
import com.allegaeon.catworld.repository.NightlyReferenceRateChangeRepository;
import com.allegaeon.catworld.repository.StayAgreedAmountCorrectionRepository;
import com.allegaeon.catworld.repository.StayPaymentAnnulmentRepository;
import com.allegaeon.catworld.repository.StayPaymentEditRepository;
import com.allegaeon.catworld.repository.StayPaymentRemovalRepository;
import com.allegaeon.catworld.repository.StayPricingDecisionRepository;
import com.allegaeon.catworld.security.CurrentUserAccountService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class SensitiveEconomicActivityService
        implements ISensitiveEconomicActivityService {

    private static final Comparator<SensitiveEconomicActivityResponseDTO>
            ACTIVITY_ORDER = Comparator
            .comparing(
                    SensitiveEconomicActivityResponseDTO::occurredAt,
                    Comparator.reverseOrder()
            )
            .thenComparing(
                    event -> event.eventType().ordinal()
            )
            .thenComparing(
                    event -> event.eventId().toString()
            );

    private final NightlyReferenceRateChangeRepository rateChangeRepository;
    private final StayPricingDecisionRepository pricingDecisionRepository;
    private final StayAgreedAmountCorrectionRepository correctionRepository;
    private final StayPaymentEditRepository paymentEditRepository;
    private final StayPaymentAnnulmentRepository paymentAnnulmentRepository;
    private final StayPaymentRemovalRepository paymentRemovalRepository;
    private final SensitiveEconomicActivityMapper mapper;
    private final CurrentUserAccountService currentUserAccountService;
    private final SensitiveEconomicActivityAuthorizationPolicy authorizationPolicy;

    @Override
    @Transactional(readOnly = true)
    public List<SensitiveEconomicActivityResponseDTO> getActivity(
            SensitiveEconomicActivityFilter filter) {
        authorizationPolicy.authorizeRead(
                currentUserAccountService.getCurrentUserAccount()
        );
        SensitiveEconomicActivityFilter effectiveFilter = filter == null
                ? new SensitiveEconomicActivityFilter(
                        null, null, null, null, null, null, null
                )
                : filter;
        validateRange(effectiveFilter);

        List<SensitiveEconomicActivityResponseDTO> events = new ArrayList<>();
        rateChangeRepository.findAll().stream()
                .map(mapper::map)
                .forEach(events::add);
        pricingDecisionRepository.findAllBySensitiveContextIsNotNull().stream()
                .map(mapper::map)
                .flatMap(java.util.Optional::stream)
                .forEach(events::add);
        correctionRepository.findAllBySensitiveContextIsNotNull().stream()
                .map(mapper::map)
                .forEach(events::add);
        paymentEditRepository.findAllBySensitiveContextIsNotNull().stream()
                .map(mapper::map)
                .forEach(events::add);
        paymentAnnulmentRepository.findAllBySensitiveContextIsNotNull().stream()
                .map(mapper::map)
                .forEach(events::add);
        paymentRemovalRepository.findAll().stream()
                .map(mapper::map)
                .forEach(events::add);

        Map<String, SensitiveEconomicActivityResponseDTO> distinctEvents =
                new LinkedHashMap<>();
        events.stream()
                .filter(event -> matches(event, effectiveFilter))
                .forEach(event -> distinctEvents.putIfAbsent(
                        event.eventType() + ":" + event.eventId(),
                        event
                ));

        return distinctEvents.values().stream()
                .sorted(ACTIVITY_ORDER)
                .toList();
    }

    private void validateRange(SensitiveEconomicActivityFilter filter) {
        if (filter.occurredFrom() != null
                && filter.occurredTo() != null
                && !filter.occurredFrom().isBefore(filter.occurredTo())) {
            throw new BadRequestException(
                    "occurredFrom must be earlier than occurredTo"
            );
        }
    }

    private boolean matches(
            SensitiveEconomicActivityResponseDTO event,
            SensitiveEconomicActivityFilter filter) {
        if (filter.actorId() != null
                && !filter.actorId().equals(event.actor().id())) {
            return false;
        }
        if (filter.occurredFrom() != null
                && event.occurredAt().isBefore(filter.occurredFrom())) {
            return false;
        }
        if (filter.occurredTo() != null
                && !event.occurredAt().isBefore(filter.occurredTo())) {
            return false;
        }
        if (filter.eventType() != null
                && filter.eventType() != event.eventType()) {
            return false;
        }
        if (filter.ownerId() == null
                && filter.catId() == null
                && filter.stayId() == null) {
            return true;
        }
        if (event.affectedContext() == null) {
            return false;
        }
        if (filter.ownerId() != null
                && !filter.ownerId().equals(
                        event.affectedContext().owner().id()
                )) {
            return false;
        }
        if (filter.stayId() != null
                && !filter.stayId().equals(
                        event.affectedContext().stayId()
                )) {
            return false;
        }
        return filter.catId() == null
                || event.affectedContext().cats().stream()
                .anyMatch(cat -> filter.catId().equals(cat.id()));
    }
}
