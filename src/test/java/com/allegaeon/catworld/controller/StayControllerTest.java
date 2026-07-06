package com.allegaeon.catworld.controller;

import com.allegaeon.catworld.dto.StayRequestDTO;
import com.allegaeon.catworld.dto.StayResponseDTO;
import com.allegaeon.catworld.dto.StayUpdateDTO;
import com.allegaeon.catworld.exception.BadRequestException;
import com.allegaeon.catworld.exception.ConflictException;
import com.allegaeon.catworld.exception.ForbiddenException;
import com.allegaeon.catworld.exception.ResourceNotFoundException;
import com.allegaeon.catworld.service.IStayService;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import tools.jackson.databind.ObjectMapper;
import org.springframework.http.MediaType;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import java.time.LocalDateTime;
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
                    .canDelete(true)
                    .build());

            mockMvc.perform(get("/api/stays/{id}", stayId))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.stayId").value(stayId.toString()))
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
                    .build();

            when(stayService.createStay(any(StayRequestDTO.class))).thenReturn(StayResponseDTO.builder().stayId(stayId).build());

            mockMvc.perform(post("/api/stays")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.stayId").value(stayId.toString()))
                    .andExpect(jsonPath("$.creator").doesNotExist())
                    .andExpect(jsonPath("$.creatorId").doesNotExist())
                    .andExpect(jsonPath("$.createdBy").doesNotExist())
                    .andExpect(jsonPath("$.createdById").doesNotExist());

            verify(stayService).createStay(any(StayRequestDTO.class));

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
                    .build();

            when(stayService.createStay(any(StayRequestDTO.class))).thenThrow(new BadRequestException("Bad Request"));

            mockMvc.perform(post("/api/stays")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest());

            verify(stayService).createStay(any(StayRequestDTO.class));

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
                    .build();

            when(stayService.updateStay(eq(stayId), any(StayUpdateDTO.class))).thenReturn(StayResponseDTO.builder().stayId(stayId).build());

            mockMvc.perform(put("/api/stays/{id}", stayId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.stayId").value(stayId.toString()));

            verify(stayService).updateStay(eq(stayId), any(StayUpdateDTO.class));

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
                    .andExpect(status().isConflict());

            verify(stayService).updateStay(eq(stayId), any(StayUpdateDTO.class));

        }

    }

    @Nested
    class PatchStayTests {

        @Test
        void shouldReturnNoContent_whenCancellingStay() throws Exception {

            UUID stayId = UUID.randomUUID();

            mockMvc.perform(patch("/api/stays/{id}/cancel", stayId))
                    .andExpect(status().isNoContent());

            verify(stayService).cancelStay(stayId);

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
