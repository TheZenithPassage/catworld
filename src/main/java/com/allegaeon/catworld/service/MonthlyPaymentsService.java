package com.allegaeon.catworld.service;

import com.allegaeon.catworld.dto.MonthlyCollections;
import com.allegaeon.catworld.dto.MonthlyReceipts;
import com.allegaeon.catworld.dto.overview.OverviewPage;
import com.allegaeon.catworld.exception.BadRequestException;
import com.allegaeon.catworld.model.Stay;
import com.allegaeon.catworld.model.StayPayment;
import com.allegaeon.catworld.repository.MonthlyPaymentsRepository;
import com.allegaeon.catworld.repository.MonthlyPaymentsRepository.CollectionBalance;
import com.allegaeon.catworld.repository.StayCatRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;

import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MonthlyPaymentsService {
    private final MonthlyPaymentsRepository monthlyPaymentsRepository;
    private final StayCatRepository stayCatRepository;

    @Transactional(readOnly = true)
    public MonthlyReceipts getReceipts(String requestedMonth, int page) {
        YearMonth month = parseMonth(requestedMonth);
        validatePage(page);
        LocalDate start = month.atDay(1);
        LocalDate end = month.plusMonths(1).atDay(1);
        var totals = monthlyPaymentsRepository.summarizeReceipts(start, end);
        int actualPage = existingPage(page, totals.count());
        var payments = monthlyPaymentsRepository.findReceipts(start, end, actualPage * OverviewPage.PAGE_SIZE,
                OverviewPage.PAGE_SIZE);
        var cats = catNamesByStay(payments.stream().map(payment -> payment.getStay().getId()).distinct().toList());
        var items = payments.stream().map(payment -> receipt(payment, cats)).toList();
        return new MonthlyReceipts(new OverviewPage<>(items, actualPage, totals.count()), totals.amount().toPlainString());
    }


    @Transactional(readOnly = true)
    public MonthlyCollections getCollections(String requestedMonth, int page) {
        YearMonth month = parseMonth(requestedMonth);
        validatePage(page);
        var balances = monthlyPaymentsRepository.findCollectionBalances(month.atDay(1), month.plusMonths(1).atDay(1));
        var knownTotal = balances.stream().map(CollectionBalance::remaining).filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        long pendingPriceCount = balances.stream().filter(balance -> balance.agreed() == null).count();

        int actualPage = existingPage(page, balances.size());
        var pageBalances = balances.stream().skip((long) actualPage * OverviewPage.PAGE_SIZE)
                .limit(OverviewPage.PAGE_SIZE).toList();
        var ids = pageBalances.stream().map(CollectionBalance::stayId).toList();
        var cats = catNamesByStay(ids);
        var stays = ids.isEmpty() ? Map.<UUID, Stay>of() : monthlyPaymentsRepository.findCollectionStays(ids).stream()
                .collect(Collectors.toMap(Stay::getId, Function.identity()));
        var rows = pageBalances.stream().map(balance -> collectionRow(balance, stays.get(balance.stayId()), cats)).toList();
        return new MonthlyCollections(new OverviewPage<>(rows, actualPage, balances.size()), knownTotal.toPlainString(), pendingPriceCount);
    }

    private MonthlyCollections.StayBalance collectionRow(CollectionBalance balance, Stay stay, Map<UUID, List<String>> cats) {
        return new MonthlyCollections.StayBalance(stay.getId(), stay.getStartAt(), stay.getOwner().getFullName(),
                cats.getOrDefault(stay.getId(), List.of()), decimalOrNull(balance.agreed()),
                balance.paid().toPlainString(), decimalOrNull(balance.remaining()), stay.getNotes());
    }

    private String decimalOrNull(BigDecimal amount) {
        return amount == null ? null : amount.toPlainString();
    }

    private MonthlyReceipts.Receipt receipt(StayPayment payment, Map<UUID, List<String>> cats) {
        var stay = payment.getStay();
        return new MonthlyReceipts.Receipt(payment.getId(), payment.getPaymentDate(), payment.getAmount().toPlainString(),
                stay.getId(), stay.getOwner().getFullName(), cats.getOrDefault(stay.getId(), List.of()), payment.getNote());
    }

    private Map<UUID, List<String>> catNamesByStay(List<UUID> stayIds) {
        Map<UUID, List<String>> names = new HashMap<>();
        if (!stayIds.isEmpty()) {
            stayCatRepository.findOverviewCatsByStayIds(stayIds).forEach(relation ->
                    names.computeIfAbsent(relation.getStay().getId(), ignored -> new ArrayList<>())
                            .add(relation.getCat().getName()));
        }
        return names;
    }

    private YearMonth parseMonth(String value) {
        if (!value.matches("[1-9]\\d{3}-\\d{2}")) {
            throw new BadRequestException("Month must use YYYY-MM");
        }
        try {
            return YearMonth.parse(value);
        } catch (DateTimeParseException exception) {
            throw new BadRequestException("Month must use YYYY-MM");
        }
    }

    private int existingPage(int requestedPage, long total) {
        return (int) Math.min(requestedPage, Math.max(0, total - 1) / OverviewPage.PAGE_SIZE);
    }

    private void validatePage(int page) {
        if (page < 0 || page > Integer.MAX_VALUE / OverviewPage.PAGE_SIZE) {
            throw new BadRequestException("Page is outside the supported range");
        }
    }
}
