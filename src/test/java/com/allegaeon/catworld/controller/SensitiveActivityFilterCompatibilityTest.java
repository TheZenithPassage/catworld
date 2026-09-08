package com.allegaeon.catworld.controller;

import com.allegaeon.catworld.service.SensitiveEconomicActivityService;
import com.allegaeon.catworld.service.SensitiveEconomicActivityAuthorizationPolicy;
import com.allegaeon.catworld.repository.SensitiveEconomicActivityReadRepository;
import com.allegaeon.catworld.mapper.SensitiveEconomicActivityMapper;
import com.allegaeon.catworld.security.CurrentUserAccountService;
import com.allegaeon.catworld.dto.overview.OverviewPage;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import java.util.List;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(SensitiveEconomicActivityController.class)
@Import(SensitiveEconomicActivityService.class)
class SensitiveActivityFilterCompatibilityTest {
    @Autowired MockMvc mvc;
    @MockitoBean SensitiveEconomicActivityReadRepository repository;
    @MockitoBean SensitiveEconomicActivityMapper mapper;
    @MockitoBean CurrentUserAccountService currentUser;
    @MockitoBean SensitiveEconomicActivityAuthorizationPolicy authorization;

    @Test
    void globalEventsRejectEachStayPredicateBeforeQuerying() throws Exception {
        for (String key : List.of("ownerId", "catId", "stayId", "stayFrom", "stayTo")) {
            String value = key.endsWith("Id") ? "11111111-1111-1111-1111-111111111111" : "2026-08-10";
            mvc.perform(get("/api/sensitive-economic-activity").with(user("admin").roles("ADMIN"))
                    .param("eventType", "NIGHTLY_RATE_CHANGED").param(key, value)
                    .param("stayDateMatchMode", "OVERLAPS"))
                    .andExpect(status().isBadRequest());
        }
        verifyNoInteractions(repository);
    }

    @Test
    void globalEventsAllowActorOccurrenceAndNeutralModeAndStayEventsKeepComposition() throws Exception {
        when(repository.findActivity(any(), eq(0))).thenReturn(new OverviewPage<>(List.of(), 0, 0));
        mvc.perform(get("/api/sensitive-economic-activity").with(user("admin").roles("ADMIN"))
                .param("eventType", "NIGHTLY_RATE_CHANGED")
                .param("actorId", "11111111-1111-1111-1111-111111111111")
                .param("occurredFrom", "2026-08-01T10:00:00Z").param("occurredTo", "2026-08-02T10:00:00Z")
                .param("stayDateMatchMode", "STAY_WITHIN_RANGE"))
                .andExpect(status().isOk());
        for (String event : List.of("", "PRICING_OVERRIDE", "AGREED_AMOUNT_CORRECTED", "PAYMENT_EDITED", "PAYMENT_ANNULLED", "PAYMENT_REMOVED")) {
            var request = get("/api/sensitive-economic-activity").with(user("admin").roles("ADMIN"))
                    .param("ownerId", "11111111-1111-1111-1111-111111111111")
                    .param("stayFrom", "2026-08-10").param("stayDateMatchMode", "OVERLAPS");
            if (!event.isEmpty()) request.param("eventType", event);
            mvc.perform(request).andExpect(status().isOk());
        }
        verify(repository, times(7)).findActivity(any(), eq(0));
    }
}
