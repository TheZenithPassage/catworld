package com.allegaeon.catworld.controller;

import com.allegaeon.catworld.dto.OperationsArrival;
import com.allegaeon.catworld.dto.OperationsDeparture;
import com.allegaeon.catworld.service.UpcomingStaysService;
import com.allegaeon.catworld.service.UpcomingStaysService.MovementWindow;
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
@RequestMapping("/api/operations")
public class UpcomingStaysController {
    public static final String REFRESH_HEADER = "X-Arrivals-Refresh-After-Ms";

    private final UpcomingStaysService upcomingStays;

    @GetMapping("/arrivals")
    public ResponseEntity<List<OperationsArrival>> arrivals(@RequestParam(defaultValue = "7") BigInteger daysAhead) {
        return response(upcomingStays.arrivals(daysAhead));
    }

    @GetMapping("/departures")
    public ResponseEntity<List<OperationsDeparture>> departures(@RequestParam(defaultValue = "7") BigInteger daysAhead) {
        return response(upcomingStays.departures(daysAhead));
    }

    private static <T> ResponseEntity<List<T>> response(MovementWindow<T> window) {
        return ResponseEntity.ok().cacheControl(CacheControl.noStore())
                .header(REFRESH_HEADER, Long.toString(window.refreshAfterMs()))
                .body(window.movements());
    }
}
