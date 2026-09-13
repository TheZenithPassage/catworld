package com.allegaeon.catworld.mapper;

import com.allegaeon.catworld.dto.StayCatSummaryDTO;
import com.allegaeon.catworld.dto.PaymentState;
import com.allegaeon.catworld.dto.StayRequestDTO;
import com.allegaeon.catworld.dto.StayPaymentResponseDTO;
import com.allegaeon.catworld.dto.StayResponseDTO;
import com.allegaeon.catworld.dto.StayUpdateDTO;
import com.allegaeon.catworld.model.Stay;
import com.allegaeon.catworld.model.StayPayment;
import com.allegaeon.catworld.model.StayPaymentAnnulment;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.Set;
import java.util.stream.Collectors;

@Component
public class StayMapper {

    public StayResponseDTO toResponseDTO(Stay stay) {
        return toResponseDTO(stay, false);
    }

    public StayResponseDTO toResponseDTO(Stay stay, boolean canDelete) {

        return StayResponseDTO.builder()
                .stayId(stay.getId())
                .startAt(stay.getStartAt())
                .endAt(stay.getEndAt())
                .cancelledAt(stay.getCancelledAt())
                .createdAt(stay.getCreatedAt())
                .updatedAt(stay.getUpdatedAt())
                .notes(stay.getNotes())
                .catIds(stay.getStayCats().stream().map(stayCat -> stayCat.getCat().getId()).collect(Collectors.toSet()))
                .ownerId(stay.getOwner().getId())
                .ownerName(stay.getOwner().getFullName())
                .cats(toCatSummaries(stay))
                .numberOfNights(calculateNumberOfNights(
                        stay.getStartAt(),
                        stay.getEndAt()))
                .retainedNightlyRate(stay.getRetainedNightlyRate())
                .arrivalTransferRequired(stay.isArrivalTransferRequired())
                .departureTransferRequired(stay.isDepartureTransferRequired())
                .transferWaived(stay.isTransferWaived())
                .retainedTransferRate(stay.getRetainedTransferRate())
                .transferSuggestedAmount(calculateTransferSuggestedAmount(stay))
                .suggestedAmount(combineSuggestion(calculateSuggestedAmount(
                        stay.getRetainedNightlyRate(),
                        calculateNumberOfNights(stay.getStartAt(), stay.getEndAt())),
                        calculateTransferSuggestedAmount(stay)))
                .agreedAmount(stay.getAgreedAmount())
                .canDelete(canDelete)
                .build();

    }

    public Stay toEntity(StayRequestDTO stayRequestDTO) {

        return Stay.builder()
                .startAt(stayRequestDTO.getStartAt())
                .endAt(stayRequestDTO.getEndAt())
                .notes(normalizeOptional(stayRequestDTO.getNotes()))
                .arrivalTransferRequired(Boolean.TRUE.equals(stayRequestDTO.getArrivalTransferRequired()))
                .departureTransferRequired(Boolean.TRUE.equals(stayRequestDTO.getDepartureTransferRequired()))
                .transferWaived(Boolean.TRUE.equals(stayRequestDTO.getTransferWaived()))
                .build();

    }

    public Stay updateEntity(Stay stay, StayUpdateDTO stayUpdateDTO) {

        stay.setStartAt(stayUpdateDTO.getStartAt());
        stay.setEndAt(stayUpdateDTO.getEndAt());
        stay.setNotes(normalizeOptional(stayUpdateDTO.getNotes()));
        if (stayUpdateDTO.getArrivalTransferRequired() != null) stay.setArrivalTransferRequired(stayUpdateDTO.getArrivalTransferRequired());
        if (stayUpdateDTO.getDepartureTransferRequired() != null) stay.setDepartureTransferRequired(stayUpdateDTO.getDepartureTransferRequired());
        if (stayUpdateDTO.getTransferWaived() != null) stay.setTransferWaived(stayUpdateDTO.getTransferWaived());

        return stay;

    }

    private String normalizeOptional(String value) {
        if (value == null) return null;
        String normalized = value.trim();
        return normalized.isEmpty() ? null : normalized;
    }

    public StayPaymentResponseDTO toPaymentResponseDTO(
            StayPayment payment,
            StayPaymentAnnulment annulment) {
        return StayPaymentResponseDTO.builder()
                .paymentId(payment.getId())
                .amount(payment.getAmount())
                .paymentDate(payment.getPaymentDate())
                .note(payment.getNote())
                .state(payment.isAnnulled()
                        ? PaymentState.ANNULLED
                        : PaymentState.ACTIVE)
                .registeredByUsername(payment.getRegisteredBy().getUsername())
                .registeredAt(payment.getCreatedAt())
                .annulledByUsername(annulment == null
                        ? null
                        : annulment.getAnnulledBy().getUsername())
                .annulledAt(annulment == null
                        ? null
                        : annulment.getAnnulledAt())
                .build();
    }

    public long calculateNumberOfNights(LocalDateTime startAt, LocalDateTime endAt) {
        return ChronoUnit.DAYS.between(startAt.toLocalDate(), endAt.toLocalDate());
    }

    public BigDecimal calculateSuggestedAmount(
            BigDecimal retainedNightlyRate,
            long numberOfNights) {
        return retainedNightlyRate == null
                ? null
                : retainedNightlyRate.multiply(BigDecimal.valueOf(numberOfNights));
    }

    private BigDecimal combineSuggestion(BigDecimal accommodation, BigDecimal transfer) {
        return accommodation == null ? null : accommodation.add(transfer);
    }
    public BigDecimal calculateTransferSuggestedAmount(Stay stay) { if (stay.isTransferWaived() || stay.getRetainedTransferRate() == null) return BigDecimal.ZERO; long legs = (stay.isArrivalTransferRequired()?1:0) + (stay.isDepartureTransferRequired()?1:0); return stay.getRetainedTransferRate().multiply(BigDecimal.valueOf(legs)); }

    private Set<StayCatSummaryDTO> toCatSummaries(Stay stay) {

        return stay.getStayCats().stream()
                .map(stayCat -> StayCatSummaryDTO.builder()
                        .catId(stayCat.getCat().getId())
                        .name(stayCat.getCat().getName())
                        .build())
                .collect(Collectors.toSet());

    }

}
