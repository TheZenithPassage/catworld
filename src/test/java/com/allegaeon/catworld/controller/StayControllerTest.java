package com.allegaeon.catworld.controller;

import com.allegaeon.catworld.dto.PricingDecisionRequestDTO;
import com.allegaeon.catworld.dto.PaymentCondition;
import com.allegaeon.catworld.dto.PaymentState;
import com.allegaeon.catworld.dto.StayPaymentResponseDTO;
import com.allegaeon.catworld.dto.StayRequestDTO;
import com.allegaeon.catworld.dto.StayResponseDTO;
import com.allegaeon.catworld.dto.StayUpdateDTO;
import com.allegaeon.catworld.dto.VaccineConflictReason;
import com.allegaeon.catworld.dto.VaccineConflictViolationDTO;
import com.allegaeon.catworld.dto.VaccineType;
import com.allegaeon.catworld.exception.BadRequestException;
import com.allegaeon.catworld.exception.ConflictException;
import com.allegaeon.catworld.exception.ForbiddenException;
import com.allegaeon.catworld.exception.ResourceNotFoundException;
import com.allegaeon.catworld.exception.VaccineConflictException;
import com.allegaeon.catworld.service.IStayService;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import tools.jackson.databind.ObjectMapper;
import org.springframework.http.MediaType;
import static org.hamcrest.Matchers.nullValue;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.LocalDate;
import java.time.Instant;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@WebMvcTest(StayController.class)
public class StayControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private IStayService stayService;

    @Nested
    class GetStayTests {

        @Test
        void shouldReturnOk_whenGettingAllStays() throws Exception {

            when(stayService.getAllStays()).thenReturn(List.of());

            mockMvc.perform(get("/api/stays"))
                    .andExpect(status().isOk())
                    .andExpect(content().json("[]"));

            verify(stayService).getAllStays();

        }

        @Test
        void shouldReturnOk_whenGettingStayById() throws Exception {

            UUID stayId = UUID.randomUUID();

            when(stayService.getStay(stayId)).thenReturn(StayResponseDTO.builder()
                    .stayId(stayId)
                    .numberOfNights(3)
                    .retainedNightlyRate(new BigDecimal("25"))
                    .suggestedAmount(new BigDecimal("75"))
                    .agreedAmount(new BigDecimal("70"))
                    .canDelete(true)
                    .build());

            mockMvc.perform(get("/api/stays/{id}", stayId))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.stayId").value(stayId.toString()))
                    .andExpect(jsonPath("$.numberOfNights").value(3))
                    .andExpect(jsonPath("$.retainedNightlyRate").value(25))
                    .andExpect(jsonPath("$.suggestedAmount").value(75))
                    .andExpect(jsonPath("$.agreedAmount").value(70))
                    .andExpect(jsonPath("$.canDelete").value(true));

            verify(stayService).getStay(stayId);

        }

        @Test
        void shouldReturnNotFound_whenServiceThrowsNotFoundException() throws Exception {

            UUID stayId = UUID.randomUUID();

            when(stayService.getStay(stayId)).thenThrow(new ResourceNotFoundException("Stay", stayId));

            mockMvc.perform(get("/api/stays/{id}", stayId))
                    .andExpect(status().isNotFound());

            verify(stayService).getStay(stayId);

        }

    }

    @Nested
    class PostStayTests {

        @Test
        void shouldReturnCreated_whenPostStayRequestIsValid() throws Exception {

            UUID stayId = UUID.randomUUID();

            StayRequestDTO request = StayRequestDTO.builder()
                    .startAt(LocalDateTime.now().plusDays(1))
                    .endAt(LocalDateTime.now().plusDays(2))
                    .catIds(Set.of(UUID.randomUUID()))
                    .notes("Test stay")
                    .overrideVaccineConflicts(true)
                    .pricingDecision(PricingDecisionRequestDTO.builder()
                            .agreedAmount(new BigDecimal("100"))
                            .build())
                    .build();

            when(stayService.createStay(any(StayRequestDTO.class))).thenReturn(
                    StayResponseDTO.builder()
                            .stayId(stayId)
                            .retainedNightlyRate(new BigDecimal("25"))
                            .suggestedAmount(new BigDecimal("25"))
                            .agreedAmount(new BigDecimal("100"))
                            .build()
            );

            mockMvc.perform(post("/api/stays")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.stayId").value(stayId.toString()))
                    .andExpect(jsonPath("$.retainedNightlyRate").value(25))
                    .andExpect(jsonPath("$.suggestedAmount").value(25))
                    .andExpect(jsonPath("$.agreedAmount").value(100))
                    .andExpect(jsonPath("$.creator").doesNotExist())
                    .andExpect(jsonPath("$.creatorId").doesNotExist())
                    .andExpect(jsonPath("$.createdBy").doesNotExist())
                    .andExpect(jsonPath("$.createdById").doesNotExist());

            verify(stayService).createStay(argThat(StayRequestDTO::isOverrideVaccineConflicts));

        }

        @Test
        void shouldReturnBadRequest_whenPricingDecisionIsMissingOrFractional() throws Exception {
            String baseRequest = """
                    {
                      "startAt": "2026-08-01T12:00:00",
                      "endAt": "2026-08-03T12:00:00",
                      "catIds": ["%s"],
                      "overrideVaccineConflicts": false,
                      %s
                    }
                    """;
            UUID catId = UUID.randomUUID();

            mockMvc.perform(post("/api/stays")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(baseRequest.formatted(
                                    catId,
                                    "\"pricingDecision\": null"
                            )))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.pricingDecision")
                            .value("pricingDecision is required"));

            mockMvc.perform(post("/api/stays")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(baseRequest.formatted(
                                    catId,
                                    "\"pricingDecision\": {\"agreedAmount\": 1.5}"
                            )))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath(
                            "$['pricingDecision.agreedAmountSupported']"
                    ).exists());

            verify(stayService, never()).createStay(any(StayRequestDTO.class));
        }

        @Test
        void shouldReturnBadRequest_whenPostStayRequestIsInvalid() throws Exception {

            StayRequestDTO request = StayRequestDTO.builder()
                    .startAt(LocalDateTime.now().plusDays(1))
                    .endAt(LocalDateTime.now().plusDays(2))
                    .catIds(Set.of())
                    .notes("Test stay")
                    .build();

            mockMvc.perform(post("/api/stays")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest());

            verify(stayService, never()).createStay(any(StayRequestDTO.class));

        }

        @Test
        void shouldReturnBadRequest_whenServiceThrowsBadRequestException() throws Exception {

            StayRequestDTO request = StayRequestDTO.builder()
                    .startAt(LocalDateTime.now().plusDays(10))
                    .endAt(LocalDateTime.now().plusDays(2))
                    .catIds(Set.of(UUID.randomUUID()))
                    .notes("Test stay")
                    .pricingDecision(PricingDecisionRequestDTO.builder()
                            .agreedAmount(new BigDecimal("100"))
                            .build())
                    .build();

            when(stayService.createStay(any(StayRequestDTO.class))).thenThrow(new BadRequestException("Bad Request"));

            mockMvc.perform(post("/api/stays")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest());

            verify(stayService).createStay(any(StayRequestDTO.class));

        }

        @Test
        void shouldReturnStructuredVaccineConflict() throws Exception {

            UUID catId = UUID.randomUUID();
            LocalDate vaccinatedOn = LocalDate.of(2025, 8, 5);
            LocalDate expiresOn = LocalDate.of(2026, 8, 5);
            StayRequestDTO request = StayRequestDTO.builder()
                    .startAt(LocalDateTime.of(2026, 8, 1, 12, 0))
                    .endAt(LocalDateTime.of(2026, 8, 5, 12, 0))
                    .catIds(Set.of(catId))
                    .pricingDecision(PricingDecisionRequestDTO.builder()
                            .agreedAmount(new BigDecimal("100"))
                            .build())
                    .build();
            VaccineConflictViolationDTO violation = VaccineConflictViolationDTO.builder()
                    .catId(catId)
                    .catName("Milo")
                    .vaccineType(VaccineType.RABIES)
                    .reason(VaccineConflictReason.EXPIRED)
                    .vaccinatedOn(vaccinatedOn)
                    .expiresOn(expiresOn)
                    .build();
            VaccineConflictViolationDTO missingViolation = VaccineConflictViolationDTO.builder()
                    .catId(catId)
                    .catName("Milo")
                    .vaccineType(VaccineType.TRIPLE_FELINE)
                    .reason(VaccineConflictReason.MISSING)
                    .build();

            when(stayService.createStay(any(StayRequestDTO.class)))
                    .thenThrow(new VaccineConflictException(List.of(violation, missingViolation)));

            mockMvc.perform(post("/api/stays")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isConflict())
                    .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                    .andExpect(jsonPath("$.code").value("VACCINE_VALIDITY_CONFLICT"))
                    .andExpect(jsonPath("$.violations.length()").value(2))
                    .andExpect(jsonPath("$.violations[0].catId").value(catId.toString()))
                    .andExpect(jsonPath("$.violations[0].catName").value("Milo"))
                    .andExpect(jsonPath("$.violations[0].vaccineType").value("RABIES"))
                    .andExpect(jsonPath("$.violations[0].reason").value("EXPIRED"))
                    .andExpect(jsonPath("$.violations[0].vaccinatedOn").value("2025-08-05"))
                    .andExpect(jsonPath("$.violations[0].expiresOn").value("2026-08-05"))
                    .andExpect(jsonPath("$.violations[1].catId").value(catId.toString()))
                    .andExpect(jsonPath("$.violations[1].catName").value("Milo"))
                    .andExpect(jsonPath("$.violations[1].vaccineType").value("TRIPLE_FELINE"))
                    .andExpect(jsonPath("$.violations[1].reason").value("MISSING"))
                    .andExpect(jsonPath("$.violations[1].vaccinatedOn").hasJsonPath())
                    .andExpect(jsonPath("$.violations[1].vaccinatedOn").value(nullValue()))
                    .andExpect(jsonPath("$.violations[1].expiresOn").hasJsonPath())
                    .andExpect(jsonPath("$.violations[1].expiresOn").value(nullValue()));

        }

    }

    @Nested
    class PutStayTests {

        @Test
        void shouldReturnOk_whenPutStayRequestIsValid() throws Exception {

            UUID stayId = UUID.randomUUID();

            StayUpdateDTO request = StayUpdateDTO.builder()
                    .startAt(LocalDateTime.now().plusDays(1))
                    .endAt(LocalDateTime.now().plusDays(2))
                    .notes("Test stay")
                    .overrideVaccineConflicts(true)
                    .pricingDecision(PricingDecisionRequestDTO.builder()
                            .agreedAmount(new BigDecimal("100"))
                            .reason("Changed duration")
                            .build())
                    .build();

            when(stayService.updateStay(eq(stayId), any(StayUpdateDTO.class))).thenReturn(StayResponseDTO.builder().stayId(stayId).build());

            mockMvc.perform(put("/api/stays/{id}", stayId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.stayId").value(stayId.toString()));

            verify(stayService).updateStay(
                    eq(stayId),
                    argThat(actual -> actual.isOverrideVaccineConflicts()
                            && actual.getPricingDecision() != null
                            && actual.getPricingDecision().getAgreedAmount()
                            .compareTo(new BigDecimal("100")) == 0));

        }

        @Test
        void shouldReturnForbidden_whenServiceDeniesStaffNightCountChange() throws Exception {
            UUID stayId = UUID.randomUUID();
            StayUpdateDTO request = StayUpdateDTO.builder()
                    .startAt(LocalDateTime.of(2026, 8, 1, 12, 0))
                    .endAt(LocalDateTime.of(2026, 8, 4, 12, 0))
                    .pricingDecision(PricingDecisionRequestDTO.builder()
                            .agreedAmount(new BigDecimal("100"))
                            .build())
                    .build();

            when(stayService.updateStay(eq(stayId), any(StayUpdateDTO.class)))
                    .thenThrow(new ForbiddenException(
                            "Only administrators can change a stay's number of nights"
                    ));

            mockMvc.perform(put("/api/stays/{id}", stayId)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isForbidden());
        }

        @Test
        void shouldReturnBadRequest_whenPutStayRequestIsInvalid() throws Exception {

            UUID stayId = UUID.randomUUID();

            StayUpdateDTO request = StayUpdateDTO.builder()
                    .startAt(null)
                    .endAt(LocalDateTime.now().plusDays(2))
                    .notes("Test stay")
                    .build();

            mockMvc.perform(put("/api/stays/{id}", stayId)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest());

            verify(stayService, never()).updateStay(eq(stayId), any(StayUpdateDTO.class));

        }

        @Test
        void shouldReturnConflict_whenServiceThrowsConflictException() throws Exception {

            UUID stayId = UUID.randomUUID();

            StayUpdateDTO request = StayUpdateDTO.builder()
                    .startAt(LocalDateTime.now().plusDays(1))
                    .endAt(LocalDateTime.now().plusDays(2))
                    .notes("Test stay")
                    .build();

            when(stayService.updateStay(eq(stayId), any(StayUpdateDTO.class))).thenThrow(new ConflictException("Conflict"));

            mockMvc.perform(put("/api/stays/{id}", stayId)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isConflict())
                    .andExpect(content().string("Conflict"));

            verify(stayService).updateStay(eq(stayId), any(StayUpdateDTO.class));

        }

    }

    @Nested
    class PatchStayTests {

        @Test
        void shouldReturnOk_whenCorrectingAgreedAmount() throws Exception {
            UUID stayId = UUID.randomUUID();
            PricingDecisionRequestDTO request = PricingDecisionRequestDTO.builder()
                    .agreedAmount(new BigDecimal("25"))
                    .reason("Administrative correction")
                    .build();
            when(stayService.correctAgreedAmount(
                    eq(stayId),
                    any(PricingDecisionRequestDTO.class)))
                    .thenReturn(StayResponseDTO.builder()
                            .stayId(stayId)
                            .agreedAmount(new BigDecimal("25"))
                            .build());

            mockMvc.perform(patch("/api/stays/{id}/agreed-amount", stayId)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.stayId").value(stayId.toString()))
                    .andExpect(jsonPath("$.agreedAmount").value(25));

            verify(stayService).correctAgreedAmount(
                    eq(stayId),
                    argThat(actual -> actual.getAgreedAmount()
                            .compareTo(new BigDecimal("25")) == 0
                            && "Administrative correction"
                            .equals(actual.getReason()))
            );
        }

        @Test
        void shouldReturnOk_whenNumericCorrectionIsNoOpWithoutReason()
                throws Exception {
            UUID stayId = UUID.randomUUID();
            when(stayService.correctAgreedAmount(
                    eq(stayId),
                    any(PricingDecisionRequestDTO.class)))
                    .thenReturn(StayResponseDTO.builder()
                            .stayId(stayId)
                            .agreedAmount(new BigDecimal("20"))
                            .build());

            mockMvc.perform(patch("/api/stays/{id}/agreed-amount", stayId)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("""
                                    {"agreedAmount": 20.0}
                                    """))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.agreedAmount").value(20));

            verify(stayService).correctAgreedAmount(
                    eq(stayId),
                    argThat(actual -> actual.getReason() == null)
            );
        }

        @Test
        void shouldReturnBadRequest_whenCorrectionAmountIsUnsupported()
                throws Exception {
            UUID stayId = UUID.randomUUID();

            mockMvc.perform(patch("/api/stays/{id}/agreed-amount", stayId)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("""
                                    {"agreedAmount": 1.5, "reason": "Reason"}
                                    """))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.agreedAmountSupported").exists());

            mockMvc.perform(patch("/api/stays/{id}/agreed-amount", stayId)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("""
                                    {
                                      "agreedAmount": 1e2147483647,
                                      "reason": "Reason"
                                    }
                                    """))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.agreedAmountSupported").exists());

            verify(stayService, never()).correctAgreedAmount(
                    eq(stayId),
                    any(PricingDecisionRequestDTO.class)
            );
        }

        @Test
        void shouldReturnForbidden_whenServiceDeniesStaffCorrection()
                throws Exception {
            UUID stayId = UUID.randomUUID();
            when(stayService.correctAgreedAmount(
                    eq(stayId),
                    any(PricingDecisionRequestDTO.class)))
                    .thenThrow(new ForbiddenException(
                            "Only administrators can correct a stay's agreed amount"
                    ));

            mockMvc.perform(patch("/api/stays/{id}/agreed-amount", stayId)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("""
                                    {
                                      "agreedAmount": 25,
                                      "reason": "Administrative correction"
                                    }
                                    """))
                    .andExpect(status().isForbidden());
        }

        @Test
        void shouldReturnNoContent_whenCancellingStay() throws Exception {

            UUID stayId = UUID.randomUUID();

            mockMvc.perform(patch("/api/stays/{id}/cancel", stayId))
                    .andExpect(status().isNoContent());

            verify(stayService).cancelStay(stayId);

        }

    }

    @Nested
    class StayPaymentContractTests {

        @Test
        void registrationReturnsOperationalHistoryAndDerivedEconomicsWithoutAuditDetails()
                throws Exception {
            UUID stayId = UUID.randomUUID();
            UUID paymentId = UUID.randomUUID();
            Instant registeredAt = Instant.parse("2026-07-30T12:00:00Z");
            when(stayService.registerPayment(eq(stayId), any())).thenReturn(
                    StayResponseDTO.builder()
                            .stayId(stayId)
                            .agreedAmount(new BigDecimal("100"))
                            .totalPaid(new BigDecimal("30"))
                            .remainingAmount(new BigDecimal("70"))
                            .paymentCondition(PaymentCondition.PARTIAL_PAYMENT)
                            .outstandingCollectionEligible(true)
                            .payments(List.of(StayPaymentResponseDTO.builder()
                                    .paymentId(paymentId)
                                    .amount(new BigDecimal("30"))
                                    .paymentDate(LocalDate.of(2026, 7, 30))
                                    .note("Card")
                                    .state(PaymentState.ACTIVE)
                                    .registeredByUsername("admin")
                                    .registeredAt(registeredAt)
                                    .build()))
                            .build()
            );

            mockMvc.perform(post("/api/stays/{stayId}/payments", stayId)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("""
                                    {
                                      "amount": 30,
                                      "paymentDate": "2026-07-30",
                                      "note": "Card"
                                    }
                                    """))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.totalPaid").value(30))
                    .andExpect(jsonPath("$.remainingAmount").value(70))
                    .andExpect(jsonPath("$.paymentCondition")
                            .value("PARTIAL_PAYMENT"))
                    .andExpect(jsonPath("$.outstandingCollectionEligible")
                            .value(true))
                    .andExpect(jsonPath("$.payments[0].paymentId")
                            .value(paymentId.toString()))
                    .andExpect(jsonPath("$.payments[0].state").value("ACTIVE"))
                    .andExpect(jsonPath("$.payments[0].registeredByUsername")
                            .value("admin"))
                    .andExpect(jsonPath("$.payments[0].registeredAt")
                            .value(registeredAt.toString()))
                    .andExpect(jsonPath("$.payments[0].reason").doesNotExist())
                    .andExpect(jsonPath("$.payments[0].editedBy").doesNotExist())
                    .andExpect(jsonPath("$.payments[0].annulledBy").doesNotExist())
                    .andExpect(jsonPath("$.payments[0].previousAmount")
                            .doesNotExist());
        }

        @Test
        void registrationRejectsInvalidIntegerInputsBeforeServiceDelegation()
                throws Exception {
            UUID stayId = UUID.randomUUID();
            for (String amount : List.of(
                    "0",
                    "-1",
                    "1.5",
                    "10000000000000000000",
                    "\"malformed\"")) {
                mockMvc.perform(post("/api/stays/{stayId}/payments", stayId)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("""
                                        {
                                          "amount": %s,
                                          "paymentDate": "2026-07-30"
                                        }
                                        """.formatted(amount)))
                        .andExpect(status().isBadRequest());
            }

            verify(stayService, never()).registerPayment(eq(stayId), any());
        }

        @Test
        void editAndAnnulRoutesValidateAndDelegateFocusedRequests()
                throws Exception {
            UUID stayId = UUID.randomUUID();
            UUID paymentId = UUID.randomUUID();
            when(stayService.editPayment(eq(stayId), eq(paymentId), any()))
                    .thenReturn(StayResponseDTO.builder().stayId(stayId).build());
            when(stayService.annulPayment(eq(stayId), eq(paymentId), any()))
                    .thenReturn(StayResponseDTO.builder().stayId(stayId).build());

            mockMvc.perform(patch(
                            "/api/stays/{stayId}/payments/{paymentId}",
                            stayId,
                            paymentId)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("""
                                    {"amount": 25, "reason": "Correct entry"}
                                    """))
                    .andExpect(status().isOk());
            mockMvc.perform(patch(
                            "/api/stays/{stayId}/payments/{paymentId}/annul",
                            stayId,
                            paymentId)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("""
                                    {"reason": "Entered twice"}
                                    """))
                    .andExpect(status().isOk());
            mockMvc.perform(patch(
                            "/api/stays/{stayId}/payments/{paymentId}",
                            stayId,
                            paymentId)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("""
                                    {"amount": 25, "reason": "   "}
                                    """))
                    .andExpect(status().isBadRequest());
            mockMvc.perform(patch(
                            "/api/stays/{stayId}/payments/{paymentId}/annul",
                            stayId,
                            paymentId)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("""
                                    {"reason": "   "}
                                    """))
                    .andExpect(status().isBadRequest());

            verify(stayService).editPayment(eq(stayId), eq(paymentId), any());
            verify(stayService).annulPayment(eq(stayId), eq(paymentId), any());
        }

        @Test
        void paymentRoutesMapServiceForbiddenAndConflictResults()
                throws Exception {
            UUID stayId = UUID.randomUUID();
            UUID paymentId = UUID.randomUUID();
            when(stayService.registerPayment(eq(stayId), any()))
                    .thenThrow(new ForbiddenException("Forbidden"));
            when(stayService.editPayment(eq(stayId), eq(paymentId), any()))
                    .thenThrow(new ConflictException("Immutable"));

            mockMvc.perform(post("/api/stays/{stayId}/payments", stayId)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("""
                                    {
                                      "amount": 10,
                                      "paymentDate": "2026-07-30"
                                    }
                                    """))
                    .andExpect(status().isForbidden());
            mockMvc.perform(patch(
                            "/api/stays/{stayId}/payments/{paymentId}",
                            stayId,
                            paymentId)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("""
                                    {"amount": 20, "reason": "Correction"}
                                    """))
                    .andExpect(status().isConflict());
        }
    }

    @Nested
    class DeleteStayTests {

        @Test
        void shouldReturnNoContent_whenDeletingStay() throws Exception {

            UUID stayId = UUID.randomUUID();

            mockMvc.perform(delete("/api/stays/{id}", stayId))
                    .andExpect(status().isNoContent());

            verify(stayService).deleteStay(stayId);

        }

        @Test
        void shouldReturnNotFound_whenDeleteServiceThrowsNotFoundException() throws Exception {

            UUID stayId = UUID.randomUUID();

            doThrow(new ResourceNotFoundException("Stay", stayId)).when(stayService).deleteStay(stayId);

            mockMvc.perform(delete("/api/stays/{id}", stayId))
                    .andExpect(status().isNotFound());

            verify(stayService).deleteStay(stayId);

        }

        @Test
        void shouldReturnForbidden_whenDeleteServiceThrowsForbiddenException() throws Exception {

            UUID stayId = UUID.randomUUID();

            doThrow(new ForbiddenException("Forbidden")).when(stayService).deleteStay(stayId);

            mockMvc.perform(delete("/api/stays/{id}", stayId))
                    .andExpect(status().isForbidden());

            verify(stayService).deleteStay(stayId);

        }

        @Test
        void shouldReturnConflict_whenDeleteServiceThrowsConflictException() throws Exception {

            UUID stayId = UUID.randomUUID();

            doThrow(new ConflictException("Conflict")).when(stayService).deleteStay(stayId);

            mockMvc.perform(delete("/api/stays/{id}", stayId))
                    .andExpect(status().isConflict());

            verify(stayService).deleteStay(stayId);

        }

    }



}
