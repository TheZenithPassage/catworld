package com.allegaeon.catworld.controller;

import com.allegaeon.catworld.dto.OperationsArrival;
import com.allegaeon.catworld.service.OperationsArrivalsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.CacheControl;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/operations/arrivals")
public class OperationsArrivalsController {
    private final OperationsArrivalsService arrivals;

    @GetMapping
    public ResponseEntity<List<OperationsArrival>> list() {
        return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(arrivals.list());
    }
}
