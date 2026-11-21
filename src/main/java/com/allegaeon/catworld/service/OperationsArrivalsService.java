package com.allegaeon.catworld.service;

import com.allegaeon.catworld.dto.OperationsArrival;
import com.allegaeon.catworld.dto.OperationsArrival.ArrivalCat;
import com.allegaeon.catworld.dto.OperationsArrival.ArrivalOwner;
import com.allegaeon.catworld.dto.OperationsArrival.PendingReview;
import com.allegaeon.catworld.dto.OperationsArrival.VaccineWarning;
import com.allegaeon.catworld.exception.BadRequestException;
import com.allegaeon.catworld.model.UserRole;
import com.allegaeon.catworld.repository.CatIntakeReviewRepository;
import com.allegaeon.catworld.repository.CatIntakeReviewRepository.PendingCatReview;
import com.allegaeon.catworld.repository.StayRepository;
import com.allegaeon.catworld.repository.StayRepository.ArrivalRow;
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
public class OperationsArrivalsService {
    // The stored start time is a MySQL DATETIME(6).
    private static final LocalDate LAST_STORED_DATE = LocalDate.of(9999, 12, 31);

    private final StayRepository stays;
    private final CatIntakeReviewRepository intakeReviews;
    private final CurrentUserAccountService currentUser;
    private final Clock clock;

    @Transactional(readOnly = true)
    public ArrivalWindow list(BigInteger daysAhead, boolean includeStartedToday) {
        if (daysAhead.signum() < 0) {
            throw new BadRequestException("daysAhead must be a non-negative integer");
        }
        ZonedDateTime now = ZonedDateTime.now(clock);
        LocalDate today = now.toLocalDate();
        long daysToLastStoredDate = ChronoUnit.DAYS.between(today, LAST_STORED_DATE);
        LocalDateTime endExclusive = daysAhead.compareTo(BigInteger.valueOf(daysToLastStoredDate)) < 0
                ? today.plusDays(daysAhead.longValueExact() + 1).atStartOfDay()
                : null;
        List<ArrivalRow> rows = stays.findArrivalRows(today.atStartOfDay(), endExclusive);

        Instant nextRefresh = today.plusDays(1).atStartOfDay(now.getZone()).toInstant();
        if (!includeStartedToday) {
            rows = rows.stream()
                    .filter(row -> row.getStartAt().atZone(now.getZone()).isAfter(now))
                    .toList();
            Instant midnight = nextRefresh;
            nextRefresh = rows.stream().map(ArrivalRow::getStartAt).filter(start -> start.toLocalDate().equals(today))
                    .map(start -> start.atZone(now.getZone()).toInstant())
                    .min(Instant::compareTo).orElse(midnight);
        }
        boolean includeReviews = currentUser.getCurrentUserAccount().getRole() == UserRole.ADMIN;
        Map<UUID, List<PendingReview>> pendingReviews = includeReviews ? pendingReviews(rows) : Map.of();
        Map<UUID, List<ArrivalRow>> rowsByStay = rows.stream()
                .collect(groupingBy(ArrivalRow::getStayId, LinkedHashMap::new, toList()));

        List<OperationsArrival> arrivals = rowsByStay.values().stream().map(stayRows -> {
            ArrivalRow stay = stayRows.getFirst();
            List<ArrivalCat> cats = stayRows.stream()
                    .filter(row -> row.getCatId() != null)
                    .map(row -> toArrivalCat(row, includeReviews ? pendingReviews.getOrDefault(row.getCatId(), List.of()) : null))
                    .toList();
            return new OperationsArrival(stay.getStayId(), stay.getStartAt(), stay.getEndAt(),
                    new ArrivalOwner(stay.getOwnerId(), stay.getOwnerName()), cats);
        }).toList();
        long refreshAfterMs = Math.max(1, Duration.between(clock.instant(), nextRefresh).plusNanos(999_999).toMillis());
        return new ArrivalWindow(arrivals, refreshAfterMs);
    }

    public record ArrivalWindow(List<OperationsArrival> arrivals, long refreshAfterMs) {}

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
                        row.getLastRabiesDate(), row.getLastTripleFelineDate(), row.getEndAt().toLocalDate()).stream()
                .map(conflict -> new VaccineWarning(conflict.vaccineType(), conflict.reason()))
                .toList();
        String foodBrand = StringUtils.hasText(row.getFoodBrand()) ? row.getFoodBrand() : null;
        String litterBrand = StringUtils.hasText(row.getLitterBrand()) ? row.getLitterBrand() : null;
        return new ArrivalCat(row.getCatId(), row.getCatName(), foodBrand, litterBrand, warnings, pendingReviews);
    }
}
