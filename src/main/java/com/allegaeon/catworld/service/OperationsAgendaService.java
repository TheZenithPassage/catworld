package com.allegaeon.catworld.service;

import com.allegaeon.catworld.dto.OperationsAgendaDTO;
import com.allegaeon.catworld.dto.OperationsAgendaDTO.AgendaDay;
import com.allegaeon.catworld.dto.OperationsAgendaDTO.AgendaMovement;
import com.allegaeon.catworld.dto.OperationsAgendaDTO.AgendaStay;
import com.allegaeon.catworld.dto.StayCatSummaryDTO;
import com.allegaeon.catworld.exception.BadRequestException;
import com.allegaeon.catworld.model.Cat;
import com.allegaeon.catworld.model.Stay;
import com.allegaeon.catworld.model.StayActualMovement;
import com.allegaeon.catworld.model.StayActualMovementId;
import com.allegaeon.catworld.model.StayCat;
import com.allegaeon.catworld.model.StayStatus;
import com.allegaeon.catworld.repository.StayActualMovementRepository;
import com.allegaeon.catworld.repository.StayRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import static com.allegaeon.catworld.model.StayMovementType.ARRIVAL;
import static com.allegaeon.catworld.model.StayMovementType.DEPARTURE;

@Service
@RequiredArgsConstructor
public class OperationsAgendaService {

    private static final int UPCOMING_DAYS = 7;
    private static final LocalDate FIRST_SUPPORTED_DATE = LocalDate.of(1000, 1, 1);
    // The exclusive query boundary must also fit the database's DATETIME range.
    private static final LocalDate LAST_SUPPORTED_DATE = LocalDate.of(9999, 12, 31)
            .minusDays(UPCOMING_DAYS + 1);
    private static final Comparator<AgendaMovement> MOVEMENT_ORDER = Comparator
            .comparing(AgendaMovement::scheduledAt)
            .thenComparing(AgendaMovement::type)
            .thenComparing(movement -> movement.stay().stayId());

    private final StayRepository stayRepository;
    private final StayActualMovementRepository movementRepository;
    private final Clock clock;

    @Transactional(readOnly = true)
    public OperationsAgendaDTO getAgenda(LocalDate requestedDate) {
        LocalDateTime now = LocalDateTime.now(clock);
        LocalDate businessDate = now.toLocalDate();
        LocalDate date = requestedDate == null ? businessDate : requestedDate;
        if (date.isBefore(FIRST_SUPPORTED_DATE) || date.isAfter(LAST_SUPPORTED_DATE)) {
            throw new BadRequestException("Agenda date is outside the supported range");
        }

        LocalDateTime dayStart = date.atStartOfDay();
        LocalDate nextDate = date.plusDays(1);
        LocalDateTime nextDayStart = nextDate.atStartOfDay();
        LocalDate windowEndDate = nextDate.plusDays(UPCOMING_DAYS);
        LocalDateTime windowEnd = windowEndDate.atStartOfDay();
        boolean isBusinessToday = date.equals(businessDate);

        Map<LocalDate, List<AgendaMovement>> movementsByDate = new HashMap<>();
        List<AgendaStay> boardingStays = new ArrayList<>();
        List<Stay> stays = stayRepository.findForOperationsAgenda(dayStart, windowEnd);
        Map<StayActualMovementId, Instant> actualTimes = stays.isEmpty() ? Map.of()
                : movementRepository.findAllByIdStayIdIn(stays.stream().map(Stay::getId).toList()).stream()
                        .collect(Collectors.toMap(StayActualMovement::getId, StayActualMovement::occurredAt));
        for (Stay stay : stays) {
            AgendaStay summary = summarize(stay);
            addMovement(movementsByDate, new AgendaMovement(ARRIVAL, summary.startAt(),
                    stay.isArrivalTransferRequired(), summary,
                    actualTimes.get(new StayActualMovementId(stay.getId(), ARRIVAL))), dayStart, windowEnd);
            addMovement(movementsByDate, new AgendaMovement(DEPARTURE, summary.endAt(),
                    stay.isDepartureTransferRequired(), summary,
                    actualTimes.get(new StayActualMovementId(stay.getId(), DEPARTURE))), dayStart, windowEnd);

            boolean boarding = isBusinessToday
                    ? stay.statusAt(now) == StayStatus.CHECKED_IN
                    : summary.startAt().isBefore(nextDayStart) && summary.endAt().isAfter(dayStart);
            if (boarding && !summary.cats().isEmpty()) {
                boardingStays.add(summary);
            }
        }

        movementsByDate.values().forEach(movements -> movements.sort(MOVEMENT_ORDER));
        boardingStays.sort(Comparator.comparing(AgendaStay::endAt)
                .thenComparing(AgendaStay::startAt)
                .thenComparing(AgendaStay::stayId));
        List<AgendaDay> upcomingDays = nextDate.datesUntil(windowEndDate)
                .map(day -> new AgendaDay(day, movementsByDate.getOrDefault(day, List.of())))
                .toList();
        return new OperationsAgendaDTO(date, businessDate, movementsByDate.getOrDefault(date, List.of()),
                boardingStays, upcomingDays);
    }

    private static void addMovement(Map<LocalDate, List<AgendaMovement>> byDate, AgendaMovement movement,
                                    LocalDateTime windowStart, LocalDateTime windowEnd) {
        LocalDateTime scheduledAt = movement.scheduledAt();
        if (!scheduledAt.isBefore(windowStart) && scheduledAt.isBefore(windowEnd)) {
            byDate.computeIfAbsent(scheduledAt.toLocalDate(), date -> new ArrayList<>()).add(movement);
        }
    }

    private static AgendaStay summarize(Stay stay) {
        List<StayCatSummaryDTO> cats = stay.getStayCats().stream()
                .map(StayCat::getCat)
                .sorted(Comparator.comparing(Cat::getName, String.CASE_INSENSITIVE_ORDER)
                        .thenComparing(Cat::getId))
                .map(cat -> new StayCatSummaryDTO(cat.getId(), cat.getName()))
                .toList();
        return new AgendaStay(stay.getId(), stay.getOwner().getId(), stay.getOwner().getFullName(),
                cats, stay.getStartAt(), stay.getEndAt());
    }
}
