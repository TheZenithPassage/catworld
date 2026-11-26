package com.allegaeon.catworld.controller;

import com.allegaeon.catworld.dto.LitterRateDTO;
import com.allegaeon.catworld.service.LitterRateService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/litter-rate")
@RequiredArgsConstructor
public class LitterRateController {
    private final LitterRateService service;

    @GetMapping
    public LitterRateDTO get() {
        return service.get();
    }

    @PutMapping
    public LitterRateDTO configure(@RequestBody LitterRateDTO request) {
        return service.configure(request.litterRatePerKg());
    }

    @DeleteMapping
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void clear() {
        service.clear();
    }
}
