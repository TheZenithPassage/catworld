package com.allegaeon.catworld.controller;

import com.allegaeon.catworld.dto.CatRequestDTO;
import com.allegaeon.catworld.dto.CatResponseDTO;
import com.allegaeon.catworld.dto.lookup.CatLookupOptionDTO;
import com.allegaeon.catworld.dto.lookup.LookupPageResponseDTO;
import com.allegaeon.catworld.exception.ConflictException;
import com.allegaeon.catworld.exception.ForbiddenException;
import com.allegaeon.catworld.exception.ResourceNotFoundException;
import com.allegaeon.catworld.model.Sex;
import com.allegaeon.catworld.service.ICatService;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import tools.jackson.databind.ObjectMapper;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(CatController.class)
public class CatControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private ICatService catService;

    @Nested
    class GetCatTests {

        @Test
        void shouldReturnCatLookupPage() throws Exception {
            UUID catId = UUID.randomUUID();
            when(catService.searchLookupOptions("Mílo", 1)).thenReturn(
                    new LookupPageResponseDTO<>(
                            List.of(new CatLookupOptionDTO(catId, "Milo", "Ada Lovelace")),
                            1,
                            true));

            mockMvc.perform(get("/api/cats/search").param("q", "Mílo").param("page", "1"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.items[0].id").value(catId.toString()))
                    .andExpect(jsonPath("$.items[0].name").value("Milo"))
                    .andExpect(jsonPath("$.items[0].ownerName").value("Ada Lovelace"))
                    .andExpect(jsonPath("$.page").value(1))
                    .andExpect(jsonPath("$.hasNext").value(true));

            verify(catService).searchLookupOptions("Mílo", 1);
        }

        @Test
        void shouldResolveCatLookupOptionById() throws Exception {
            UUID catId = UUID.randomUUID();
            when(catService.getLookupOption(catId)).thenReturn(
                    new CatLookupOptionDTO(catId, "Milo", "Ada Lovelace"));

            mockMvc.perform(get("/api/cats/{id}/lookup-option", catId))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.id").value(catId.toString()))
                    .andExpect(jsonPath("$.name").value("Milo"))
                    .andExpect(jsonPath("$.ownerName").value("Ada Lovelace"));

            verify(catService).getLookupOption(catId);
        }

        @Test
        void shouldReturnNotFound_whenLookupOptionDoesNotExist() throws Exception {
            UUID catId = UUID.randomUUID();
            when(catService.getLookupOption(catId))
                    .thenThrow(new ResourceNotFoundException("Cat", catId));

            mockMvc.perform(get("/api/cats/{id}/lookup-option", catId))
                    .andExpect(status().isNotFound());

            verify(catService).getLookupOption(catId);
        }

        @Test
        void shouldReturnOk_whenGettingAllCats() throws Exception {
            when(catService.getAllCats()).thenReturn(List.of());

            mockMvc.perform(get("/api/cats"))
                    .andExpect(status().isOk())
                    .andExpect(content().json("[]"));

            verify(catService).getAllCats();
        }

        @Test
        void shouldReturnOk_whenGettingCatById() throws Exception {
            UUID catId = UUID.randomUUID();

            when(catService.getCat(catId)).thenReturn(CatResponseDTO.builder()
                    .id(catId)
                    .name("Milo")
                    .birthDate(LocalDate.of(2020, 1, 1))
                    .sex(Sex.MALE)
                    .ownerId(UUID.randomUUID())
                    .canDelete(true)
                    .build());

            mockMvc.perform(get("/api/cats/{id}", catId))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.id").value(catId.toString()))
                    .andExpect(jsonPath("$.name").value("Milo"))
                    .andExpect(jsonPath("$.canDelete").value(true))
                    .andExpect(jsonPath("$.creator").doesNotExist())
                    .andExpect(jsonPath("$.creatorId").doesNotExist())
                    .andExpect(jsonPath("$.createdBy").doesNotExist())
                    .andExpect(jsonPath("$.createdById").doesNotExist());

            verify(catService).getCat(catId);
        }

        @Test
        void shouldReturnNotFound_whenServiceThrowsNotFoundException() throws Exception {
            UUID catId = UUID.randomUUID();

            when(catService.getCat(catId)).thenThrow(new ResourceNotFoundException("Cat", catId));

            mockMvc.perform(get("/api/cats/{id}", catId))
                    .andExpect(status().isNotFound());

            verify(catService).getCat(catId);
        }
    }

    @Nested
    class PostCatTests {

        @Test
        void shouldReturnCreated_whenPostCatRequestIsValid() throws Exception {
            UUID catId = UUID.randomUUID();
            UUID ownerId = UUID.randomUUID();

            CatRequestDTO request = CatRequestDTO.builder()
                    .name("Milo")
                    .birthDate(LocalDate.of(2020, 1, 1))
                    .sex(Sex.MALE)
                    .ownerId(ownerId)
                    .build();

            when(catService.createCat(any(CatRequestDTO.class))).thenReturn(CatResponseDTO.builder()
                    .id(catId)
                    .name("Milo")
                    .birthDate(LocalDate.of(2020, 1, 1))
                    .sex(Sex.MALE)
                    .ownerId(ownerId)
                    .build());

            mockMvc.perform(post("/api/cats")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.id").value(catId.toString()))
                    .andExpect(jsonPath("$.name").value("Milo"))
                    .andExpect(jsonPath("$.creator").doesNotExist())
                    .andExpect(jsonPath("$.creatorId").doesNotExist())
                    .andExpect(jsonPath("$.createdBy").doesNotExist())
                    .andExpect(jsonPath("$.createdById").doesNotExist());

            verify(catService).createCat(any(CatRequestDTO.class));
        }

        @Test
        void shouldReturnBadRequest_whenPostCatRequestIsInvalid() throws Exception {
            CatRequestDTO request = CatRequestDTO.builder()
                    .name("")
                    .birthDate(LocalDate.now().plusDays(1))
                    .sex(null)
                    .ownerId(null)
                    .build();

            mockMvc.perform(post("/api/cats")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest());

            verify(catService, never()).createCat(any(CatRequestDTO.class));
        }
    }

    @Nested
    class PutCatTests {

        @Test
        void shouldReturnOk_whenPutCatRequestIsValid() throws Exception {
            UUID catId = UUID.randomUUID();
            UUID ownerId = UUID.randomUUID();

            CatRequestDTO request = CatRequestDTO.builder()
                    .name("Updated Milo")
                    .birthDate(LocalDate.of(2020, 1, 1))
                    .sex(Sex.MALE)
                    .ownerId(ownerId)
                    .build();

            when(catService.updateCat(eq(catId), any(CatRequestDTO.class))).thenReturn(CatResponseDTO.builder()
                    .id(catId)
                    .name("Updated Milo")
                    .birthDate(LocalDate.of(2020, 1, 1))
                    .sex(Sex.MALE)
                    .ownerId(ownerId)
                    .build());

            mockMvc.perform(put("/api/cats/{id}", catId)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.id").value(catId.toString()))
                    .andExpect(jsonPath("$.name").value("Updated Milo"));

            verify(catService).updateCat(eq(catId), any(CatRequestDTO.class));
        }

        @Test
        void shouldReturnBadRequest_whenPutCatRequestIsInvalid() throws Exception {
            UUID catId = UUID.randomUUID();

            CatRequestDTO request = CatRequestDTO.builder()
                    .name("")
                    .birthDate(LocalDate.now().plusDays(1))
                    .sex(null)
                    .ownerId(null)
                    .build();

            mockMvc.perform(put("/api/cats/{id}", catId)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest());

            verify(catService, never()).updateCat(eq(catId), any(CatRequestDTO.class));
        }
    }

    @Nested
    class DeleteCatTests {

        @Test
        void shouldReturnNoContent_whenDeletingCat() throws Exception {
            UUID catId = UUID.randomUUID();

            mockMvc.perform(delete("/api/cats/{id}", catId))
                    .andExpect(status().isNoContent());

            verify(catService).deleteCat(catId);
        }

        @Test
        void shouldReturnForbidden_whenDeleteAuthorizationFails() throws Exception {
            UUID catId = UUID.randomUUID();

            doThrow(new ForbiddenException("Forbidden")).when(catService).deleteCat(catId);

            mockMvc.perform(delete("/api/cats/{id}", catId))
                    .andExpect(status().isForbidden())
                    .andExpect(content().string("Forbidden"));

            verify(catService).deleteCat(catId);
        }

        @Test
        void shouldReturnNotFound_whenDeletingMissingCat() throws Exception {
            UUID catId = UUID.randomUUID();

            doThrow(new ResourceNotFoundException("Cat", catId)).when(catService).deleteCat(catId);

            mockMvc.perform(delete("/api/cats/{id}", catId))
                    .andExpect(status().isNotFound());

            verify(catService).deleteCat(catId);
        }

        @Test
        void shouldReturnConflict_whenStayHistoryBlocksDeletion() throws Exception {
            UUID catId = UUID.randomUUID();

            doThrow(new ConflictException("Cat cannot be deleted because it has stay history"))
                    .when(catService).deleteCat(catId);

            mockMvc.perform(delete("/api/cats/{id}", catId))
                    .andExpect(status().isConflict())
                    .andExpect(content().string("Cat cannot be deleted because it has stay history"));

            verify(catService).deleteCat(catId);
        }
    }
}
