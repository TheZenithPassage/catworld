package com.allegaeon.catworld.service;

import com.allegaeon.catworld.dto.MonthlyReceipts;
import com.allegaeon.catworld.dto.overview.OverviewPage;
import com.allegaeon.catworld.exception.BadRequestException;
import com.allegaeon.catworld.model.StayPayment;
import com.allegaeon.catworld.repository.MonthlyPaymentsRepository;
import com.allegaeon.catworld.repository.StayCatRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.YearMonth;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class MonthlyPaymentsService {
    private final MonthlyPaymentsRepository monthlyPaymentsRepository;
    private final StayCatRepository stayCatRepository;

    @Transactional(readOnly = true)
    public MonthlyReceipts getReceipts(String requestedMonth, int page) {
        YearMonth month = parseMonth(requestedMonth);
        int offset = offsetFor(page);
        LocalDate start = month.atDay(1);
        LocalDate end = month.plusMonths(1).atDay(1);
        var totals = monthlyPaymentsRepository.summarizeReceipts(start, end);
        var payments = monthlyPaymentsRepository.findReceipts(start, end, offset, OverviewPage.PAGE_SIZE);
        var cats = catNamesByStay(payments.stream().map(payment -> payment.getStay().getId()).distinct().toList());
        var items = payments.stream().map(payment -> receipt(payment, cats)).toList();
        return new MonthlyReceipts(new OverviewPage<>(items, page, totals.count()), totals.amount().toPlainString());
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

    private int offsetFor(int page) {
        if (page < 0 || page > Integer.MAX_VALUE / OverviewPage.PAGE_SIZE) {
            throw new BadRequestException("Page is outside the supported range");
        }
        return page * OverviewPage.PAGE_SIZE;
    }
}
