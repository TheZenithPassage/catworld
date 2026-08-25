package com.allegaeon.catworld.controller;

import com.allegaeon.catworld.dto.CatRequestDTO;
import com.allegaeon.catworld.dto.CatResponseDTO;
import com.allegaeon.catworld.dto.CatPhotoContent;
import com.allegaeon.catworld.exception.CatPhotoException;
import com.allegaeon.catworld.exception.CatPhotoErrorCode;
import com.allegaeon.catworld.dto.relationship.*;
import com.allegaeon.catworld.exception.BadRequestException;
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
import org.springframework.http.HttpMethod;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import tools.jackson.databind.ObjectMapper;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import java.time.LocalDateTime;

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
    class PhotoContractTests {
        @Test
        void photoUsesPrivateDigestCachingAndWeakConditionalMatching() throws Exception {
            UUID id = UUID.randomUUID();
            byte[] jpeg = {(byte) 0xff, (byte) 0xd8, (byte) 0xff, (byte) 0xd9};
            when(catService.getPhoto(id)).thenReturn(new CatPhotoContent(jpeg, "\"abc123\""));

            mockMvc.perform(get("/api/cats/{id}/photo", id))
                    .andExpect(status().isOk())
                    .andExpect(header().string("ETag", "\"abc123\""))
                    .andExpect(header().string("Cache-Control", "private, no-cache"))
                    .andExpect(content().contentType(MediaType.IMAGE_JPEG))
                    .andExpect(content().bytes(jpeg));
            mockMvc.perform(get("/api/cats/{id}/photo", id)
                            .header("If-None-Match", "\"other\", W/\"abc123\""))
                    .andExpect(status().isNotModified())
                    .andExpect(content().bytes(new byte[0]));
        }

        @Test
        void mutationPhotoErrorsUseStableCodeAndJsonMutationsAreRejected() throws Exception {
            UUID id = UUID.randomUUID();
            when(catService.updateCat(eq(id), any(), any(), eq(true)))
                    .thenThrow(new CatPhotoException(CatPhotoErrorCode.CAT_PHOTO_INTENT_CONFLICT));
            var catPart = new MockMultipartFile("cat", "cat.json", MediaType.APPLICATION_JSON_VALUE,
                    objectMapper.writeValueAsBytes(validRequest()));
            var photo = new MockMultipartFile("photo", "cat.png", "image/png", new byte[] {1});
            mockMvc.perform(multipart(HttpMethod.PUT, "/api/cats/{id}?removePhoto=true", id)
                            .file(catPart).file(photo))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.code").value("CAT_PHOTO_INTENT_CONFLICT"));
            mockMvc.perform(post("/api/cats").contentType(MediaType.APPLICATION_JSON).content("{}"))
                    .andExpect(status().isUnsupportedMediaType());
        }

        private CatRequestDTO validRequest() {
            return CatRequestDTO.builder().name("Milo").birthDate(LocalDate.of(2020, 1, 1))
                    .sex(Sex.MALE).ownerId(UUID.randomUUID()).build();
        }
    }

    @Nested
    class GetCatTests {

        @Test
        void detailAndStayPageExposeTypedLightweightStatusAndDefaultPage() throws Exception {
            UUID catId = UUID.randomUUID();
            UUID stayId = UUID.randomUUID();
            var stay = new StayRelationshipItem(stayId, LocalDateTime.parse("2026-08-20T10:00:00"),
                    LocalDateTime.parse("2026-08-21T10:00:00"), com.allegaeon.catworld.model.StayStatus.CANCELLED);
            when(catService.getCatDetail(catId)).thenReturn(new CatDetailResponse(
                    CatResponseDTO.builder().id(catId).ownerName("Owner").build(),
                    new RelationshipPreview<>(1, List.of(stay))));
            when(catService.getCatStays(catId, 0)).thenReturn(new RelationshipPage<>(List.of(stay), 0, 5, 1, 1));

            mockMvc.perform(get("/api/cats/{id}/detail", catId)).andExpect(status().isOk())
                    .andExpect(jsonPath("$.stays.items[0].stayId").value(stayId.toString()))
                    .andExpect(jsonPath("$.stays.items[0].status").value("CANCELLED"));
            mockMvc.perform(get("/api/cats/{id}/stays", catId)).andExpect(status().isOk())
                    .andExpect(jsonPath("$.page").value(0)).andExpect(jsonPath("$.pageSize").value(5));
            verify(catService).getCatStays(catId, 0);
        }

        @Test
        void stayPageMapsMissingAndNegativeErrors() throws Exception {
            UUID catId = UUID.randomUUID();
            when(catService.getCatStays(catId, 0)).thenThrow(new ResourceNotFoundException("Cat", catId));
            when(catService.getCatStays(catId, -1)).thenThrow(new BadRequestException("Page must not be negative"));
            mockMvc.perform(get("/api/cats/{id}/stays", catId)).andExpect(status().isNotFound());
            mockMvc.perform(get("/api/cats/{id}/stays", catId).param("page", "-1"))
                    .andExpect(status().isBadRequest());
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

            when(catService.createCat(any(CatRequestDTO.class), isNull())).thenReturn(CatResponseDTO.builder()
                    .id(catId)
                    .name("Milo")
                    .birthDate(LocalDate.of(2020, 1, 1))
                    .sex(Sex.MALE)
                    .ownerId(ownerId)
                    .build());

            var catPart = new MockMultipartFile("cat", "cat.json", MediaType.APPLICATION_JSON_VALUE,
                    objectMapper.writeValueAsBytes(request));
            mockMvc.perform(multipart("/api/cats").file(catPart))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.id").value(catId.toString()))
                    .andExpect(jsonPath("$.name").value("Milo"))
                    .andExpect(jsonPath("$.creator").doesNotExist())
                    .andExpect(jsonPath("$.creatorId").doesNotExist())
                    .andExpect(jsonPath("$.createdBy").doesNotExist())
                    .andExpect(jsonPath("$.createdById").doesNotExist());

            verify(catService).createCat(any(CatRequestDTO.class), isNull());
        }

        @Test
        void shouldReturnBadRequest_whenPostCatRequestIsInvalid() throws Exception {
            CatRequestDTO request = CatRequestDTO.builder()
                    .name("")
                    .birthDate(LocalDate.now().plusDays(1))
                    .sex(null)
                    .ownerId(null)
                    .build();

            var catPart = new MockMultipartFile("cat", "cat.json", MediaType.APPLICATION_JSON_VALUE,
                    objectMapper.writeValueAsBytes(request));
            mockMvc.perform(multipart("/api/cats").file(catPart))
                    .andExpect(status().isBadRequest());

            verify(catService, never()).createCat(any(CatRequestDTO.class), any());
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

            when(catService.updateCat(eq(catId), any(CatRequestDTO.class), isNull(), eq(false))).thenReturn(CatResponseDTO.builder()
                    .id(catId)
                    .name("Updated Milo")
                    .birthDate(LocalDate.of(2020, 1, 1))
                    .sex(Sex.MALE)
                    .ownerId(ownerId)
                    .build());

            var catPart = new MockMultipartFile("cat", "cat.json", MediaType.APPLICATION_JSON_VALUE,
                    objectMapper.writeValueAsBytes(request));
            mockMvc.perform(multipart(HttpMethod.PUT, "/api/cats/{id}", catId).file(catPart))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.id").value(catId.toString()))
                    .andExpect(jsonPath("$.name").value("Updated Milo"));

            verify(catService).updateCat(eq(catId), any(CatRequestDTO.class), isNull(), eq(false));
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

            var catPart = new MockMultipartFile("cat", "cat.json", MediaType.APPLICATION_JSON_VALUE,
                    objectMapper.writeValueAsBytes(request));
            mockMvc.perform(multipart(HttpMethod.PUT, "/api/cats/{id}", catId).file(catPart))
                    .andExpect(status().isBadRequest());

            verify(catService, never()).updateCat(eq(catId), any(CatRequestDTO.class), any(), anyBoolean());
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
