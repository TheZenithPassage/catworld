package com.allegaeon.catworld.controller;

import com.allegaeon.catworld.service.ISensitiveEconomicActivityService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(properties = {
        "catworld.security.username=test-admin",
        "catworld.security.password=test-password",
        "catworld.security.cors-allowed-origins=http://localhost:4200"
})
@AutoConfigureMockMvc
@ActiveProfiles("test")
class SensitiveEconomicActivityControllerSecurityTest {

    @Autowired MockMvc mockMvc;
    @MockitoBean ISensitiveEconomicActivityService service;

    @Test
    void routeIsReachableOnlyByAdministrators() throws Exception {
        when(service.getActivity(any())).thenReturn(List.of());

        mockMvc.perform(get("/api/sensitive-economic-activity")
                        .with(user("admin").roles("ADMIN")))
                .andExpect(status().isOk());
        mockMvc.perform(get("/api/sensitive-economic-activity")
                        .with(user("staff").roles("STAFF")))
                .andExpect(status().isForbidden());
        mockMvc.perform(get("/api/sensitive-economic-activity"))
                .andExpect(status().isUnauthorized());
    }
}
