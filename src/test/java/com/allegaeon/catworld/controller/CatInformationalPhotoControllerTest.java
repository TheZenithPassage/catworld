package com.allegaeon.catworld.controller;

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
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import tools.jackson.databind.ObjectMapper;

import java.time.LocalDate;
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
        UserAccount actor = users.saveAndFlush(UserAccount.builder().username("gallery-staff")
                .passwordHash(encoder.encode("gallery-test-password")).role(UserRole.STAFF).enabled(true).build());
        Owner owner = owners.saveAndFlush(Owner.builder().fullName("Gallery Owner").primaryPhone("555")
                .createdBy(actor).build());
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

    private Cat createCat(String name, Owner owner, UserAccount actor) {
        return cats.saveAndFlush(Cat.builder().name(name).birthDate(LocalDate.of(2020, 1, 1))
                .sex(Sex.MALE).owner(owner).createdBy(actor).build());
    }

    private UUID upload(UUID catId) throws Exception {
        var upload = new MockMultipartFile("photo", "record.jpg", "image/jpeg", new byte[] {1});
        var response = mvc.perform(multipart(PHOTOS, catId).file(upload)
                        .with(httpBasic("gallery-staff", "gallery-test-password")))
                .andExpect(status().isCreated()).andReturn().getResponse();
        return UUID.fromString(json.readTree(response.getContentAsString()).get("id").asString());
    }
}
