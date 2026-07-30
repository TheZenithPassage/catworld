package com.allegaeon.catworld.service;

import com.allegaeon.catworld.dto.PricingDecisionRequestDTO;
import com.allegaeon.catworld.dto.PaymentAnnulmentRequestDTO;
import com.allegaeon.catworld.dto.PaymentEditRequestDTO;
import com.allegaeon.catworld.dto.PaymentRegistrationRequestDTO;
import com.allegaeon.catworld.dto.StayRequestDTO;
import com.allegaeon.catworld.dto.StayResponseDTO;
import com.allegaeon.catworld.dto.StayUpdateDTO;

import java.util.List;
import java.util.UUID;

public interface IStayService {

    List<StayResponseDTO> getAllStays();
    StayResponseDTO getStay(UUID stayId);
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
    void cancelStay(UUID stayId);
    void deleteStay(UUID stayId);

}
