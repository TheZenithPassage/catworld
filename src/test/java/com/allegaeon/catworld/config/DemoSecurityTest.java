package com.allegaeon.catworld.config;

import com.allegaeon.catworld.security.DemoRequestFilter;
import com.allegaeon.catworld.service.DemoActivityService;
import jakarta.servlet.ServletException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
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
class DemoSecurityTest {
    private static final String GENERATION_HEADER = "X-CatWorld-Demo-Generation";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JdbcTemplate jdbc;

    @Autowired
    private DemoActivityService demoActivity;

    @BeforeEach
    void clearActivity() {
        jdbc.execute("""
                CREATE TABLE IF NOT EXISTS demo_activity (
                    id INT PRIMARY KEY, generation CHAR(36) NOT NULL,
                    pending_writes INT NOT NULL DEFAULT 0, last_changed_at DATETIME(6)
                )
                """);
        jdbc.update("DELETE FROM demo_activity");
        jdbc.update("INSERT INTO demo_activity (id, generation) VALUES (1, ?)",
                "45a8adf6-01b7-4da1-aa84-91f57426d242");
    }

    @Test
    void demoCanReadBusinessDataButCanNeverChangeAccounts() throws Exception {
        String generation = login();

        mockMvc.perform(get("/api/owners").with(httpBasic("demo", "internal-demo-password")))
                .andExpect(status().isOk());
        mockMvc.perform(post("/api/users")
                        .with(httpBasic("demo", "internal-demo-password"))
                        .header(GENERATION_HEADER, generation))
                .andExpect(status().isForbidden());
        mockMvc.perform(patch("/api/users/1/enabled")
                        .with(httpBasic("demo", "internal-demo-password"))
                        .header(GENERATION_HEADER, generation))
                .andExpect(status().isForbidden());
        assertNull(lastActivity());
        assertEquals(0, pendingWrites());
    }

    @Test
    void onlySuccessfulCurrentGenerationWritesDelayAnHourlyReset() throws Exception {
        String generation = login();
        assertNull(lastActivity());
        assertEquals(0, pendingWrites());

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

}
