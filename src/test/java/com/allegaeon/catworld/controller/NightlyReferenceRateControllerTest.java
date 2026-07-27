package com.allegaeon.catworld.controller;

import com.allegaeon.catworld.dto.NightlyReferenceRateResponseDTO;
import com.allegaeon.catworld.exception.BadRequestException;
import com.allegaeon.catworld.service.INightlyReferenceRateService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.util.List;

import static org.hamcrest.Matchers.nullValue;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(NightlyReferenceRateController.class)
class NightlyReferenceRateControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private INightlyReferenceRateService nightlyReferenceRateService;

    @Test
    void returnsConfiguredAndUnavailableCurrentShapes() throws Exception {
        when(nightlyReferenceRateService.getCurrentRates()).thenReturn(List.of(
                response(1, "12.5000"),
                response(2, null),
                response(3, "30.0000")
        ));

        mockMvc.perform(get("/api/nightly-reference-rates"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(3))
                .andExpect(jsonPath("$[0].catCount").value(1))
                .andExpect(jsonPath("$[0].nightlyRate").value(12.5))
                .andExpect(jsonPath("$[1].catCount").value(2))
                .andExpect(jsonPath("$[1].nightlyRate").value(nullValue()))
                .andExpect(jsonPath("$[2].catCount").value(3))
                .andExpect(jsonPath("$[2].nightlyRate").value(30.0));
    }

    @Test
    void delegatesValidConfigurationAndReturnsSelectedCategory() throws Exception {
        when(nightlyReferenceRateService.configureRate(2, new BigDecimal("21.1250")))
                .thenReturn(response(2, "21.1250"));

        mockMvc.perform(put("/api/nightly-reference-rates/2")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"nightlyRate\":21.1250}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.catCount").value(2))
                .andExpect(jsonPath("$.nightlyRate").value(21.125));

        verify(nightlyReferenceRateService).configureRate(2, new BigDecimal("21.1250"));
    }

    @Test
    void clearsSelectedCategoryWithNoContent() throws Exception {
        mockMvc.perform(delete("/api/nightly-reference-rates/3"))
                .andExpect(status().isNoContent())
                .andExpect(content().string(""));

        verify(nightlyReferenceRateService).clearRate(3);
    }

    @Test
    void rejectsZeroAndMalformedValuesBeforeServiceDelegation() throws Exception {
        mockMvc.perform(put("/api/nightly-reference-rates/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"nightlyRate\":0}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.nightlyRate")
                        .value("Nightly rate must be greater than zero"));

        mockMvc.perform(put("/api/nightly-reference-rates/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"nightlyRate\":\"not-a-number\"}"))
                .andExpect(status().isBadRequest());

        verify(nightlyReferenceRateService, never())
                .configureRate(org.mockito.ArgumentMatchers.anyInt(), org.mockito.ArgumentMatchers.any());
    }

    @Test
    void returnsBadRequestForUnsupportedCategory() throws Exception {
        doThrow(new BadRequestException("Nightly reference-rate cat count must be 1, 2, or 3"))
                .when(nightlyReferenceRateService)
                .configureRate(4, new BigDecimal("10.0000"));

        mockMvc.perform(put("/api/nightly-reference-rates/4")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"nightlyRate\":10.0000}"))
                .andExpect(status().isBadRequest())
                .andExpect(content().string(
                        "Nightly reference-rate cat count must be 1, 2, or 3"
                ));
    }

    private NightlyReferenceRateResponseDTO response(int catCount, String rate) {
        return NightlyReferenceRateResponseDTO.builder()
                .catCount(catCount)
                .nightlyRate(rate == null ? null : new BigDecimal(rate))
                .build();
    }
}
