package com.allegaeon.catworld.controller;

import com.allegaeon.catworld.dto.VetRequestDTO;
import com.allegaeon.catworld.dto.VetResponseDTO;
import com.allegaeon.catworld.dto.relationship.*;
import com.allegaeon.catworld.dto.lookup.*;
import com.allegaeon.catworld.exception.BadRequestException;
import com.allegaeon.catworld.exception.ConflictException;
import com.allegaeon.catworld.exception.ForbiddenException;
import com.allegaeon.catworld.exception.ResourceNotFoundException;
import com.allegaeon.catworld.service.IVetService;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import tools.jackson.databind.ObjectMapper;

import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
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
        void searchRouteUsesDefaultPageAndSerializesLookupEnvelopeAndValidation() throws Exception {
            UUID vetId = UUID.randomUUID();
            when(vetService.searchVets("v", 0)).thenReturn(new LookupPage<>(
                    List.of(new VetLookupItem(vetId, "Vet")), 0, 5, 1));
            mockMvc.perform(get("/api/vets/search").param("q", "v"))
                    .andExpect(status().isOk()).andExpect(jsonPath("$.items[0].name").value("Vet"))
                    .andExpect(jsonPath("$.page").value(0)).andExpect(jsonPath("$.pageSize").value(5))
                    .andExpect(jsonPath("$.totalElements").value(1))
                    .andExpect(jsonPath("$.totalPages").doesNotExist()).andExpect(jsonPath("$.hasNext").doesNotExist());
            when(vetService.searchVets("  ", 0)).thenThrow(new BadRequestException("Search query must not be empty"));
            when(vetService.searchVets("v", -1)).thenThrow(new BadRequestException("Page must not be negative"));
            mockMvc.perform(get("/api/vets/search").param("q", "  ")).andExpect(status().isBadRequest());
            mockMvc.perform(get("/api/vets/search").param("q", "v").param("page", "-1"))
                    .andExpect(status().isBadRequest());
        }

        @Test
        void detailAndExplicitCatPageSerializeAndDelegate() throws Exception {
            UUID vetId = UUID.randomUUID();
            UUID ownerId = UUID.randomUUID();
            var item = new CatRelationshipItem(UUID.randomUUID(), "Milo", ownerId, "Owner");
            when(vetService.getVetDetail(vetId)).thenReturn(new VetDetailResponse(
                    VetResponseDTO.builder().id(vetId).name("Vet").build(),
                    new RelationshipPreview<>(1, List.of(item))));
            when(vetService.getVetCats(vetId, 3)).thenReturn(new RelationshipPage<>(List.of(), 3, 5, 16, 4));

            mockMvc.perform(get("/api/vets/{id}/detail", vetId)).andExpect(status().isOk())
                    .andExpect(jsonPath("$.cats.items[0].name").value("Milo"));
            mockMvc.perform(get("/api/vets/{id}/cats", vetId).param("page", "3"))
                    .andExpect(status().isOk()).andExpect(jsonPath("$.totalPages").value(4));
            verify(vetService).getVetCats(vetId, 3);
        }

        @Test
        void catPageMapsMissingAndNegativeErrors() throws Exception {
            UUID vetId = UUID.randomUUID();
            when(vetService.getVetCats(vetId, 0)).thenThrow(new ResourceNotFoundException("Vet", vetId));
            when(vetService.getVetCats(vetId, -1)).thenThrow(new BadRequestException("Page must not be negative"));
            mockMvc.perform(get("/api/vets/{id}/cats", vetId)).andExpect(status().isNotFound());
            mockMvc.perform(get("/api/vets/{id}/cats", vetId).param("page", "-1"))
                    .andExpect(status().isBadRequest());
        }

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
                    .canDelete(true)
                    .build());

            mockMvc.perform(get("/api/vets/{id}", vetId))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.id").value(vetId.toString()))
                    .andExpect(jsonPath("$.name").value("Vet Clinic"))
                    .andExpect(jsonPath("$.canDelete").value(true))
                    .andExpect(jsonPath("$.creator").doesNotExist())
                    .andExpect(jsonPath("$.creatorId").doesNotExist())
                    .andExpect(jsonPath("$.createdBy").doesNotExist())
                    .andExpect(jsonPath("$.createdById").doesNotExist());

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
        void validatesNormalizedRegistrationNumberLength() throws Exception {
            String accepted = "R".repeat(100);
            when(vetService.createVet(any(VetRequestDTO.class))).thenReturn(VetResponseDTO.builder()
                    .id(UUID.randomUUID()).name("Vet Clinic").registrationNumber(accepted).build());

            mockMvc.perform(post("/api/vets")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"name\":\"Vet Clinic\",\"registrationNumber\":\"  " + accepted + "  \"}"))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.registrationNumber").value(accepted));

            mockMvc.perform(post("/api/vets")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"name\":\"Vet Clinic\",\"registrationNumber\":\""
                                    + " ".repeat(101) + "\"}"))
                    .andExpect(status().isCreated());

            mockMvc.perform(post("/api/vets")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(VetRequestDTO.builder()
                                    .name("Vet Clinic")
                                    .registrationNumber("R".repeat(101))
                                    .build())))
                    .andExpect(status().isBadRequest());

            ArgumentCaptor<VetRequestDTO> requests = ArgumentCaptor.forClass(VetRequestDTO.class);
            verify(vetService, times(2)).createVet(requests.capture());
            assertEquals(accepted, requests.getAllValues().get(0).getRegistrationNumber());
            assertEquals(null, requests.getAllValues().get(1).getRegistrationNumber());
        }

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
                    .canDelete(false)
                    .build());

            mockMvc.perform(post("/api/vets")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.id").value(vetId.toString()))
                    .andExpect(jsonPath("$.name").value("Vet Clinic"))
                    .andExpect(jsonPath("$.canDelete").value(false))
                    .andExpect(jsonPath("$.creator").doesNotExist())
                    .andExpect(jsonPath("$.creatorId").doesNotExist())
                    .andExpect(jsonPath("$.createdBy").doesNotExist())
                    .andExpect(jsonPath("$.createdById").doesNotExist());

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

        @Test
        void shouldReturnForbidden_whenDeleteAuthorizationFails() throws Exception {
            UUID vetId = UUID.randomUUID();

            doThrow(new ForbiddenException("Forbidden")).when(vetService).deleteVet(vetId);

            mockMvc.perform(delete("/api/vets/{id}", vetId))
                    .andExpect(status().isForbidden())
                    .andExpect(content().string("Forbidden"));

            verify(vetService).deleteVet(vetId);
        }

        @Test
        void shouldReturnNotFound_whenDeletedVetDoesNotExist() throws Exception {
            UUID vetId = UUID.randomUUID();

            doThrow(new ResourceNotFoundException("Vet", vetId)).when(vetService).deleteVet(vetId);

            mockMvc.perform(delete("/api/vets/{id}", vetId))
                    .andExpect(status().isNotFound());

            verify(vetService).deleteVet(vetId);
        }

        @Test
        void shouldReturnConflict_whenVetCannotBeDeleted() throws Exception {
            UUID vetId = UUID.randomUUID();

            doThrow(new ConflictException("Vet cannot be deleted")).when(vetService).deleteVet(vetId);

            mockMvc.perform(delete("/api/vets/{id}", vetId))
                    .andExpect(status().isConflict())
                    .andExpect(content().string("Vet cannot be deleted"));

            verify(vetService).deleteVet(vetId);
        }
    }
}
