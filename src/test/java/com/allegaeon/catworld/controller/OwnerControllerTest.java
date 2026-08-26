package com.allegaeon.catworld.controller;

import com.allegaeon.catworld.dto.OwnerRequestDTO;
import com.allegaeon.catworld.dto.OwnerResponseDTO;
import com.allegaeon.catworld.dto.relationship.*;
import com.allegaeon.catworld.dto.lookup.*;
import com.allegaeon.catworld.exception.BadRequestException;
import com.allegaeon.catworld.exception.ConflictException;
import com.allegaeon.catworld.exception.ForbiddenException;
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
        void lookupRoutesSerializeSemanticEnvelopeAndMapValidationAndMissingOwner() throws Exception {
            UUID ownerId = UUID.randomUUID();
            UUID catId = UUID.randomUUID();
            var owner = new OwnerLookupItem(ownerId, "Owner", List.of(new CurrentCatLookupItem(catId, "Milo")));
            when(ownerService.searchOwners("o", 0)).thenReturn(new LookupPage<>(List.of(owner), 0, 5, 6));
            when(ownerService.getOwnerLookup(ownerId)).thenReturn(owner);

            mockMvc.perform(get("/api/owners/search").param("q", "o"))
                    .andExpect(status().isOk()).andExpect(jsonPath("$.items[0].currentCats[0].name").value("Milo"))
                    .andExpect(jsonPath("$.page").value(0)).andExpect(jsonPath("$.pageSize").value(5))
                    .andExpect(jsonPath("$.totalElements").value(6))
                    .andExpect(jsonPath("$.totalPages").doesNotExist()).andExpect(jsonPath("$.hasNext").doesNotExist());
            mockMvc.perform(get("/api/owners/{id}/lookup", ownerId))
                    .andExpect(status().isOk()).andExpect(jsonPath("$.fullName").value("Owner"));

            when(ownerService.searchOwners("   ", 0)).thenThrow(new BadRequestException("Search query must not be empty"));
            when(ownerService.searchOwners("o", -1)).thenThrow(new BadRequestException("Page must not be negative"));
            when(ownerService.getOwnerLookup(ownerId)).thenThrow(new ResourceNotFoundException("Owner", ownerId));
            mockMvc.perform(get("/api/owners/search").param("q", "   ")).andExpect(status().isBadRequest());
            mockMvc.perform(get("/api/owners/search").param("q", "o").param("page", "-1"))
                    .andExpect(status().isBadRequest());
            mockMvc.perform(get("/api/owners/{id}/lookup", ownerId)).andExpect(status().isNotFound());
        }

        @Test
        void detailAndNestedReadsSerializeTypedContractsAndDelegatePages() throws Exception {
            UUID ownerId = UUID.randomUUID();
            UUID catId = UUID.randomUUID();
            var item = new CatRelationshipItem(catId, "Milo", ownerId, "Owner");
            when(ownerService.getOwnerDetail(ownerId)).thenReturn(new OwnerDetailResponse(
                    OwnerResponseDTO.builder().id(ownerId).fullName("Owner").build(),
                    new RelationshipPreview<>(1, List.of(item)), new RelationshipPreview<>(0, List.of())));
            when(ownerService.getOwnerCats(ownerId, 0)).thenReturn(
                    new RelationshipPage<>(List.of(item), 0, 5, 1, 1));
            when(ownerService.getOwnerStays(ownerId, 2)).thenReturn(
                    new RelationshipPage<>(List.of(), 2, 5, 7, 2));

            mockMvc.perform(get("/api/owners/{id}/detail", ownerId))
                    .andExpect(status().isOk()).andExpect(jsonPath("$.owner.id").value(ownerId.toString()))
                    .andExpect(jsonPath("$.cats.items[0].ownerName").value("Owner"));
            mockMvc.perform(get("/api/owners/{id}/cats", ownerId))
                    .andExpect(status().isOk()).andExpect(jsonPath("$.pageSize").value(5));
            mockMvc.perform(get("/api/owners/{id}/stays", ownerId).param("page", "2"))
                    .andExpect(status().isOk()).andExpect(jsonPath("$.totalElements").value(7));

            verify(ownerService).getOwnerCats(ownerId, 0);
            verify(ownerService).getOwnerStays(ownerId, 2);
        }

        @Test
        void nestedReadsMapMissingAndNegativePageThroughExistingHandler() throws Exception {
            UUID ownerId = UUID.randomUUID();
            when(ownerService.getOwnerCats(ownerId, 0)).thenThrow(new ResourceNotFoundException("Owner", ownerId));
            when(ownerService.getOwnerStays(ownerId, -1)).thenThrow(new BadRequestException("Page must not be negative"));
            mockMvc.perform(get("/api/owners/{id}/cats", ownerId)).andExpect(status().isNotFound());
            mockMvc.perform(get("/api/owners/{id}/stays", ownerId).param("page", "-1"))
                    .andExpect(status().isBadRequest());
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
