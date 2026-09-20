package com.allegaeon.catworld.controller;

import com.allegaeon.catworld.dto.NightlyReferenceRateResponseDTO;
import com.allegaeon.catworld.model.NightlyReferenceRateKey;
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
                response(NightlyReferenceRateKey.ONE_CAT, "12"),
                response(NightlyReferenceRateKey.ONE_CAT_7_TO_14, "11"),
                response(NightlyReferenceRateKey.ONE_CAT_15_TO_29, null),
                response(NightlyReferenceRateKey.ONE_CAT_30_PLUS, null),
                response(NightlyReferenceRateKey.TWO_CATS, null),
                response(NightlyReferenceRateKey.THREE_PLUS_CATS, "30")
        ));

        mockMvc.perform(get("/api/nightly-reference-rates"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(6))
                .andExpect(jsonPath("$[0].key").value("ONE_CAT"))
                .andExpect(jsonPath("$[0].nightlyRate").value("12"))
                .andExpect(jsonPath("$[1].key").value("ONE_CAT_7_TO_14"))
                .andExpect(jsonPath("$[1].nightlyRate").value("11"))
                .andExpect(jsonPath("$[2].key").value("ONE_CAT_15_TO_29"))
                .andExpect(jsonPath("$[2].nightlyRate").value(nullValue()))
                .andExpect(jsonPath("$[3].key").value("ONE_CAT_30_PLUS"))
                .andExpect(jsonPath("$[4].key").value("TWO_CATS"))
                .andExpect(jsonPath("$[5].key").value("THREE_PLUS_CATS"))
                .andExpect(jsonPath("$[5].nightlyRate").value("30"));
    }

    @Test
    void delegatesValidConfigurationAndReturnsSelectedCategory() throws Exception {
        when(nightlyReferenceRateService.configureRate(
                NightlyReferenceRateKey.ONE_CAT_15_TO_29,
                new BigDecimal("21")))
                .thenReturn(response(NightlyReferenceRateKey.ONE_CAT_15_TO_29, "21"));

        mockMvc.perform(put("/api/nightly-reference-rates/ONE_CAT_15_TO_29")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"nightlyRate\":21}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.key").value("ONE_CAT_15_TO_29"))
                .andExpect(jsonPath("$.nightlyRate").value("21"));

        verify(nightlyReferenceRateService).configureRate(
                NightlyReferenceRateKey.ONE_CAT_15_TO_29,
                new BigDecimal("21"));
    }

    @Test
    void acceptsNineteenDigitPositiveWholeNumberBoundary() throws Exception {
        BigDecimal boundary = new BigDecimal("9999999999999999999");
        when(nightlyReferenceRateService.configureRate(NightlyReferenceRateKey.ONE_CAT, boundary))
                .thenReturn(response(NightlyReferenceRateKey.ONE_CAT, "9999999999999999999"));

        mockMvc.perform(put("/api/nightly-reference-rates/ONE_CAT")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"nightlyRate\":9999999999999999999}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.key").value("ONE_CAT"))
                .andExpect(jsonPath("$.nightlyRate").value("9999999999999999999"));

        verify(nightlyReferenceRateService).configureRate(NightlyReferenceRateKey.ONE_CAT, boundary);
    }

    @Test
    void clearsSelectedCategoryWithNoContent() throws Exception {
        mockMvc.perform(delete("/api/nightly-reference-rates/THREE_PLUS_CATS"))
                .andExpect(status().isNoContent())
                .andExpect(content().string(""));

        verify(nightlyReferenceRateService).clearRate(NightlyReferenceRateKey.THREE_PLUS_CATS);
    }

    @Test
    void rejectsZeroNegativeFractionalAndMalformedValuesBeforeServiceDelegation()
            throws Exception {
        mockMvc.perform(put("/api/nightly-reference-rates/ONE_CAT")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"nightlyRate\":0}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.nightlyRate")
                        .value("Nightly rate must be a positive whole number"));

        mockMvc.perform(put("/api/nightly-reference-rates/ONE_CAT")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"nightlyRate\":-1}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.nightlyRate")
                        .value("Nightly rate must be a positive whole number"));

        mockMvc.perform(put("/api/nightly-reference-rates/ONE_CAT")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"nightlyRate\":10.5}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.nightlyRate")
                        .value("Nightly rate must be a positive whole number with at most 19 digits"));

        mockMvc.perform(put("/api/nightly-reference-rates/ONE_CAT")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"nightlyRate\":\"not-a-number\"}"))
                .andExpect(status().isBadRequest());

        verify(nightlyReferenceRateService, never())
                .configureRate(org.mockito.ArgumentMatchers.any(), org.mockito.ArgumentMatchers.any());
    }

    @Test
    void returnsBadRequestForUnknownKey() throws Exception {
        mockMvc.perform(put("/api/nightly-reference-rates/UNKNOWN")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"nightlyRate\":21}"))
                .andExpect(status().isBadRequest());

        verify(nightlyReferenceRateService, never())
                .configureRate(org.mockito.ArgumentMatchers.any(), org.mockito.ArgumentMatchers.any());
    }

    private NightlyReferenceRateResponseDTO response(
            NightlyReferenceRateKey key,
            String rate) {
        return NightlyReferenceRateResponseDTO.builder()
                .key(key)
                .nightlyRate(rate == null ? null : new BigDecimal(rate))
                .build();
    }
}
