package com.allegaeon.catworld.controller;

import com.allegaeon.catworld.exception.CatPhotoErrorCode;
import com.allegaeon.catworld.exception.CatPhotoException;
import com.allegaeon.catworld.model.Cat;
import com.allegaeon.catworld.model.Owner;
import com.allegaeon.catworld.model.Sex;
import com.allegaeon.catworld.model.UserAccount;
import com.allegaeon.catworld.model.UserRole;
import com.allegaeon.catworld.repository.CatRepository;
import com.allegaeon.catworld.repository.OwnerRepository;
import com.allegaeon.catworld.repository.UserAccountRepository;
import com.allegaeon.catworld.service.LibVipsCatPhotoNormalizer;
import com.allegaeon.catworld.service.NormalizedCatPhoto;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.multipart.MultipartFile;
import tools.jackson.databind.ObjectMapper;

import java.time.Instant;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.httpBasic;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(properties = "spring.datasource.url=jdbc:h2:mem:catworld_informational_photos;MODE=MySQL")
@AutoConfigureMockMvc
@ActiveProfiles("test")
class CatInformationalPhotoControllerTest {
    private static final String PHOTOS = "/api/cats/{catId}/informational-photos";
    private static final String PHOTO = PHOTOS + "/{photoId}";

    @Autowired MockMvc mvc;
    @Autowired ObjectMapper json;
    @Autowired CatRepository cats;
    @Autowired OwnerRepository owners;
    @Autowired UserAccountRepository users;
    @Autowired PasswordEncoder encoder;
    @MockitoBean LibVipsCatPhotoNormalizer normalizer;

    @Test
    void authenticatedStaffCanManageSeveralPhotosWithoutChangingProfilePhoto() throws Exception {
        UserAccount actor = staffAccount("gallery-staff");
        Owner owner = owner(actor);
        Cat cat = createCat("One", owner, actor);
        Cat other = createCat("Two", owner, actor);
        byte[] jpeg = {(byte) 0xff, (byte) 0xd8, (byte) 0xff, (byte) 0xd9};
        when(normalizer.normalize(any())).thenReturn(new NormalizedCatPhoto(jpeg, 10, 10, "a".repeat(64)));
        var staff = httpBasic("gallery-staff", "gallery-test-password");

        mvc.perform(get(PHOTOS, cat.getId())).andExpect(status().isUnauthorized());
        UUID first = upload(cat.getId());
        UUID second = upload(cat.getId());
        assertThat(first).isNotEqualTo(second);

        mvc.perform(get(PHOTOS, cat.getId()).with(staff))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].id").value(second.toString()))
                .andExpect(jsonPath("$[1].id").value(first.toString()));
        mvc.perform(get(PHOTO, cat.getId(), first)).andExpect(status().isUnauthorized());
        mvc.perform(get(PHOTO, cat.getId(), first).with(staff))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.IMAGE_JPEG))
                .andExpect(header().string("Cache-Control", "no-store"))
                .andExpect(content().bytes(jpeg));
        mvc.perform(get(PHOTO, other.getId(), first).with(staff)).andExpect(status().isNotFound());
        mvc.perform(delete(PHOTO, other.getId(), first).with(staff)).andExpect(status().isNotFound());
        mvc.perform(delete(PHOTO, cat.getId(), first)).andExpect(status().isUnauthorized());
        mvc.perform(delete(PHOTO, cat.getId(), first).with(staff)).andExpect(status().isNoContent());
        mvc.perform(get(PHOTOS, cat.getId()).with(staff))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].id").value(second.toString()));
        mvc.perform(get("/api/cats/{id}", cat.getId()).with(staff))
                .andExpect(jsonPath("$.hasPhoto").value(false));

        cats.deleteById(cat.getId());
        mvc.perform(get(PHOTOS, cat.getId()).with(staff)).andExpect(status().isNotFound());
        mvc.perform(get(PHOTO, cat.getId(), second).with(staff)).andExpect(status().isNotFound());
    }

    @Test
    void createStoresPortraitAndEveryStagedAttachment() throws Exception {
        UserAccount actor = staffAccount("gallery-create");
        Owner owner = owner(actor);
        byte[] portrait = {1, 2};
        byte[] attachment = {3, 4};
        when(normalizer.normalize(any(MultipartFile.class))).thenAnswer(call -> {
            MultipartFile file = call.getArgument(0);
            return file.getName().equals("photo")
                    ? new NormalizedCatPhoto(portrait, 10, 10, "a".repeat(64))
                    : new NormalizedCatPhoto(attachment, 10, 10, "b".repeat(64));
        });
        var auth = httpBasic(actor.getUsername(), "gallery-test-password");
        var create = multipart("/api/cats").file(profile(owner, "New cat", null))
                .file(picture("photo", "portrait.jpg"));
        for (int i = 1; i <= 6; i++) create.file(picture("informationalPhotos", "record-" + i + ".jpg"));
        var response = mvc.perform(create.with(auth)).andExpect(status().isCreated())
                .andExpect(jsonPath("$.hasPhoto").value(true)).andReturn().getResponse();
        var catId = UUID.fromString(json.readTree(response.getContentAsString()).get("id").asString());
        mvc.perform(get("/api/cats/{id}/photo", catId).with(auth)).andExpect(content().bytes(portrait));
        var gallery = mvc.perform(get(PHOTOS, catId).with(auth))
                .andExpect(jsonPath("$.length()").value(6)).andReturn().getResponse();
        var photoId = json.readTree(gallery.getContentAsString()).get(0).get("id").asString();
        mvc.perform(get(PHOTO, catId, photoId).with(auth)).andExpect(content().bytes(attachment));
    }

    @Test
    void invalidStagedImageDoesNotWriteAnyPartOfTheUpdate() throws Exception {
        UserAccount actor = staffAccount("gallery-invalid");
        Owner owner = owner(actor);
        Cat cat = createCat("Before", owner, actor);
        when(normalizer.normalize(any(MultipartFile.class))).thenAnswer(call -> {
            MultipartFile file = call.getArgument(0);
            if ("broken.jpg".equals(file.getOriginalFilename())) {
                throw new CatPhotoException(CatPhotoErrorCode.CAT_PHOTO_UNDECODABLE);
            }
            return new NormalizedCatPhoto(new byte[] {1}, 10, 10, "a".repeat(64));
        });
        var auth = httpBasic(actor.getUsername(), "gallery-test-password");
        UUID saved = upload(cat.getId(), actor.getUsername());

        mvc.perform(multipart(HttpMethod.PUT, "/api/cats/{id}", cat.getId())
                        .file(profile(owner, "Edited", cat.getUpdatedAt(), saved))
                        .file(picture("photo", "portrait.jpg"))
                        .file(picture("informationalPhotos", "valid.jpg"))
                        .file(picture("informationalPhotos", "broken.jpg")).with(auth))
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.code").value("CAT_PHOTO_UNDECODABLE"));

        mvc.perform(get("/api/cats/{id}", cat.getId()).with(auth))
                .andExpect(jsonPath("$.name").value("Before")).andExpect(jsonPath("$.hasPhoto").value(false));
        mvc.perform(get(PHOTOS, cat.getId()).with(auth))
                .andExpect(jsonPath("$.length()").value(1)).andExpect(jsonPath("$[0].id").value(saved.toString()));
    }

    @Test
    void removingAnAttachmentFromAnotherCatRollsBackTheEntireUpdate() throws Exception {
        UserAccount actor = staffAccount("gallery-scope");
        Owner owner = owner(actor);
        Cat cat = createCat("Before", owner, actor);
        Cat other = createCat("Other", owner, actor);
        when(normalizer.normalize(any(MultipartFile.class)))
                .thenReturn(new NormalizedCatPhoto(new byte[] {1}, 10, 10, "a".repeat(64)));
        var auth = httpBasic(actor.getUsername(), "gallery-test-password");
        UUID saved = upload(cat.getId(), actor.getUsername());
        UUID foreign = upload(other.getId(), actor.getUsername());

        mvc.perform(multipart(HttpMethod.PUT, "/api/cats/{id}", cat.getId())
                        .file(profile(owner, "Edited", cat.getUpdatedAt(), saved, foreign))
                        .file(picture("photo", "portrait.jpg"))
                        .file(picture("informationalPhotos", "new.jpg")).with(auth))
                .andExpect(status().isNotFound());

        mvc.perform(get("/api/cats/{id}", cat.getId()).with(auth))
                .andExpect(jsonPath("$.name").value("Before")).andExpect(jsonPath("$.hasPhoto").value(false));
        mvc.perform(get(PHOTOS, cat.getId()).with(auth))
                .andExpect(jsonPath("$.length()").value(1)).andExpect(jsonPath("$[0].id").value(saved.toString()));
        mvc.perform(get(PHOTO, other.getId(), foreign).with(auth)).andExpect(status().isOk());
    }

    @Test
    void staleSaveLeavesImagesUntouchedAndCurrentSaveRetainsAnUnrelatedAddition() throws Exception {
        UserAccount actor = staffAccount("gallery-stale");
        Owner owner = owner(actor);
        Cat cat = createCat("Before", owner, actor);
        when(normalizer.normalize(any(MultipartFile.class)))
                .thenReturn(new NormalizedCatPhoto(new byte[] {1}, 10, 10, "a".repeat(64)));
        var auth = httpBasic(actor.getUsername(), "gallery-test-password");
        UUID saved = upload(cat.getId(), actor.getUsername());
        UUID unrelated = upload(cat.getId(), actor.getUsername());

        mvc.perform(multipart(HttpMethod.PUT, "/api/cats/{id}", cat.getId())
                        .file(profile(owner, "Stale edit", cat.getUpdatedAt().minusSeconds(1), saved))
                        .file(picture("informationalPhotos", "new.jpg")).with(auth))
                .andExpect(status().isConflict()).andExpect(jsonPath("$.code").value("CAT_EDIT_STALE"));
        mvc.perform(get(PHOTOS, cat.getId()).with(auth)).andExpect(jsonPath("$.length()").value(2));
        mvc.perform(get(PHOTO, cat.getId(), saved).with(auth)).andExpect(status().isOk());

        mvc.perform(multipart(HttpMethod.PUT, "/api/cats/{id}", cat.getId())
                        .file(profile(owner, "Edited", cat.getUpdatedAt(), saved))
                        .file(picture("informationalPhotos", "new.jpg")).with(auth))
                .andExpect(status().isOk()).andExpect(jsonPath("$.name").value("Edited"));
        mvc.perform(get(PHOTOS, cat.getId()).with(auth)).andExpect(jsonPath("$.length()").value(2));
        mvc.perform(get(PHOTO, cat.getId(), saved).with(auth)).andExpect(status().isNotFound());
        mvc.perform(get(PHOTO, cat.getId(), unrelated).with(auth)).andExpect(status().isOk());
    }

    private UserAccount staffAccount(String name) {
        return users.saveAndFlush(UserAccount.builder().username(name)
                .passwordHash(encoder.encode("gallery-test-password")).role(UserRole.STAFF).enabled(true).build());
    }

    private Owner owner(UserAccount actor) {
        return owners.saveAndFlush(Owner.builder().fullName("Gallery Owner").primaryPhone("555")
                .createdBy(actor).build());
    }

    private MockMultipartFile picture(String part, String filename) {
        return new MockMultipartFile(part, filename, "image/jpeg", new byte[] {1});
    }

    private MockMultipartFile profile(Owner owner, String name, Instant updatedAt, UUID... removed) {
        var request = new HashMap<String, Object>();
        request.put("name", name);
        request.put("birthDate", "2020-01-01");
        request.put("sex", "MALE");
        request.put("ownerId", owner.getId());
        if (updatedAt != null) request.put("expectedUpdatedAt", updatedAt.toString());
        if (removed.length > 0) request.put("removedInformationalPhotoIds", List.of(removed));
        return new MockMultipartFile("cat", "", "application/json", json.writeValueAsBytes(request));
    }

    private Cat createCat(String name, Owner owner, UserAccount actor) {
        var cat = cats.saveAndFlush(Cat.builder().name(name).birthDate(LocalDate.of(2020, 1, 1))
                .sex(Sex.MALE).owner(owner).createdBy(actor).build());
        return cats.findById(cat.getId()).orElseThrow();
    }

    private UUID upload(UUID catId) throws Exception {
        return upload(catId, "gallery-staff");
    }

    private UUID upload(UUID catId, String username) throws Exception {
        var upload = new MockMultipartFile("photo", "record.jpg", "image/jpeg", new byte[] {1});
        var response = mvc.perform(multipart(PHOTOS, catId).file(upload)
                        .with(httpBasic(username, "gallery-test-password")))
                .andExpect(status().isCreated()).andReturn().getResponse();
        return UUID.fromString(json.readTree(response.getContentAsString()).get("id").asString());
    }
}
