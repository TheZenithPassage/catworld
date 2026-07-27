package com.allegaeon.catworld.controller;

import com.allegaeon.catworld.dto.NightlyReferenceRateResponseDTO;
import com.allegaeon.catworld.service.INightlyReferenceRateService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.util.List;

import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(properties = {
        "catworld.security.username=test-admin",
        "catworld.security.password=test-password",
        "catworld.security.cors-allowed-origins=http://localhost:4200"
})
@AutoConfigureMockMvc
@ActiveProfiles("test")
class NightlyReferenceRateControllerSecurityTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private INightlyReferenceRateService nightlyReferenceRateService;

    @Test
    void adminAndStaffCanReadCurrentRates() throws Exception {
        when(nightlyReferenceRateService.getCurrentRates()).thenReturn(List.of(
                response(1), response(2), response(3)
        ));

        mockMvc.perform(get("/api/nightly-reference-rates")
                        .with(user("admin").roles("ADMIN")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(3));

        mockMvc.perform(get("/api/nightly-reference-rates")
                        .with(user("staff").roles("STAFF")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(3));
    }

    @Test
    void adminCanMutateAndStaffIsDenied() throws Exception {
        when(nightlyReferenceRateService.configureRate(1, new BigDecimal("12.5000")))
                .thenReturn(response(1));

        mockMvc.perform(put("/api/nightly-reference-rates/1")
                        .with(user("admin").roles("ADMIN"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"nightlyRate\":12.5000}"))
                .andExpect(status().isOk());

        mockMvc.perform(put("/api/nightly-reference-rates/1")
                        .with(user("staff").roles("STAFF"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"nightlyRate\":12.5000}"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error").value("Forbidden"));

        verify(nightlyReferenceRateService).configureRate(1, new BigDecimal("12.5000"));
    }

    @Test
    void anonymousReadAndMutationReceiveAuthenticationChallenge() throws Exception {
        mockMvc.perform(get("/api/nightly-reference-rates"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").value("Unauthorized"));

        mockMvc.perform(put("/api/nightly-reference-rates/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"nightlyRate\":12.5000}"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").value("Unauthorized"));

        verify(nightlyReferenceRateService, never())
                .configureRate(org.mockito.ArgumentMatchers.anyInt(), org.mockito.ArgumentMatchers.any());
    }

    private NightlyReferenceRateResponseDTO response(int catCount) {
        return NightlyReferenceRateResponseDTO.builder()
                .catCount(catCount)
                .nightlyRate(new BigDecimal(catCount * 10 + ".0000"))
                .build();
    }
}
