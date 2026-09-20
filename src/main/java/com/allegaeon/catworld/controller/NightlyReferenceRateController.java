package com.allegaeon.catworld.controller;

import com.allegaeon.catworld.dto.NightlyReferenceRateRequestDTO;
import com.allegaeon.catworld.dto.NightlyReferenceRateResponseDTO;
import com.allegaeon.catworld.model.NightlyReferenceRateKey;
import com.allegaeon.catworld.service.INightlyReferenceRateService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

import static org.springframework.http.HttpStatus.NO_CONTENT;

@RequiredArgsConstructor
@RestController
@RequestMapping("/api/nightly-reference-rates")
public class NightlyReferenceRateController {

    private final INightlyReferenceRateService nightlyReferenceRateService;

    @GetMapping
    public ResponseEntity<List<NightlyReferenceRateResponseDTO>> getCurrentRates() {
        return ResponseEntity.ok(nightlyReferenceRateService.getCurrentRates());
    }

    @PutMapping("/{key}")
    public ResponseEntity<NightlyReferenceRateResponseDTO> configureRate(
            @PathVariable NightlyReferenceRateKey key,
            @Valid @RequestBody NightlyReferenceRateRequestDTO request) {
        return ResponseEntity.ok(
                nightlyReferenceRateService.configureRate(
                        key,
                        request.getNightlyRate()
                )
        );
    }

    @DeleteMapping("/{key}")
    @ResponseStatus(NO_CONTENT)
    public void clearRate(@PathVariable NightlyReferenceRateKey key) {
        nightlyReferenceRateService.clearRate(key);
    }
}
