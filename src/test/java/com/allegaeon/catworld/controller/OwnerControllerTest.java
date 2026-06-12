package com.allegaeon.catworld.controller;

import com.allegaeon.catworld.dto.OwnerRequestDTO;
import com.allegaeon.catworld.dto.OwnerResponseDTO;
import com.allegaeon.catworld.exception.ResourceNotFoundException;
import com.allegaeon.catworld.service.IOwnerService;
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

@WebMvcTest(OwnerController.class)
public class OwnerControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private IOwnerService ownerService;

    @Nested
    class GetOwnerTests {

        @Test
        void shouldReturnOk_whenGettingAllOwners() throws Exception {
            when(ownerService.getAllOwners()).thenReturn(List.of());

            mockMvc.perform(get("/api/owners"))
                    .andExpect(status().isOk())
                    .andExpect(content().json("[]"));

            verify(ownerService).getAllOwners();
        }

        @Test
        void shouldReturnOk_whenGettingOwnerById() throws Exception {
            UUID ownerId = UUID.randomUUID();

            when(ownerService.getOwner(ownerId)).thenReturn(OwnerResponseDTO.builder()
                    .id(ownerId)
                    .fullName("John Owner")
                    .primaryPhone("123456789")
                    .build());

            mockMvc.perform(get("/api/owners/{id}", ownerId))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.id").value(ownerId.toString()))
                    .andExpect(jsonPath("$.fullName").value("John Owner"));

            verify(ownerService).getOwner(ownerId);
        }

        @Test
        void shouldReturnNotFound_whenServiceThrowsNotFoundException() throws Exception {
            UUID ownerId = UUID.randomUUID();

            when(ownerService.getOwner(ownerId)).thenThrow(new ResourceNotFoundException("Owner", ownerId));

            mockMvc.perform(get("/api/owners/{id}", ownerId))
                    .andExpect(status().isNotFound());

            verify(ownerService).getOwner(ownerId);
        }
    }

    @Nested
    class PostOwnerTests {

        @Test
        void shouldReturnCreated_whenPostOwnerRequestIsValid() throws Exception {
            UUID ownerId = UUID.randomUUID();

            OwnerRequestDTO request = OwnerRequestDTO.builder()
                    .fullName("John Owner")
                    .primaryPhone("123456789")
                    .build();

            when(ownerService.createOwner(any(OwnerRequestDTO.class))).thenReturn(OwnerResponseDTO.builder()
                    .id(ownerId)
                    .fullName("John Owner")
                    .primaryPhone("123456789")
                    .build());

            mockMvc.perform(post("/api/owners")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.id").value(ownerId.toString()))
                    .andExpect(jsonPath("$.fullName").value("John Owner"));

            verify(ownerService).createOwner(any(OwnerRequestDTO.class));
        }

        @Test
        void shouldReturnBadRequest_whenPostOwnerRequestIsInvalid() throws Exception {
            OwnerRequestDTO request = OwnerRequestDTO.builder()
                    .fullName("")
                    .primaryPhone("")
                    .build();

            mockMvc.perform(post("/api/owners")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest());

            verify(ownerService, never()).createOwner(any(OwnerRequestDTO.class));
        }
    }

    @Nested
    class PutOwnerTests {

        @Test
        void shouldReturnOk_whenPutOwnerRequestIsValid() throws Exception {
            UUID ownerId = UUID.randomUUID();

            OwnerRequestDTO request = OwnerRequestDTO.builder()
                    .fullName("Updated Owner")
                    .primaryPhone("987654321")
                    .build();

            when(ownerService.updateOwner(eq(ownerId), any(OwnerRequestDTO.class))).thenReturn(OwnerResponseDTO.builder()
                    .id(ownerId)
                    .fullName("Updated Owner")
                    .primaryPhone("987654321")
                    .build());

            mockMvc.perform(put("/api/owners/{id}", ownerId)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.id").value(ownerId.toString()))
                    .andExpect(jsonPath("$.fullName").value("Updated Owner"));

            verify(ownerService).updateOwner(eq(ownerId), any(OwnerRequestDTO.class));
        }

        @Test
        void shouldReturnBadRequest_whenPutOwnerRequestIsInvalid() throws Exception {
            UUID ownerId = UUID.randomUUID();

            OwnerRequestDTO request = OwnerRequestDTO.builder()
                    .fullName("")
                    .primaryPhone("")
                    .build();

            mockMvc.perform(put("/api/owners/{id}", ownerId)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest());

            verify(ownerService, never()).updateOwner(eq(ownerId), any(OwnerRequestDTO.class));
        }
    }

    @Nested
    class DeleteOwnerTests {

        @Test
        void shouldReturnNoContent_whenDeletingOwner() throws Exception {
            UUID ownerId = UUID.randomUUID();

            mockMvc.perform(delete("/api/owners/{id}", ownerId))
                    .andExpect(status().isNoContent());

            verify(ownerService).deleteOwner(ownerId);
        }
    }
}