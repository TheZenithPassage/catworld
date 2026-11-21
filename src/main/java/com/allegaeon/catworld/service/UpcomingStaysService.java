package com.allegaeon.catworld.service;

import com.allegaeon.catworld.dto.OperationsArrival;
import com.allegaeon.catworld.dto.OperationsArrival.ArrivalCat;
import com.allegaeon.catworld.dto.OperationsArrival.PendingReview;
import com.allegaeon.catworld.dto.OperationsArrival.VaccineWarning;
import com.allegaeon.catworld.dto.OperationsDeparture;
import com.allegaeon.catworld.dto.OperationsDeparture.DepartureCat;
import com.allegaeon.catworld.dto.OperationsStayOwner;
import com.allegaeon.catworld.exception.BadRequestException;
import com.allegaeon.catworld.model.LitterPreference;
import com.allegaeon.catworld.model.StayStatus;
import com.allegaeon.catworld.model.UserRole;
import com.allegaeon.catworld.repository.CatIntakeReviewRepository;
import com.allegaeon.catworld.repository.CatIntakeReviewRepository.PendingCatReview;
import com.allegaeon.catworld.repository.StayRepository;
import com.allegaeon.catworld.repository.StayRepository.ArrivalRow;
import com.allegaeon.catworld.repository.StayRepository.MovementRow;
import com.allegaeon.catworld.security.CurrentUserAccountService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.math.BigInteger;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZonedDateTime;
import java.time.temporal.ChronoUnit;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;

import static java.util.stream.Collectors.groupingBy;
import static java.util.stream.Collectors.mapping;
import static java.util.stream.Collectors.toList;
import static java.util.stream.Collectors.toSet;

@Service
@RequiredArgsConstructor
public class UpcomingStaysService {
    // Scheduled times are stored as MySQL DATETIME(6).
    private static final LocalDate LAST_STORED_DATE = LocalDate.of(9999, 12, 31);

    private final StayRepository stays;
    private final CatIntakeReviewRepository intakeReviews;
    private final CurrentUserAccountService currentUser;
    private final Clock clock;

    @Transactional(readOnly = true)
    public MovementWindow<OperationsArrival> arrivals(BigInteger daysAhead) {
        CalendarWindow window = calendarWindow(daysAhead);
        List<ArrivalRow> rows = stays.findArrivalRows(window.endExclusive());
        boolean includeReviews = currentUser.getCurrentUserAccount().getRole() == UserRole.ADMIN;
        Map<UUID, List<PendingReview>> pendingReviews = includeReviews ? pendingReviews(rows) : Map.of();

        List<OperationsArrival> arrivals = groupByStay(rows).values().stream().map(stayRows -> {
            ArrivalRow stay = stayRows.getFirst();
            LocalDate scheduledDay = stay.getStartAt().toLocalDate();
            List<ArrivalCat> cats = stayRows.stream()
                    .filter(row -> row.getCatId() != null)
                    .map(row -> toArrivalCat(row, includeReviews ? pendingReviews.getOrDefault(row.getCatId(), List.of()) : null))
                    .toList();
            return new OperationsArrival(stay.getStayId(), stay.getStartAt(), stay.getEndAt(),
                    new OperationsStayOwner(stay.getOwnerId(), stay.getOwnerName()), cats, stay.getTransferRequired(),
                    stay.getStatus(), scheduledDay.isBefore(window.today()), scheduledDay.equals(window.today()));
        }).toList();
        return new MovementWindow<>(arrivals, refreshAfterMs(window));
    }

    @Transactional(readOnly = true)
    public MovementWindow<OperationsDeparture> departures(BigInteger daysAhead) {
        CalendarWindow window = calendarWindow(daysAhead);
        List<MovementRow> rows = stays.findDepartureRows(window.endExclusive());

        List<OperationsDeparture> departures = groupByStay(rows).values().stream().map(stayRows -> {
            MovementRow stay = stayRows.getFirst();
            LocalDate scheduledDay = stay.getEndAt().toLocalDate();
            List<DepartureCat> cats = stayRows.stream()
                    .filter(row -> row.getCatId() != null)
                    .map(row -> new DepartureCat(row.getCatId(), row.getCatName()))
                    .toList();
            boolean canRecord = scheduledDay.equals(window.today()) && stay.getStatus() == StayStatus.CHECKED_IN;
            return new OperationsDeparture(stay.getStayId(), stay.getStartAt(), stay.getEndAt(),
                    new OperationsStayOwner(stay.getOwnerId(), stay.getOwnerName()), cats, stay.getTransferRequired(),
                    stay.getStatus(), scheduledDay.isBefore(window.today()), canRecord);
        }).toList();
        return new MovementWindow<>(departures, refreshAfterMs(window));
    }

    private CalendarWindow calendarWindow(BigInteger daysAhead) {
        if (daysAhead.signum() < 0) {
            throw new BadRequestException("daysAhead must be a non-negative integer");
        }
        ZonedDateTime now = ZonedDateTime.now(clock);
        LocalDate today = now.toLocalDate();
        long daysToLastStoredDate = ChronoUnit.DAYS.between(today, LAST_STORED_DATE);
        LocalDateTime endExclusive = daysAhead.compareTo(BigInteger.valueOf(daysToLastStoredDate)) < 0
                ? today.plusDays(daysAhead.longValueExact() + 1).atStartOfDay()
                : null;
        Instant nextBusinessMidnight = today.plusDays(1).atStartOfDay(now.getZone()).toInstant();
        return new CalendarWindow(today, endExclusive, nextBusinessMidnight);
    }

    private long refreshAfterMs(CalendarWindow window) {
        return Math.max(1, Duration.between(clock.instant(), window.nextBusinessMidnight()).plusNanos(999_999).toMillis());
    }

    public record MovementWindow<T>(List<T> movements, long refreshAfterMs) {}

    private record CalendarWindow(LocalDate today, LocalDateTime endExclusive, Instant nextBusinessMidnight) {}

    private static <T extends MovementRow> Map<UUID, List<T>> groupByStay(List<T> rows) {
        return rows.stream().collect(groupingBy(MovementRow::getStayId, LinkedHashMap::new, toList()));
    }

    private Map<UUID, List<PendingReview>> pendingReviews(List<ArrivalRow> rows) {
        Set<UUID> catIds = rows.stream().map(ArrivalRow::getCatId).filter(Objects::nonNull).collect(toSet());
        if (catIds.isEmpty()) {
            return Map.of();
        }
        return intakeReviews.findPendingForCats(catIds).stream()
                .collect(groupingBy(PendingCatReview::getCatId,
                        mapping(review -> new PendingReview(review.getId(), review.getSubmittedAt()), toList())));
    }

    private ArrivalCat toArrivalCat(ArrivalRow row, List<PendingReview> pendingReviews) {
        List<VaccineWarning> warnings = StayVaccineCoverage.findConflicts(
                        row.getLastRabiesDate(), row.getLastTripleFelineDate(),
                        row.getStartAt().toLocalDate(), row.getEndAt().toLocalDate()).stream()
                .map(conflict -> new VaccineWarning(conflict.vaccineType(), conflict.reason(), conflict.expiresOn()))
                .toList();
        String foodBrand = StringUtils.hasText(row.getFoodBrand()) ? row.getFoodBrand() : null;
        LitterPreference litterChoice = row.getLitterChoice();
        String litterDetail = row.getLitterDetail();
        if (litterChoice == null) {
            String legacyLitterBrand = row.getLegacyLitterBrand();
            litterChoice = LitterPreference.fromLegacyValue(legacyLitterBrand);
            litterDetail = LitterPreference.detailFromLegacyValue(legacyLitterBrand);
        }
        String litterBrand = litterChoice == null ? null : litterChoice.legacyValueWithDetail(litterDetail);
        return new ArrivalCat(row.getCatId(), row.getCatName(), foodBrand, litterBrand, litterChoice,
                warnings, pendingReviews);
    }
}
