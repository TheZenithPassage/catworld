package com.allegaeon.catworld.controller;

import com.allegaeon.catworld.dto.PricingDecisionRequestDTO;
import com.allegaeon.catworld.dto.PaymentAnnulmentRequestDTO;
import com.allegaeon.catworld.dto.PaymentEditRequestDTO;
import com.allegaeon.catworld.dto.PaymentRegistrationRequestDTO;
import com.allegaeon.catworld.dto.PaymentRemovalRequestDTO;
import com.allegaeon.catworld.dto.StayRequestDTO;
import com.allegaeon.catworld.dto.StayResponseDTO;
import com.allegaeon.catworld.dto.StayUpdateDTO;
import com.allegaeon.catworld.service.IStayService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RequiredArgsConstructor
@RestController
@RequestMapping("/api/stays")
public class StayController {

    private final IStayService stayService;

    @GetMapping
    public ResponseEntity<List<StayResponseDTO>> getStays() {
        return ResponseEntity.ok(stayService.getAllStays());
    }

    @GetMapping("/{id}")
    public ResponseEntity<StayResponseDTO> getStay(@PathVariable UUID id) {
        return ResponseEntity.ok(stayService.getStay(id));
    }

    @PostMapping
    public ResponseEntity<StayResponseDTO> createStay(@Valid @RequestBody StayRequestDTO stayRequestDTO) {
        return ResponseEntity.status(HttpStatus.CREATED).body(stayService.createStay(stayRequestDTO));
    }

    @PutMapping("/{id}")
    public ResponseEntity<StayResponseDTO> updateStay(@PathVariable UUID id, @Valid @RequestBody StayUpdateDTO stayUpdateDTO) {
        return ResponseEntity.ok(stayService.updateStay(id, stayUpdateDTO));
    }

    @PatchMapping("/{id}/agreed-amount")
    public ResponseEntity<StayResponseDTO> correctAgreedAmount(
            @PathVariable UUID id,
            @Valid @RequestBody PricingDecisionRequestDTO pricingDecision) {
        return ResponseEntity.ok(
                stayService.correctAgreedAmount(id, pricingDecision)
        );
    }

    @PostMapping("/{stayId}/payments")
    public ResponseEntity<StayResponseDTO> registerPayment(
            @PathVariable UUID stayId,
            @Valid @RequestBody PaymentRegistrationRequestDTO paymentRequest) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(stayService.registerPayment(stayId, paymentRequest));
    }

    @PatchMapping("/{stayId}/payments/{paymentId}")
    public ResponseEntity<StayResponseDTO> editPayment(
            @PathVariable UUID stayId,
            @PathVariable UUID paymentId,
            @Valid @RequestBody PaymentEditRequestDTO paymentRequest) {
        return ResponseEntity.ok(
                stayService.editPayment(stayId, paymentId, paymentRequest)
        );
    }

    @PatchMapping("/{stayId}/payments/{paymentId}/annul")
    public ResponseEntity<StayResponseDTO> annulPayment(
            @PathVariable UUID stayId,
            @PathVariable UUID paymentId,
            @Valid @RequestBody PaymentAnnulmentRequestDTO paymentRequest) {
        return ResponseEntity.ok(
                stayService.annulPayment(stayId, paymentId, paymentRequest)
        );
    }

    @DeleteMapping("/{stayId}/payments/{paymentId}")
    public ResponseEntity<StayResponseDTO> removePayment(
            @PathVariable UUID stayId,
            @PathVariable UUID paymentId,
            @Valid @RequestBody PaymentRemovalRequestDTO paymentRequest) {
        return ResponseEntity.ok(
                stayService.removePayment(stayId, paymentId, paymentRequest)
        );
    }

    @PatchMapping("/{id}/cancel")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void  cancelStay(@PathVariable UUID id) {
        stayService.cancelStay(id);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteStay(@PathVariable UUID id) {
        stayService.deleteStay(id);
    }

}
