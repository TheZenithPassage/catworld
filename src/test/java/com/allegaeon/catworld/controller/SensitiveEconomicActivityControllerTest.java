package com.allegaeon.catworld.controller;

import com.allegaeon.catworld.dto.sensitiveactivity.*;
import com.allegaeon.catworld.service.ISensitiveEconomicActivityService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(SensitiveEconomicActivityController.class)
class SensitiveEconomicActivityControllerTest {

    @Autowired MockMvc mockMvc;
    @MockitoBean ISensitiveEconomicActivityService service;

    @Test
    void bindsFiltersAndReturnsStronglyTypedWholeUnitJson() throws Exception {
        UUID actorId = UUID.randomUUID();
        UUID eventId = UUID.randomUUID();
        Instant occurred = Instant.parse("2026-08-02T12:00:00Z");
        when(service.getActivity(any())).thenReturn(List.of(
                new NightlyRateChangedActivityDTO(
                        eventId,
                        SensitiveEconomicEventType.NIGHTLY_RATE_CHANGED,
                        occurred,
                        new SensitiveActorDTO(actorId, "admin"),
                        null,
                        com.allegaeon.catworld.model.NightlyReferenceRateCategory.ONE_CAT,
                        new BigDecimal("9999999999999999998"),
                        new BigDecimal("9999999999999999999"))));

        mockMvc.perform(get("/api/sensitive-economic-activity")
                        .param("actorId", actorId.toString())
                        .param("occurredFrom", "2026-08-01T00:00:00Z")
                        .param("occurredTo", "2026-08-03T00:00:00Z")
                        .param("eventType", "NIGHTLY_RATE_CHANGED"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].eventId").value(eventId.toString()))
                .andExpect(jsonPath("$[0].eventType")
                        .value("NIGHTLY_RATE_CHANGED"))
                .andExpect(jsonPath("$[0].actor.id").value(actorId.toString()))
                .andExpect(jsonPath("$[0].previousRate")
                        .value("9999999999999999998"))
                .andExpect(jsonPath("$[0].newRate")
                        .value("9999999999999999999"));

        verify(service).getActivity(new SensitiveEconomicActivityFilter(
                actorId,
                Instant.parse("2026-08-01T00:00:00Z"),
                Instant.parse("2026-08-03T00:00:00Z"),
                SensitiveEconomicEventType.NIGHTLY_RATE_CHANGED,
                null, null, null));
    }

    @Test
    void malformedFilterReturnsBadRequestWithoutCallingService() throws Exception {
        mockMvc.perform(get("/api/sensitive-economic-activity")
                        .param("eventType", "NOT_AN_EVENT"))
                .andExpect(status().isBadRequest());
    }
}
