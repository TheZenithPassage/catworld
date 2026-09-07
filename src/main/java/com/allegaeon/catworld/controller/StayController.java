package com.allegaeon.catworld.controller;

import com.allegaeon.catworld.dto.PricingDecisionRequestDTO;
import com.allegaeon.catworld.dto.PaymentAnnulmentRequestDTO;
import com.allegaeon.catworld.dto.PaymentEditRequestDTO;
import com.allegaeon.catworld.dto.PaymentRegistrationRequestDTO;
import com.allegaeon.catworld.dto.PaymentRemovalRequestDTO;
import com.allegaeon.catworld.dto.StayRequestDTO;
import com.allegaeon.catworld.dto.StayResponseDTO;
import com.allegaeon.catworld.dto.StayUpdateDTO;
import com.allegaeon.catworld.dto.StayCreationPricingPreviewRequestDTO;
import com.allegaeon.catworld.dto.StayDatePricingPreviewRequestDTO;
import com.allegaeon.catworld.dto.StayPricingPreviewResponseDTO;
import com.allegaeon.catworld.dto.StayDatePricingPreviewResponseDTO;
import com.allegaeon.catworld.service.IStayService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;
import com.allegaeon.catworld.dto.relationship.CatRelationshipItem;
import com.allegaeon.catworld.dto.relationship.RelationshipPage;
import com.allegaeon.catworld.dto.relationship.StayDetailResponse;
import com.allegaeon.catworld.dto.PaymentCondition;
import com.allegaeon.catworld.dto.overview.*;
import com.allegaeon.catworld.model.StayStatus;
import java.util.Set;
import java.time.LocalDate;
import org.springframework.format.annotation.DateTimeFormat;
import com.allegaeon.catworld.dto.StayDateFilter;
import com.allegaeon.catworld.dto.StayDateMatchMode;

@RequiredArgsConstructor
@RestController
@RequestMapping("/api/stays")
public class StayController {

    private final IStayService stayService;

    @GetMapping
    public ResponseEntity<List<StayResponseDTO>> getStays(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateFrom,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateTo,
            @RequestParam(required = false) StayDateMatchMode dateMatchMode) {
        StayDateFilter dates = new StayDateFilter(dateFrom, dateTo, dateMatchMode);
        return ResponseEntity.ok(dates.active() ? stayService.getAllStays(dates) : stayService.getAllStays());
    }

    @GetMapping("/overview")
    public ResponseEntity<OverviewPage<StayOverviewItem>> getStayOverview(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(name = "status", required = false) Set<StayStatus> statuses,
            @RequestParam(required = false) UUID ownerId,
            @RequestParam(required = false) UUID catId,
            @RequestParam(name = "paymentCondition", required = false) Set<PaymentCondition> paymentConditions,
            @RequestParam(required = false) Boolean outstandingOnly,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateFrom,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateTo,
            @RequestParam(required = false) StayDateMatchMode dateMatchMode) {
        return ResponseEntity.ok(stayService.getStayOverview(page, statuses, ownerId, catId,
                paymentConditions, outstandingOnly, new StayDateFilter(dateFrom, dateTo, dateMatchMode)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<StayResponseDTO> getStay(@PathVariable UUID id) {
        return ResponseEntity.ok(stayService.getStay(id));
    }

    @GetMapping("/{id}/detail")
    public ResponseEntity<StayDetailResponse> getStayDetail(@PathVariable UUID id) {
        return ResponseEntity.ok(stayService.getStayDetail(id));
    }

    @GetMapping("/{id}/cats")
    public ResponseEntity<RelationshipPage<CatRelationshipItem>> getStayCats(
            @PathVariable UUID id, @RequestParam(defaultValue = "0") int page) {
        return ResponseEntity.ok(stayService.getStayCats(id, page));
    }

    @PostMapping
    public ResponseEntity<StayResponseDTO> createStay(@Valid @RequestBody StayRequestDTO stayRequestDTO) {
        return ResponseEntity.status(HttpStatus.CREATED).body(stayService.createStay(stayRequestDTO));
    }

    @PostMapping("/pricing-preview")
    public ResponseEntity<StayPricingPreviewResponseDTO> previewCreationPricing(
            @Valid @RequestBody StayCreationPricingPreviewRequestDTO request) {
        return ResponseEntity.ok(stayService.previewCreationPricing(request));
    }

    @PostMapping("/{id}/pricing-preview")
    public ResponseEntity<StayDatePricingPreviewResponseDTO> previewDateChangePricing(
            @PathVariable UUID id,
            @Valid @RequestBody StayDatePricingPreviewRequestDTO request) {
        return ResponseEntity.ok(stayService.previewDateChangePricing(id, request));
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
