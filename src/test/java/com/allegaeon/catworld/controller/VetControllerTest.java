package com.allegaeon.catworld.controller;

import com.allegaeon.catworld.dto.VetRequestDTO;
import com.allegaeon.catworld.dto.VetResponseDTO;
import com.allegaeon.catworld.exception.ResourceNotFoundException;
import com.allegaeon.catworld.service.IVetService;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import tools.jackson.databind.ObjectMapper;

import java.util.List;
import java.util.UUID;

import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(VetController.class)
public class VetControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private IVetService vetService;

    @Nested
    class GetVetTests {

        @Test
        void shouldReturnOk_whenGettingAllVets() throws Exception {
            when(vetService.getAllVets()).thenReturn(List.of());

            mockMvc.perform(get("/api/vets"))
                    .andExpect(status().isOk())
                    .andExpect(content().json("[]"));

            verify(vetService).getAllVets();
        }

        @Test
        void shouldReturnOk_whenGettingVetById() throws Exception {
            UUID vetId = UUID.randomUUID();

            when(vetService.getVet(vetId)).thenReturn(VetResponseDTO.builder()
                    .id(vetId)
                    .name("Vet Clinic")
                    .phoneNumber("123456789")
                    .build());

            mockMvc.perform(get("/api/vets/{id}", vetId))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.id").value(vetId.toString()))
                    .andExpect(jsonPath("$.name").value("Vet Clinic"));

            verify(vetService).getVet(vetId);
        }

        @Test
        void shouldReturnNotFound_whenServiceThrowsNotFoundException() throws Exception {
            UUID vetId = UUID.randomUUID();

            when(vetService.getVet(vetId)).thenThrow(new ResourceNotFoundException("Vet", vetId));

            mockMvc.perform(get("/api/vets/{id}", vetId))
                    .andExpect(status().isNotFound());

            verify(vetService).getVet(vetId);
        }
    }

    @Nested
    class PostVetTests {

        @Test
        void shouldReturnCreated_whenPostVetRequestIsValid() throws Exception {
            UUID vetId = UUID.randomUUID();

            VetRequestDTO request = VetRequestDTO.builder()
                    .name("Vet Clinic")
                    .phoneNumber("123456789")
                    .build();

            when(vetService.createVet(any(VetRequestDTO.class))).thenReturn(VetResponseDTO.builder()
                    .id(vetId)
                    .name("Vet Clinic")
                    .phoneNumber("123456789")
                    .build());

            mockMvc.perform(post("/api/vets")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.id").value(vetId.toString()))
                    .andExpect(jsonPath("$.name").value("Vet Clinic"));

            verify(vetService).createVet(any(VetRequestDTO.class));
        }

        @Test
        void shouldReturnBadRequest_whenPostVetRequestIsInvalid() throws Exception {
            VetRequestDTO request = VetRequestDTO.builder()
                    .name("")
                    .build();

            mockMvc.perform(post("/api/vets")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest());

            verify(vetService, never()).createVet(any(VetRequestDTO.class));
        }
    }

    @Nested
    class PutVetTests {

        @Test
        void shouldReturnOk_whenPutVetRequestIsValid() throws Exception {
            UUID vetId = UUID.randomUUID();

            VetRequestDTO request = VetRequestDTO.builder()
                    .name("Updated Vet Clinic")
                    .phoneNumber("987654321")
                    .build();

            when(vetService.updateVet(eq(vetId), any(VetRequestDTO.class))).thenReturn(VetResponseDTO.builder()
                    .id(vetId)
                    .name("Updated Vet Clinic")
                    .phoneNumber("987654321")
                    .build());

            mockMvc.perform(put("/api/vets/{id}", vetId)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.id").value(vetId.toString()))
                    .andExpect(jsonPath("$.name").value("Updated Vet Clinic"));

            verify(vetService).updateVet(eq(vetId), any(VetRequestDTO.class));
        }

        @Test
        void shouldReturnBadRequest_whenPutVetRequestIsInvalid() throws Exception {
            UUID vetId = UUID.randomUUID();

            VetRequestDTO request = VetRequestDTO.builder()
                    .name("")
                    .build();

            mockMvc.perform(put("/api/vets/{id}", vetId)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest());

            verify(vetService, never()).updateVet(eq(vetId), any(VetRequestDTO.class));
        }
    }

    @Nested
    class DeleteVetTests {

        @Test
        void shouldReturnNoContent_whenDeletingVet() throws Exception {
            UUID vetId = UUID.randomUUID();

            mockMvc.perform(delete("/api/vets/{id}", vetId))
                    .andExpect(status().isNoContent());

            verify(vetService).deleteVet(vetId);
        }
    }
}