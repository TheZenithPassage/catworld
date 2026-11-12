package com.allegaeon.catworld.controller;

import com.allegaeon.catworld.service.LibVipsCatPhotoNormalizer;
import com.allegaeon.catworld.service.NormalizedCatPhoto;
import com.jayway.jsonpath.JsonPath;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.head;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class GalleryPublicationControllerTest {
    private static final byte[] NORMALIZED_JPEG = { (byte) 0xff, (byte) 0xd8, (byte) 0xff, (byte) 0xd9 };

    @Autowired private MockMvc mvc;
    @MockitoBean private LibVipsCatPhotoNormalizer photoNormalizer;

    @Test
    void keepsDraftAndItsImagePrivateUntilGuestPermissionIsConfirmed() throws Exception {
        when(photoNormalizer.normalize(any())).thenReturn(
                new NormalizedCatPhoto(NORMALIZED_JPEG, 12, 8, "a".repeat(64)));

        var draft = mvc.perform(multipart("/api/gallery-publications")
                        .file(publication("Nube", "GUEST"))
                        .file(new MockMultipartFile("photo", "test.png", "image/png", new byte[] { 1 }))
                        .with(user("admin").roles("ADMIN")))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.publishedAt").isEmpty())
                .andReturn();
        String id = JsonPath.read(draft.getResponse().getContentAsString(), "$.id");

        mvc.perform(get("/api/gallery-publications")).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/gallery-publications").with(user("staff").roles("STAFF")))
                .andExpect(status().isForbidden());
        mvc.perform(get("/api/gallery-publications").with(user("admin").roles("ADMIN")))
                .andExpect(status().isOk()).andExpect(jsonPath("$[0].name").value("Nube"));
        mvc.perform(get("/api/gallery-publications/{id}/photo", id).with(user("staff").roles("STAFF")))
                .andExpect(status().isForbidden());
        mvc.perform(get("/api/gallery-publications/{id}/photo", id).with(user("admin").roles("ADMIN")))
                .andExpect(status().isOk()).andExpect(content().bytes(NORMALIZED_JPEG));
        mvc.perform(get("/api/public-gallery")).andExpect(status().isOk()).andExpect(content().json("[]"));
        mvc.perform(get("/api/public-gallery/{id}/photo", id)).andExpect(status().isNotFound());

        mvc.perform(post("/api/gallery-publications/{id}/publish", id)
                        .contentType(MediaType.APPLICATION_JSON).content("{\"version\":0,\"guestPermissionConfirmed\":true}")
                        .with(user("staff").roles("STAFF")))
                .andExpect(status().isForbidden());
        mvc.perform(post("/api/gallery-publications/{id}/publish", id)
                        .contentType(MediaType.APPLICATION_JSON).content("{\"version\":0,\"guestPermissionConfirmed\":false}")
                        .with(user("admin").roles("ADMIN")))
                .andExpect(status().isBadRequest());
        mvc.perform(post("/api/gallery-publications/{id}/publish", id)
                        .contentType(MediaType.APPLICATION_JSON).content("{\"version\":0,\"guestPermissionConfirmed\":true}")
                        .with(user("admin").roles("ADMIN")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.publishedAt").isNotEmpty());

        mvc.perform(get("/api/public-gallery"))
                .andExpect(status().isOk())
                .andExpect(header().string(HttpHeaders.CACHE_CONTROL, "no-store"))
                .andExpect(content().json("""
                        [{"id":"%s","name":"Nube","description":"A cat portrait","kind":"GUEST","width":12,"height":8}]
                        """.formatted(id), org.springframework.test.json.JsonCompareMode.STRICT));
        mvc.perform(head("/api/public-gallery/{id}/photo", id)).andExpect(status().isOk());
        mvc.perform(get("/api/public-gallery/{id}/photo", id))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.IMAGE_JPEG))
                .andExpect(header().string(HttpHeaders.CACHE_CONTROL, "no-store"))
                .andExpect(content().bytes(NORMALIZED_JPEG));
        mvc.perform(multipart(HttpMethod.PUT, "/api/gallery-publications/{id}", id)
                        .file(publication("Changed title", "GUEST")).with(user("admin").roles("ADMIN")))
                .andExpect(status().isConflict());

        mvc.perform(post("/api/gallery-publications/{id}/hide", id).with(user("admin").roles("ADMIN")))
                .andExpect(status().isOk());
        mvc.perform(get("/api/public-gallery")).andExpect(status().isOk()).andExpect(content().json("[]"));
        mvc.perform(get("/api/public-gallery/{id}/photo", id))
                .andExpect(status().isNotFound())
                .andExpect(header().string(HttpHeaders.CACHE_CONTROL, "no-store"));
        var edited = mvc.perform(multipart(HttpMethod.PUT, "/api/gallery-publications/{id}", id)
                        .file(publication("Changed title", "RESIDENT")).with(user("admin").roles("ADMIN")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Changed title"))
                .andReturn();
        Number currentVersion = JsonPath.read(edited.getResponse().getContentAsString(), "$.version");

        mvc.perform(post("/api/gallery-publications/{id}/publish", id)
                        .contentType(MediaType.APPLICATION_JSON).content("{\"version\":0,\"guestPermissionConfirmed\":true}")
                        .with(user("admin").roles("ADMIN")))
                .andExpect(status().isConflict());
        mvc.perform(post("/api/gallery-publications/{id}/publish", id)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"version\":%d,\"guestPermissionConfirmed\":false}".formatted(currentVersion))
                        .with(user("admin").roles("ADMIN")))
                .andExpect(status().isOk());
    }

    private MockMultipartFile publication(String name, String kind) {
        return new MockMultipartFile("publication", "", MediaType.APPLICATION_JSON_VALUE,
                """
                {"name":"%s","description":"A cat portrait","kind":"%s"}
                """.formatted(name, kind).getBytes(StandardCharsets.UTF_8));
    }
}
