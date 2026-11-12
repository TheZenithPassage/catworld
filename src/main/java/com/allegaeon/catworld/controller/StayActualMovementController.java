package com.allegaeon.catworld.controller;

import com.allegaeon.catworld.dto.StayActualMovementRequest;
import com.allegaeon.catworld.dto.StayActualMovementsDTO;
import com.allegaeon.catworld.model.StayMovementType;
import com.allegaeon.catworld.service.StayActualMovementService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/stays/{stayId}/actual-movements")
@RequiredArgsConstructor
public class StayActualMovementController {

    private final StayActualMovementService service;

    @GetMapping
    public StayActualMovementsDTO getMovements(@PathVariable UUID stayId) {
        return service.getMovements(stayId);
    }

    @PutMapping("/{type}")
    public StayActualMovementsDTO recordMovement(@PathVariable UUID stayId, @PathVariable StayMovementType type,
                                                  @Valid @RequestBody StayActualMovementRequest request) {
        return service.recordMovement(stayId, type, request);
    }
}
