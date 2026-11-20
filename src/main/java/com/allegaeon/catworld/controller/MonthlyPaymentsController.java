package com.allegaeon.catworld.controller;

import com.allegaeon.catworld.dto.MonthlyCollections;
import com.allegaeon.catworld.dto.MonthlyReceipts;
import com.allegaeon.catworld.service.MonthlyPaymentsService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
public class MonthlyPaymentsController {
    private final MonthlyPaymentsService monthlyPaymentsService;


    @GetMapping("/outstanding")
    public MonthlyCollections outstanding(@RequestParam(required = false) String month,
                                          @RequestParam(defaultValue = "month") String scope,
                                          @RequestParam(defaultValue = "false") boolean pricePendingOnly,
                                          @RequestParam(required = false) UUID ownerId,
                                          @RequestParam(required = false) UUID catId,
                                          @RequestParam(defaultValue = "0") int page) {
        return monthlyPaymentsService.getCollections(month, scope, pricePendingOnly, ownerId, catId, page);
    }

    @GetMapping("/received")
    public MonthlyReceipts received(@RequestParam(required = false) String month,
                                    @RequestParam(defaultValue = "month") String scope,
                                    @RequestParam(required = false) UUID ownerId,
                                    @RequestParam(required = false) UUID catId,
                                    @RequestParam(defaultValue = "0") int page) {
        return monthlyPaymentsService.getReceipts(month, scope, ownerId, catId, page);
    }
}
