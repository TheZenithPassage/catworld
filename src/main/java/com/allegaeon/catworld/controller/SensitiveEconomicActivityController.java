package com.allegaeon.catworld.controller;

import com.allegaeon.catworld.dto.sensitiveactivity.SensitiveEconomicActivityFilter;
import com.allegaeon.catworld.dto.sensitiveactivity.SensitiveEconomicActivityResponseDTO;
import com.allegaeon.catworld.dto.sensitiveactivity.SensitiveEconomicEventType;
import com.allegaeon.catworld.service.ISensitiveEconomicActivityService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import com.allegaeon.catworld.dto.overview.OverviewPage;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/sensitive-economic-activity")
public class SensitiveEconomicActivityController {

    private final ISensitiveEconomicActivityService activityService;

    @GetMapping
    public ResponseEntity<OverviewPage<SensitiveEconomicActivityResponseDTO>> getActivity(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(required = false) UUID actorId,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
            Instant occurredFrom,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
            Instant occurredTo,
            @RequestParam(required = false) SensitiveEconomicEventType eventType,
            @RequestParam(required = false) UUID ownerId,
            @RequestParam(required = false) UUID catId,
            @RequestParam(required = false) UUID stayId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate stayFrom,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate stayTo) {
        return ResponseEntity.ok(activityService.getActivity(
                new SensitiveEconomicActivityFilter(
                        actorId,
                        occurredFrom,
                        occurredTo,
                        eventType,
                        ownerId,
                        catId,
                        stayId, stayFrom, stayTo
                ), page
        ));
    }
}
