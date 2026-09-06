package com.allegaeon.catworld.controller;

import com.allegaeon.catworld.dto.StayResponseDTO;
import com.allegaeon.catworld.service.IStayService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(properties = {
        "catworld.security.username=test-admin",
        "catworld.security.password=test-password",
        "catworld.security.cors-allowed-origins=http://localhost:4200"
})
@AutoConfigureMockMvc
@ActiveProfiles("test")
class StayControllerSecurityTest {

    private static final String CREATE_REQUEST = """
            {
              "startAt": "2026-08-01T12:00:00",
              "endAt": "2026-08-03T12:00:00",
              "catIds": ["00000000-0000-0000-0000-000000000001"],
              "overrideVaccineConflicts": false,
              "pricingDecision": {"agreedAmount": 20},
              "confirmation": {
                "numberOfNights": 2,
                "retainedNightlyRate": "10",
                "suggestedAmount": "20"
              }
            }
            """;

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private IStayService stayService;

    @Test
    void stayLookupsPreserveAuthenticatedReadAccess() throws Exception {
        UUID id = UUID.randomUUID();
        var item = new com.allegaeon.catworld.dto.lookup.StayLookupItem(id,
                java.time.LocalDateTime.parse("2026-08-10T10:00:00"), java.time.LocalDateTime.parse("2026-08-12T10:00:00"),
                new com.allegaeon.catworld.dto.lookup.StayLookupItem.Owner(UUID.randomUUID(), "Owner"), java.util.List.of());
        when(stayService.searchStays(null, null, java.time.LocalDate.parse("2026-08-10"), null, 0))
                .thenReturn(new com.allegaeon.catworld.dto.lookup.LookupPage<>(java.util.List.of(item), 0, 5, 1));
        when(stayService.getStayLookup(id)).thenReturn(item);
        mockMvc.perform(get("/api/stays/search?from=2026-08-10")).andExpect(status().isUnauthorized());
        mockMvc.perform(get("/api/stays/" + id + "/lookup")).andExpect(status().isUnauthorized());
        for (String role : new String[]{"ADMIN", "STAFF"}) {
            mockMvc.perform(get("/api/stays/search?from=2026-08-10").with(user("reader").roles(role)))
                    .andExpect(status().isOk()).andExpect(jsonPath("$.pageSize").value(5))
                    .andExpect(jsonPath("$.items[0].stayId").value(id.toString()))
                    .andExpect(jsonPath("$.items[0].owner.fullName").value("Owner"))
                    .andExpect(jsonPath("$.items[0].agreedAmount").doesNotExist());
            mockMvc.perform(get("/api/stays/" + id + "/lookup").with(user("reader").roles(role)))
                    .andExpect(status().isOk()).andExpect(jsonPath("$.stayId").value(id.toString()));
        }
    }

    @Test
    void adminAndStaffCanReachAuthenticatedCreationContract() throws Exception {
        when(stayService.createStay(any())).thenReturn(
                StayResponseDTO.builder().stayId(UUID.randomUUID()).build()
        );

        mockMvc.perform(post("/api/stays")
                        .with(user("admin").roles("ADMIN"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(CREATE_REQUEST))
                .andExpect(status().isCreated());

        mockMvc.perform(post("/api/stays")
                        .with(user("staff").roles("STAFF"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(CREATE_REQUEST))
                .andExpect(status().isCreated());
    }

    @Test
    void adminAndStaffCanReachCreationPricingPreviewContract() throws Exception {
        String previewRequest = """
                {
                  "startAt": "2027-08-01T12:00:00",
                  "endAt": "2027-08-03T12:00:00",
                  "catIds": ["00000000-0000-0000-0000-000000000001"]
                }
                """;

        mockMvc.perform(post("/api/stays/pricing-preview")
                        .with(user("admin").roles("ADMIN"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(previewRequest))
                .andExpect(status().isOk());
        mockMvc.perform(post("/api/stays/pricing-preview")
                        .with(user("staff").roles("STAFF"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(previewRequest))
                .andExpect(status().isOk());
    }

    @Test
    void bothRolesReachUpdateBecauseNightChangeAuthorizationIsServiceContextual()
            throws Exception {
        UUID stayId = UUID.randomUUID();
        when(stayService.updateStay(any(), any())).thenReturn(
                StayResponseDTO.builder().stayId(stayId).build()
        );
        String updateRequest = """
                {
                  "startAt": "2026-08-01T12:00:00",
                  "endAt": "2026-08-03T12:00:00",
                  "overrideVaccineConflicts": false
                }
                """;

        mockMvc.perform(put("/api/stays/{id}", stayId)
                        .with(user("admin").roles("ADMIN"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(updateRequest))
                .andExpect(status().isOk());

        mockMvc.perform(put("/api/stays/{id}", stayId)
                        .with(user("staff").roles("STAFF"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(updateRequest))
                .andExpect(status().isOk());
    }

    @Test
    void bothRolesReachCorrectionBecausePersistedAuthorizationIsServiceContextual()
            throws Exception {
        UUID stayId = UUID.randomUUID();
        when(stayService.correctAgreedAmount(any(), any())).thenReturn(
                StayResponseDTO.builder().stayId(stayId).build()
        );
        String correctionRequest = """
                {
                  "agreedAmount": 25,
                  "reason": "Administrative correction"
                }
                """;

        mockMvc.perform(patch("/api/stays/{id}/agreed-amount", stayId)
                        .with(user("admin").roles("ADMIN"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(correctionRequest))
                .andExpect(status().isOk());

        mockMvc.perform(patch("/api/stays/{id}/agreed-amount", stayId)
                        .with(user("staff").roles("STAFF"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(correctionRequest))
                .andExpect(status().isOk());
    }

    @Test
    void anonymousCreationAndUpdateReceiveAuthenticationChallenge() throws Exception {
        UUID stayId = UUID.randomUUID();

        mockMvc.perform(post("/api/stays")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(CREATE_REQUEST))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").value("Unauthorized"));

        mockMvc.perform(put("/api/stays/{id}", stayId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "startAt": "2026-08-01T12:00:00",
                                  "endAt": "2026-08-03T12:00:00",
                                  "overrideVaccineConflicts": false
                                }
                                """))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").value("Unauthorized"));

        mockMvc.perform(patch("/api/stays/{id}/agreed-amount", stayId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "agreedAmount": 25,
                                  "reason": "Administrative correction"
                                }
                                """))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").value("Unauthorized"));

        verify(stayService, never()).createStay(any());
        verify(stayService, never()).updateStay(any(), any());
        verify(stayService, never()).correctAgreedAmount(any(), any());
    }

    @Test
    void bothRolesReachPaymentReadsAndMutationsForContextualServicePolicy()
            throws Exception {
        UUID stayId = UUID.randomUUID();
        when(stayService.getStay(stayId)).thenReturn(
                StayResponseDTO.builder().stayId(stayId).build()
        );
        when(stayService.registerPayment(any(), any())).thenReturn(
                StayResponseDTO.builder().stayId(stayId).build()
        );
        String paymentRequest = """
                {"amount": 10, "paymentDate": "2026-07-30"}
                """;

        for (String role : new String[]{"ADMIN", "STAFF"}) {
            mockMvc.perform(get("/api/stays/{id}", stayId)
                            .with(user(role.toLowerCase()).roles(role)))
                    .andExpect(status().isOk());
            mockMvc.perform(post("/api/stays/{stayId}/payments", stayId)
                            .with(user(role.toLowerCase()).roles(role))
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(paymentRequest))
                    .andExpect(status().isCreated());
        }
    }

    @Test
    void anonymousPaymentReadAndMutationReceiveAuthenticationChallenge()
            throws Exception {
        UUID stayId = UUID.randomUUID();

        mockMvc.perform(get("/api/stays/{id}", stayId))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").value("Unauthorized"));
        mockMvc.perform(post("/api/stays/{stayId}/payments", stayId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"amount": 10, "paymentDate": "2026-07-30"}
                                """))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").value("Unauthorized"));

        verify(stayService, never()).getStay(any());
        verify(stayService, never()).registerPayment(any(), any());
    }

    @Test
    void permanentPaymentRemovalRouteRequiresAdministratorRole() throws Exception {
        UUID stayId = UUID.randomUUID();
        UUID paymentId = UUID.randomUUID();
        when(stayService.removePayment(any(), any(), any())).thenReturn(
                StayResponseDTO.builder().stayId(stayId).build());

        mockMvc.perform(delete("/api/stays/{stayId}/payments/{paymentId}",
                        stayId, paymentId)
                        .with(user("admin").roles("ADMIN"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"reason\":\"Duplicate\"}"))
                .andExpect(status().isOk());
        mockMvc.perform(delete("/api/stays/{stayId}/payments/{paymentId}",
                        stayId, paymentId)
                        .with(user("staff").roles("STAFF"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"reason\":\"Duplicate\"}"))
                .andExpect(status().isForbidden());
        mockMvc.perform(delete("/api/stays/{stayId}/payments/{paymentId}",
                        stayId, paymentId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"reason\":\"Duplicate\"}"))
                .andExpect(status().isUnauthorized());
    }
}
