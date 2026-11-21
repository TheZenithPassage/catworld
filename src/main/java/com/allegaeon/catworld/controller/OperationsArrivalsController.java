package com.allegaeon.catworld.controller;

import com.allegaeon.catworld.dto.OperationsArrival;
import com.allegaeon.catworld.service.OperationsArrivalsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.CacheControl;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigInteger;
import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/operations/arrivals")
public class OperationsArrivalsController {
    public static final String REFRESH_HEADER = "X-Arrivals-Refresh-After-Ms";

    private final OperationsArrivalsService arrivals;

    @GetMapping
    public ResponseEntity<List<OperationsArrival>> list(
            @RequestParam(defaultValue = "7") BigInteger daysAhead,
            @RequestParam(defaultValue = "true") boolean includeStartedToday) {
        var window = arrivals.list(daysAhead, includeStartedToday);
        return ResponseEntity.ok().cacheControl(CacheControl.noStore())
                .header(REFRESH_HEADER, Long.toString(window.refreshAfterMs()))
                .body(window.arrivals());
    }
}
