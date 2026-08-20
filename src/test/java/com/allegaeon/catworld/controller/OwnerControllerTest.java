package com.allegaeon.catworld.controller;

import com.allegaeon.catworld.dto.OwnerRequestDTO;
import com.allegaeon.catworld.dto.OwnerResponseDTO;
import com.allegaeon.catworld.exception.ConflictException;
import com.allegaeon.catworld.exception.BadRequestException;
import com.allegaeon.catworld.exception.ForbiddenException;
import com.allegaeon.catworld.exception.ResourceNotFoundException;
import com.allegaeon.catworld.service.IOwnerService;
import com.allegaeon.catworld.dto.lookup.LookupPageResponseDTO;
import com.allegaeon.catworld.dto.lookup.OwnerLookupCatDTO;
import com.allegaeon.catworld.dto.lookup.OwnerLookupOptionDTO;
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
        void shouldReturnOwnerLookupPage() throws Exception {
            UUID ownerId = UUID.randomUUID();
            UUID miloId = UUID.randomUUID();
            UUID zoeId = UUID.randomUUID();
            when(ownerService.searchLookupOptions("milo", 2)).thenReturn(
                    new LookupPageResponseDTO<>(List.of(
                            new OwnerLookupOptionDTO(ownerId, "Ana Owner", List.of(
                                    new OwnerLookupCatDTO(miloId, "Milo"),
                                    new OwnerLookupCatDTO(zoeId, "Zoe")))),
                            2,
                            true));

            mockMvc.perform(get("/api/owners/search").param("q", "milo").param("page", "2"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.items[0].id").value(ownerId.toString()))
                    .andExpect(jsonPath("$.items[0].cats[0].id").value(miloId.toString()))
                    .andExpect(jsonPath("$.items[0].cats[1].id").value(zoeId.toString()))
                    .andExpect(jsonPath("$.items[0].cats[1].name").value("Zoe"))
                    .andExpect(jsonPath("$.page").value(2))
                    .andExpect(jsonPath("$.hasNext").value(true));

            verify(ownerService).searchLookupOptions("milo", 2);
        }

        @Test
        void shouldReturnBadRequestForInvalidLookupInput() throws Exception {
            when(ownerService.searchLookupOptions("ab", -1))
                    .thenThrow(new BadRequestException("Invalid lookup"));

            mockMvc.perform(get("/api/owners/search").param("q", "ab").param("page", "-1"))
                    .andExpect(status().isBadRequest());

            verify(ownerService).searchLookupOptions("ab", -1);
        }

        @Test
        void shouldResolveOwnerLookupOption() throws Exception {
            UUID ownerId = UUID.randomUUID();
            UUID catId = UUID.randomUUID();
            when(ownerService.getLookupOption(ownerId)).thenReturn(
                    new OwnerLookupOptionDTO(ownerId, "Ana Owner", List.of(
                            new OwnerLookupCatDTO(catId, "Milo"))));

            mockMvc.perform(get("/api/owners/{id}/lookup-option", ownerId))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.id").value(ownerId.toString()))
                    .andExpect(jsonPath("$.cats[0].id").value(catId.toString()))
                    .andExpect(jsonPath("$.cats[0].name").value("Milo"));

            verify(ownerService).getLookupOption(ownerId);
        }

        @Test
        void shouldReturnOk_whenGettingAllOwners() throws Exception {
            UUID deletableId = UUID.randomUUID();
            UUID blockedId = UUID.randomUUID();
            when(ownerService.getAllOwners()).thenReturn(List.of(
                    OwnerResponseDTO.builder()
                            .id(deletableId)
                            .fullName("Deletable Owner")
                            .canDelete(true)
                            .build(),
                    OwnerResponseDTO.builder()
                            .id(blockedId)
                            .fullName("Referenced Owner")
                            .canDelete(false)
                            .build()));

            mockMvc.perform(get("/api/owners"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$[0].id").value(deletableId.toString()))
                    .andExpect(jsonPath("$[0].canDelete").value(true))
                    .andExpect(jsonPath("$[1].id").value(blockedId.toString()))
                    .andExpect(jsonPath("$[1].canDelete").value(false));

            verify(ownerService).getAllOwners();
        }

        @Test
        void shouldReturnOk_whenGettingOwnerById() throws Exception {
            UUID ownerId = UUID.randomUUID();

            when(ownerService.getOwner(ownerId)).thenReturn(OwnerResponseDTO.builder()
                    .id(ownerId)
                    .fullName("John Owner")
                    .primaryPhone("123456789")
                    .canDelete(true)
                    .build());

            mockMvc.perform(get("/api/owners/{id}", ownerId))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.id").value(ownerId.toString()))
                    .andExpect(jsonPath("$.fullName").value("John Owner"))
                    .andExpect(jsonPath("$.canDelete").value(true));

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
                    .canDelete(true)
                    .build());

            mockMvc.perform(post("/api/owners")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.id").value(ownerId.toString()))
                    .andExpect(jsonPath("$.fullName").value("John Owner"))
                    .andExpect(jsonPath("$.canDelete").value(true))
                    .andExpect(jsonPath("$.creator").doesNotExist())
                    .andExpect(jsonPath("$.creatorId").doesNotExist())
                    .andExpect(jsonPath("$.createdBy").doesNotExist())
                    .andExpect(jsonPath("$.createdById").doesNotExist());

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
                    .canDelete(false)
                    .build());

            mockMvc.perform(put("/api/owners/{id}", ownerId)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.id").value(ownerId.toString()))
                    .andExpect(jsonPath("$.fullName").value("Updated Owner"))
                    .andExpect(jsonPath("$.canDelete").value(false));

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

        @Test
        void shouldReturnForbidden_whenDeleteAuthorizationFails() throws Exception {
            UUID ownerId = UUID.randomUUID();

            doThrow(new ForbiddenException("Forbidden")).when(ownerService).deleteOwner(ownerId);

            mockMvc.perform(delete("/api/owners/{id}", ownerId))
                    .andExpect(status().isForbidden())
                    .andExpect(content().string("Forbidden"));

            verify(ownerService).deleteOwner(ownerId);
        }

        @Test
        void shouldReturnNotFound_whenDeleteOwnerIsMissing() throws Exception {
            UUID ownerId = UUID.randomUUID();

            doThrow(new ResourceNotFoundException("Owner", ownerId))
                    .when(ownerService).deleteOwner(ownerId);

            mockMvc.perform(delete("/api/owners/{id}", ownerId))
                    .andExpect(status().isNotFound());

            verify(ownerService).deleteOwner(ownerId);
        }

        @Test
        void shouldReturnConflict_whenOwnerIsReferencedOrDeleteRaces() throws Exception {
            UUID ownerId = UUID.randomUUID();

            doThrow(new ConflictException("Owner cannot be deleted while cats reference it"))
                    .when(ownerService).deleteOwner(ownerId);

            mockMvc.perform(delete("/api/owners/{id}", ownerId))
                    .andExpect(status().isConflict())
                    .andExpect(content().string("Owner cannot be deleted while cats reference it"));

            verify(ownerService).deleteOwner(ownerId);
        }
    }
}
