package com.allegaeon.catworld.service;

import com.allegaeon.catworld.dto.OperationsArrival;
import com.allegaeon.catworld.dto.OperationsArrival.ArrivalCat;
import com.allegaeon.catworld.dto.OperationsArrival.ArrivalOwner;
import com.allegaeon.catworld.dto.OperationsArrival.PendingReview;
import com.allegaeon.catworld.dto.OperationsArrival.VaccineWarning;
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

import java.time.Clock;
import java.time.LocalDateTime;
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
    private static final int DAYS_AHEAD = 7;

    private final StayRepository stays;
    private final CatIntakeReviewRepository intakeReviews;
    private final CurrentUserAccountService currentUser;
    private final Clock clock;

    @Transactional(readOnly = true)
    public List<OperationsArrival> list() {
        LocalDateTime now = LocalDateTime.now(clock);
        LocalDateTime endExclusive = now.toLocalDate().plusDays(DAYS_AHEAD + 1).atStartOfDay();
        List<ArrivalRow> rows = stays.findArrivalRows(now, endExclusive);
        boolean includeReviews = currentUser.getCurrentUserAccount().getRole() == UserRole.ADMIN;
        Map<UUID, List<PendingReview>> pendingReviews = includeReviews ? pendingReviews(rows) : Map.of();
        Map<UUID, List<ArrivalRow>> rowsByStay = rows.stream()
                .collect(groupingBy(ArrivalRow::getStayId, LinkedHashMap::new, toList()));

        return rowsByStay.values().stream().map(stayRows -> {
            ArrivalRow stay = stayRows.getFirst();
            List<ArrivalCat> cats = stayRows.stream()
                    .filter(row -> row.getCatId() != null)
                    .map(row -> toArrivalCat(row, includeReviews ? pendingReviews.getOrDefault(row.getCatId(), List.of()) : null))
                    .toList();
            return new OperationsArrival(stay.getStayId(), stay.getStartAt(), stay.getEndAt(),
                    new ArrivalOwner(stay.getOwnerId(), stay.getOwnerName()), cats);
        }).toList();
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
                        row.getLastRabiesDate(), row.getLastTripleFelineDate(), row.getEndAt().toLocalDate()).stream()
                .map(conflict -> new VaccineWarning(conflict.vaccineType(), conflict.reason()))
                .toList();
        String foodBrand = StringUtils.hasText(row.getFoodBrand()) ? row.getFoodBrand() : null;
        String litterBrand = StringUtils.hasText(row.getLitterBrand()) ? row.getLitterBrand() : null;
        return new ArrivalCat(row.getCatId(), row.getCatName(), foodBrand, litterBrand, warnings, pendingReviews);
    }
}
