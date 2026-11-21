package com.allegaeon.catworld.controller;

import com.allegaeon.catworld.dto.CatIntakeDtos.InviteRequest;
import com.allegaeon.catworld.dto.CatIntakeDtos.IssuedInvite;
import com.allegaeon.catworld.model.Cat;
import com.allegaeon.catworld.model.Owner;
import com.allegaeon.catworld.model.Sex;
import com.allegaeon.catworld.repository.CatInformationalPhotoRepository;
import com.allegaeon.catworld.repository.CatIntakePhotoRepository;
import com.allegaeon.catworld.repository.CatIntakeReviewRepository;
import com.allegaeon.catworld.repository.CatPhotoRepository;
import com.allegaeon.catworld.repository.CatRepository;
import com.allegaeon.catworld.repository.OwnerRepository;
import com.allegaeon.catworld.repository.UserAccountRepository;
import com.allegaeon.catworld.service.CatIntakeService;
import com.allegaeon.catworld.service.LibVipsCatPhotoNormalizer;
import com.allegaeon.catworld.service.NormalizedCatPhoto;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.context.bean.override.mockito.MockitoSpyBean;
import org.springframework.test.web.servlet.MockMvc;

import java.net.URI;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.doReturn;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:catworld_intake_preview;MODE=MySQL",
        "CATWORLD_INTAKE_URL=http://localhost:4202/"
})
@AutoConfigureMockMvc
@ActiveProfiles("test")
class CatIntakePhotoPreviewTest {
    private static final String PREVIEW = "/api/intake/photo-preview";
    private static final String RECIPIENT_ORIGIN = "http://localhost:4202";
    private static final Instant NOW = Instant.parse("2026-10-05T13:00:00Z");
    private static final byte[] JPEG = {(byte) 0xff, (byte) 0xd8, (byte) 0xff, (byte) 0xd9};

    @Autowired MockMvc mvc;
    @Autowired CatIntakeService intake;
    @Autowired OwnerRepository owners;
    @Autowired UserAccountRepository users;
    @Autowired CatRepository cats;
    @Autowired CatIntakeReviewRepository reviews;
    @Autowired CatIntakePhotoRepository evidence;
    @Autowired CatInformationalPhotoRepository gallery;
    @Autowired CatPhotoRepository profilePhotos;
    @MockitoBean Clock clock;
    @MockitoSpyBean LibVipsCatPhotoNormalizer normalizer;

    @BeforeEach
    void setClock() {
        when(clock.instant()).thenReturn(NOW);
        when(clock.getZone()).thenReturn(ZoneId.of("America/Argentina/Buenos_Aires"));
    }

    @Test
    void returnsTransientJpegAndLeavesTheInvitationOpen() throws Exception {
        var invite = issue();
        String authorization = authorization(invite.url());
        var photo = image(new byte[] {1, 2, 3});
        doReturn(new NormalizedCatPhoto(JPEG, 10, 10, "a".repeat(64))).when(normalizer).normalize(photo);
        var before = persistedCounts();

        mvc.perform(multipart(PREVIEW).file(photo).header(HttpHeaders.AUTHORIZATION, authorization)
                        .header(HttpHeaders.ORIGIN, RECIPIENT_ORIGIN))
                .andExpect(status().isOk())
                .andExpect(header().string(HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN, RECIPIENT_ORIGIN))
                .andExpect(header().string(HttpHeaders.CACHE_CONTROL, "no-store"))
                .andExpect(content().contentType(MediaType.IMAGE_JPEG))
                .andExpect(content().bytes(JPEG));

        assertThat(persistedCounts()).isEqualTo(before);
        mvc.perform(get("/api/intake/request").header(HttpHeaders.AUTHORIZATION, authorization))
                .andExpect(status().isOk());
    }

    @Test
    void rejectsMissingUnknownExpiredAndRevokedTokensBeforeCallingTheNormalizer() throws Exception {
        var revoked = issue();
        intake.revoke(revoked.id());
        var expired = issue();
        when(clock.instant()).thenReturn(NOW.plus(7, ChronoUnit.DAYS));
        var photo = image(new byte[] {1, 2, 3});

        mvc.perform(multipart(PREVIEW).file(photo))
                .andExpect(status().isNotFound())
                .andExpect(header().string(HttpHeaders.CACHE_CONTROL, "no-store"));
        for (String authorization : List.of(authorization(revoked.url()), authorization(expired.url()),
                "Bearer " + "Z".repeat(43))) {
            mvc.perform(multipart(PREVIEW).file(photo).header(HttpHeaders.AUTHORIZATION, authorization))
                    .andExpect(status().isNotFound());
        }
        verifyNoInteractions(normalizer);
    }

    @Test
    void rejectsAnInvitationWhoseOnlyCatIsNoLongerEligible() throws Exception {
        var owner = tutor();
        var cat = cats.saveAndFlush(Cat.builder().owner(owner).createdBy(owner.getCreatedBy())
                .name("Scoped Cat").sex(Sex.MALE).birthDate(LocalDate.of(2020, 1, 1)).build());
        var invite = intake.issue(new InviteRequest(owner.getId(), false, null));
        cat.setDeceased(true);
        cats.saveAndFlush(cat);

        mvc.perform(multipart(PREVIEW).file(image(new byte[] {1, 2, 3}))
                        .header(HttpHeaders.AUTHORIZATION, authorization(invite.url())))
                .andExpect(status().isNotFound());
        verifyNoInteractions(normalizer);
    }

    @Test
    void rejectsTheAdminOriginAndPermitsTheRecipientPreflight() throws Exception {
        String authorization = authorization(issue().url());
        mvc.perform(multipart(PREVIEW).file(image(new byte[] {1, 2, 3}))
                        .header(HttpHeaders.AUTHORIZATION, authorization)
                        .header(HttpHeaders.ORIGIN, "http://localhost:4200"))
                .andExpect(status().isForbidden());
        mvc.perform(options(PREVIEW).header(HttpHeaders.ORIGIN, RECIPIENT_ORIGIN)
                        .header(HttpHeaders.ACCESS_CONTROL_REQUEST_METHOD, "POST")
                        .header(HttpHeaders.ACCESS_CONTROL_REQUEST_HEADERS, "authorization"))
                .andExpect(status().isOk())
                .andExpect(header().string(HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN, RECIPIENT_ORIGIN));
        verifyNoInteractions(normalizer);
    }

    @Test
    void usesTheSubmissionLimitAndRejectsUnsupportedContentDespiteTheFilename() throws Exception {
        String authorization = authorization(issue().url());
        mvc.perform(multipart(PREVIEW).file(image(new byte[8 * 1024 * 1024 + 1]))
                        .header(HttpHeaders.AUTHORIZATION, authorization))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("CAT_PHOTO_FILE_TOO_LARGE"));
        mvc.perform(multipart(PREVIEW).file(image(new byte[] {1, 2, 3}))
                        .header(HttpHeaders.AUTHORIZATION, authorization))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("CAT_PHOTO_UNSUPPORTED_FORMAT"));
    }

    private IssuedInvite issue() {
        return intake.issue(new InviteRequest(tutor().getId(), true, null));
    }

    private Owner tutor() {
        return owners.saveAndFlush(Owner.builder().fullName("Preview Tutor").primaryPhone("555")
                .createdBy(users.findByUsername("test-admin").orElseThrow()).build());
    }

    private static String authorization(String url) {
        return "Bearer " + URI.create(url).getFragment().substring("token=".length());
    }

    private static MockMultipartFile image(byte[] bytes) {
        return new MockMultipartFile("photo", "evidence.jpg", MediaType.IMAGE_JPEG_VALUE, bytes);
    }

    private List<Long> persistedCounts() {
        return List.of(cats.count(), reviews.count(), evidence.count(), gallery.count(), profilePhotos.count());
    }
}
