package com.allegaeon.catworld.config;

import com.allegaeon.catworld.security.DemoRequestFilter;
import com.allegaeon.catworld.service.DemoActivityService;
import jakarta.servlet.ServletException;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestInstance;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.core.io.ClassPathResource;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.init.ResourceDatabasePopulator;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.nio.charset.StandardCharsets;
import java.time.Clock;
import java.time.Instant;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.httpBasic;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(properties = {
        "catworld.demo.enabled=true",
        "spring.datasource.url=jdbc:h2:mem:catworld_demo_test;DB_CLOSE_DELAY=-1;MODE=MySQL",
        "catworld.security.username=demo",
        "catworld.security.password=internal-demo-password"
})
@AutoConfigureMockMvc
@ActiveProfiles("test")
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
class DemoSecurityTest {
    private static final String GENERATION_HEADER = "X-CatWorld-Demo-Generation";

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private Clock clock;

    @Autowired
    private JdbcTemplate jdbc;

    @Autowired
    private DemoActivityService demoActivity;

    @BeforeAll
    void applyDemoMigrations() {
        new ResourceDatabasePopulator(new ClassPathResource("db/demo/V32_1__add_demo_reset_controls.sql"),
                new ClassPathResource("db/demo/R__demo_activity.sql")).execute(jdbc.getDataSource());
    }

    @BeforeEach
    void clearActivity() {
        when(clock.instant()).thenReturn(Instant.parse("2026-11-25T22:00:00Z"));
        jdbc.update("""
                UPDATE demo_activity
                SET generation = ?, pending_writes = 0, last_changed_at = NULL, photo_uploads = 0
                WHERE id = 1
                """, "45a8adf6-01b7-4da1-aa84-91f57426d242");
        jdbc.update("""
                UPDATE demo_reset_state
                SET queued_at = NULL, accepted_at = NULL, quota_day = NULL, accepted_count = 0
                WHERE id = 1
                """);
        jdbc.update("DELETE FROM demo_reset_ip_usage");
        jdbc.update("DELETE FROM user_accounts WHERE username IN ('demo-staff', 'another-admin')");
    }

    @Test
    void adminCanCreateAnAccountThatCanSignInButStaffCannotManageAccounts() throws Exception {
        String generation = login();

        mockMvc.perform(post("/api/users")
                        .with(httpBasic("demo", "internal-demo-password"))
                        .header(GENERATION_HEADER, generation)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"username":"demo-staff","password":"staff-password","role":"STAFF"}
                                """))
                .andExpect(status().isCreated());
        assertNotNull(lastActivity());
        assertEquals(0, pendingWrites());

        mockMvc.perform(post("/api/auth/login").with(httpBasic("demo-staff", "staff-password")))
                .andExpect(status().isOk())
                .andExpect(header().string(GENERATION_HEADER, generation))
                .andExpect(jsonPath("$.role").value("STAFF"));
        mockMvc.perform(get("/api/owners").with(httpBasic("demo-staff", "staff-password")))
                .andExpect(status().isOk());
        mockMvc.perform(get("/api/users").with(httpBasic("demo-staff", "staff-password")))
                .andExpect(status().isForbidden());
        mockMvc.perform(get("/api/demo/status").with(httpBasic("demo-staff", "staff-password")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.hasAdditionalAccounts").value(true));
    }

    @Test
    void sharedAccountCannotBeChangedEvenByAnotherAdmin() throws Exception {
        String generation = login();
        mockMvc.perform(post("/api/users")
                        .with(httpBasic("demo", "internal-demo-password"))
                        .header(GENERATION_HEADER, generation)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"username":"another-admin","password":"admin-password","role":"ADMIN"}
                                """))
                .andExpect(status().isCreated());
        jdbc.update("UPDATE demo_activity SET last_changed_at = NULL WHERE id = 1");
        UUID sharedId = jdbc.queryForObject("SELECT id FROM user_accounts WHERE username = 'demo'", UUID.class);

        mockMvc.perform(patch("/api/users/{id}/role", sharedId)
                        .with(httpBasic("another-admin", "admin-password"))
                        .header(GENERATION_HEADER, generation)
                        .contentType(MediaType.APPLICATION_JSON).content("{\"role\":\"STAFF\"}"))
                .andExpect(status().isForbidden());
        mockMvc.perform(patch("/api/users/{id}/enabled", sharedId)
                        .with(httpBasic("another-admin", "admin-password"))
                        .header(GENERATION_HEADER, generation)
                        .contentType(MediaType.APPLICATION_JSON).content("{\"enabled\":false}"))
                .andExpect(status().isForbidden());
        mockMvc.perform(delete("/api/users/{id}", sharedId)
                        .with(httpBasic("another-admin", "admin-password"))
                        .header(GENERATION_HEADER, generation))
                .andExpect(status().isForbidden());
        assertNull(lastActivity());
        assertEquals(0, pendingWrites());
    }

    @Test
    void resetSkipsCleanDataAndCountsOnlyAcceptedRequests() throws Exception {
        mockMvc.perform(get("/api/demo/status")).andExpect(status().isUnauthorized());
        mockMvc.perform(post("/api/demo/reset").with(httpBasic("demo", "internal-demo-password")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.hasAdditionalAccounts").value(false))
                .andExpect(jsonPath("$.resetState").value("CLEAN"))
                .andExpect(jsonPath("$.nextScheduledCheckAt").value("2026-11-25T23:00:00Z"));

        jdbc.update("UPDATE demo_activity SET pending_writes = 1 WHERE id = 1");
        mockMvc.perform(post("/api/demo/reset").with(httpBasic("demo", "internal-demo-password")))
                .andExpect(status().isAccepted())
                .andExpect(jsonPath("$.resetState").value("QUEUED"));
        mockMvc.perform(post("/api/demo/reset").with(httpBasic("demo", "internal-demo-password")))
                .andExpect(status().isAccepted())
                .andExpect(jsonPath("$.resetState").value("QUEUED"));
        assertNull(lastActivity());
        assertEquals(1, pendingWrites());
        assertEquals(1,
                jdbc.queryForObject("SELECT accepted_count FROM demo_reset_state WHERE id = 1", Integer.class));

        jdbc.update("UPDATE demo_reset_state SET queued_at = NULL WHERE id = 1");
        mockMvc.perform(post("/api/demo/reset").with(httpBasic("demo", "internal-demo-password")))
                .andExpect(status().isTooManyRequests())
                .andExpect(jsonPath("$.resetState").value("COOLDOWN"))
                .andExpect(jsonPath("$.resetAvailableAt").value("2026-11-25T22:02:00Z"));
    }

    @Test
    void madridMidnightResetsIpQuota() throws Exception {
        jdbc.update("UPDATE demo_activity SET last_changed_at = CURRENT_TIMESTAMP WHERE id = 1");
        jdbc.update("UPDATE demo_reset_state SET quota_day = DATE '2026-11-25', accepted_count = 3 WHERE id = 1");
        jdbc.update("INSERT INTO demo_reset_ip_usage (client_ip, accepted_count) VALUES ('192.0.2.1', 3)");

        mockMvc.perform(post("/api/demo/reset").with(httpBasic("demo", "internal-demo-password"))
                        .header("X-CatWorld-Demo-Client-IP", "192.0.2.1"))
                .andExpect(status().isTooManyRequests())
                .andExpect(jsonPath("$.resetState").value("LIMIT_REACHED"))
                .andExpect(jsonPath("$.resetAvailableAt").value("2026-11-25T23:00:00Z"));

        mockMvc.perform(get("/api/demo/status").with(httpBasic("demo", "internal-demo-password"))
                        .header("X-CatWorld-Demo-Client-IP", "192.0.2.2"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.resetState").value("AVAILABLE"));
        jdbc.update("UPDATE demo_reset_state SET accepted_count = 6 WHERE id = 1");
        mockMvc.perform(post("/api/demo/reset").with(httpBasic("demo", "internal-demo-password"))
                        .header("X-CatWorld-Demo-Client-IP", "192.0.2.2"))
                .andExpect(status().isTooManyRequests())
                .andExpect(jsonPath("$.resetState").value("LIMIT_REACHED"));

        when(clock.instant()).thenReturn(Instant.parse("2026-11-25T23:00:00Z"));
        mockMvc.perform(post("/api/demo/reset").with(httpBasic("demo", "internal-demo-password"))
                        .header("X-CatWorld-Demo-Client-IP", "192.0.2.1"))
                .andExpect(status().isAccepted());
        assertEquals(1,
                jdbc.queryForObject("SELECT accepted_count FROM demo_reset_state WHERE id = 1", Integer.class));
    }

    @Test
    void exhaustedPhotoQuotaAllowsCreatingCatsWithoutPhotos() throws Exception {
        String generation = login();
        mockMvc.perform(post("/api/owners").with(httpBasic("demo", "internal-demo-password"))
                        .header(GENERATION_HEADER, generation)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"fullName":"Demo Cat Owner","primaryPhone":"123456789"}
                                """))
                .andExpect(status().isCreated());
        UUID ownerId = jdbc.queryForObject("SELECT id FROM owners WHERE full_name = 'Demo Cat Owner'", UUID.class);
        var cat = new MockMultipartFile("cat", "cat.json", MediaType.APPLICATION_JSON_VALUE, """
                {"name":"Demo Cat","birthYear":2020,"sex":"MALE","ownerId":"%s",
                 "expectedUpdatedAt":"2026-11-25T22:00:00Z"}
                """.formatted(ownerId).getBytes(StandardCharsets.UTF_8));
        jdbc.update("UPDATE demo_activity SET photo_uploads = 32 WHERE id = 1");

        mockMvc.perform(multipart("/api/cats").file(cat)
                        .with(httpBasic("demo", "internal-demo-password"))
                        .header(GENERATION_HEADER, generation))
                .andExpect(status().isCreated());
        UUID catId = jdbc.queryForObject("SELECT id FROM cats WHERE name = 'Demo Cat'", UUID.class);
        var photo = new MockMultipartFile("photo", "profile.jpg", "image/jpeg", new byte[]{1});
        var galleryPhoto = new MockMultipartFile("informationalPhotos", "gallery.jpg", "image/jpeg", new byte[]{2});
        mockMvc.perform(multipart("/api/cats").file(cat).file(galleryPhoto)
                        .with(httpBasic("demo", "internal-demo-password"))
                        .header(GENERATION_HEADER, generation))
                .andExpect(status().isTooManyRequests());
        mockMvc.perform(multipart(HttpMethod.PUT, "/api/cats/{id}", catId).file(cat).file(photo)
                        .with(httpBasic("demo", "internal-demo-password"))
                        .header(GENERATION_HEADER, generation))
                .andExpect(status().isTooManyRequests());
        mockMvc.perform(multipart("/api/cats/{id}/informational-photos", catId).file(photo)
                        .with(httpBasic("demo", "internal-demo-password"))
                        .header(GENERATION_HEADER, generation))
                .andExpect(status().isTooManyRequests());
        assertEquals(32, photoUploads());
    }

    @Test
    void photoQuotaOnlyCountsNonemptyUploadsAndStopsProcessingAtTheLimit() throws Exception {
        String generation = login();
        jdbc.update("UPDATE demo_activity SET photo_uploads = 31 WHERE id = 1");

        mockMvc.perform(multipart("/api/cats/photo-preview")
                        .file(new MockMultipartFile("photo", "empty.jpg", "image/jpeg", new byte[0]))
                        .with(httpBasic("demo", "internal-demo-password"))
                        .header(GENERATION_HEADER, generation))
                .andExpect(status().isBadRequest());
        assertEquals(31, photoUploads());

        MockMultipartFile invalidPhoto = new MockMultipartFile("photo", "invalid.jpg", "image/jpeg", new byte[]{1});
        mockMvc.perform(multipart("/api/cats/photo-preview").file(invalidPhoto)
                        .with(httpBasic("demo", "internal-demo-password"))
                        .header(GENERATION_HEADER, generation))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("CAT_PHOTO_UNSUPPORTED_FORMAT"));
        mockMvc.perform(multipart("/api/cats/photo-preview").file(invalidPhoto)
                        .with(httpBasic("demo", "internal-demo-password"))
                        .accept(MediaType.IMAGE_JPEG)
                        .header(GENERATION_HEADER, generation))
                .andExpect(status().isTooManyRequests())
                .andExpect(jsonPath("$.code").value("DEMO_PHOTO_UPLOAD_LIMIT_REACHED"));
        assertEquals(32, photoUploads());
        assertNull(lastActivity());
        assertEquals(0, pendingWrites());
        mockMvc.perform(get("/api/demo/status").with(httpBasic("demo", "internal-demo-password")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.resetState").value("AVAILABLE"));
    }

    @Test
    void onlySuccessfulCurrentGenerationWritesDelayAnHourlyReset() throws Exception {
        String generation = login();
        assertNull(lastActivity());
        assertEquals(0, pendingWrites());

        var preview = new MockHttpServletRequest("POST", "/api/stays/" + UUID.randomUUID() + "/pending-price-preview");
        preview.addHeader(GENERATION_HEADER, generation);
        new DemoRequestFilter(demoActivity).doFilter(preview, new MockHttpServletResponse(),
                (request, response) -> assertEquals(0, pendingWrites()));
        assertNull(lastActivity());

        mockMvc.perform(post("/api/owners").with(httpBasic("demo", "internal-demo-password"))
                        .header(GENERATION_HEADER, "stale"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.error").value("DEMO_RELOAD_REQUIRED"));
        mockMvc.perform(post("/api/owners").with(httpBasic("demo", "internal-demo-password"))
                        .header(GENERATION_HEADER, generation)
                        .contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isBadRequest());
        assertNull(lastActivity());

        mockMvc.perform(post("/api/owners").with(httpBasic("demo", "internal-demo-password"))
                        .header(GENERATION_HEADER, generation)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"fullName":"Demo Visitor","primaryPhone":"123456789"}
                                """))
                .andExpect(status().isCreated());
        assertNotNull(lastActivity());
        assertEquals(0, pendingWrites());
    }

    @Test
    void interruptedWriteLeavesDurableMarkerForTheResetProcess() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest("POST", "/api/owners");
        request.addHeader(GENERATION_HEADER, login());
        DemoRequestFilter filter = new DemoRequestFilter(demoActivity);
        assertThrows(ServletException.class, () -> filter.doFilter(request, new MockHttpServletResponse(),
                (incoming, response) -> { throw new ServletException("Interruption after a possible commit"); }));
        assertNull(lastActivity());
        assertEquals(1, pendingWrites());
    }

    @Test
    void loginUsesTheCurrentWorkspaceGeneration() throws Exception {
        assertEquals("45a8adf6-01b7-4da1-aa84-91f57426d242", login());
        jdbc.update("UPDATE demo_activity SET generation = ? WHERE id = 1", "331fcb6c-9ad4-402a-8f05-4638ce208b04");
        assertEquals("331fcb6c-9ad4-402a-8f05-4638ce208b04", login());
    }

    @Test
    void removedAccountWithStaleGenerationReceivesReloadRequiredOnlyWhenWriting() throws Exception {
        String generation = login();
        jdbc.update("UPDATE demo_activity SET generation = ? WHERE id = 1",
                "331fcb6c-9ad4-402a-8f05-4638ce208b04");
        var removedAccount = httpBasic("removed-account", "old-password");

        mockMvc.perform(post("/api/auth/login").with(removedAccount).header(GENERATION_HEADER, generation))
                .andExpect(status().isUnauthorized());
        mockMvc.perform(get("/api/owners").with(removedAccount).header(GENERATION_HEADER, generation))
                .andExpect(status().isUnauthorized());
        mockMvc.perform(post("/api/owners").with(removedAccount))
                .andExpect(status().isUnauthorized());
        mockMvc.perform(post("/api/owners").with(removedAccount).header(GENERATION_HEADER, generation))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.error").value("DEMO_RELOAD_REQUIRED"));
        assertNull(lastActivity());
        assertEquals(0, pendingWrites());
    }

    private String login() throws Exception {
        return mockMvc.perform(post("/api/auth/login").with(httpBasic("demo", "internal-demo-password")))
                .andExpect(status().isOk())
                .andExpect(header().exists(GENERATION_HEADER))
                .andReturn().getResponse().getHeader(GENERATION_HEADER);
    }

    private Object lastActivity() {
        return jdbc.queryForObject("SELECT last_changed_at FROM demo_activity WHERE id = 1", Object.class);
    }

    private int pendingWrites() {
        return jdbc.queryForObject("SELECT pending_writes FROM demo_activity WHERE id = 1", Integer.class);
    }

    private int photoUploads() {
        return jdbc.queryForObject("SELECT photo_uploads FROM demo_activity WHERE id = 1", Integer.class);
    }

}
