package com.allegaeon.catworld.service;

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

import java.util.List;
import java.util.UUID;
import com.allegaeon.catworld.dto.relationship.CatRelationshipItem;
import com.allegaeon.catworld.dto.relationship.RelationshipPage;
import com.allegaeon.catworld.dto.relationship.StayDetailResponse;

public interface IStayService {

    List<StayResponseDTO> getAllStays();
    StayResponseDTO getStay(UUID stayId);
    StayDetailResponse getStayDetail(UUID stayId);
    RelationshipPage<CatRelationshipItem> getStayCats(UUID stayId, int page);
    StayPricingPreviewResponseDTO previewCreationPricing(
            StayCreationPricingPreviewRequestDTO request);
    StayDatePricingPreviewResponseDTO previewDateChangePricing(
            UUID stayId, StayDatePricingPreviewRequestDTO request);
    StayResponseDTO createStay(StayRequestDTO stayRequestDTO);
    StayResponseDTO updateStay(UUID stayId, StayUpdateDTO stayUpdateDTO);
    StayResponseDTO correctAgreedAmount(
            UUID stayId,
            PricingDecisionRequestDTO pricingDecision);
    StayResponseDTO registerPayment(
            UUID stayId,
            PaymentRegistrationRequestDTO paymentRequest);
    StayResponseDTO editPayment(
            UUID stayId,
            UUID paymentId,
            PaymentEditRequestDTO paymentRequest);
    StayResponseDTO annulPayment(
            UUID stayId,
            UUID paymentId,
            PaymentAnnulmentRequestDTO paymentRequest);
    StayResponseDTO removePayment(
            UUID stayId,
            UUID paymentId,
            PaymentRemovalRequestDTO paymentRequest);
    void cancelStay(UUID stayId);
    void deleteStay(UUID stayId);

}
