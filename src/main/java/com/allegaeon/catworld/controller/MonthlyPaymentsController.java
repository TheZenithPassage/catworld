package com.allegaeon.catworld.controller;

import com.allegaeon.catworld.dto.MonthlyCollections;
import com.allegaeon.catworld.dto.MonthlyReceipts;
import com.allegaeon.catworld.service.MonthlyPaymentsService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
public class MonthlyPaymentsController {
    private final MonthlyPaymentsService monthlyPaymentsService;


    @GetMapping("/outstanding")
    public MonthlyCollections outstanding(@RequestParam String month, @RequestParam(defaultValue = "0") int page) {
        return monthlyPaymentsService.getCollections(month, page);
    }

    @GetMapping("/received")
    public MonthlyReceipts received(@RequestParam String month, @RequestParam(defaultValue = "0") int page) {
        return monthlyPaymentsService.getReceipts(month, page);
    }
}
