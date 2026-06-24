package com.allegaeon.catworld.config;

import com.allegaeon.catworld.model.UserAccount;
import com.allegaeon.catworld.model.UserRole;
import com.allegaeon.catworld.repository.UserAccountRepository;
import com.allegaeon.catworld.security.UserAccountBootstrap;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.hamcrest.Matchers.is;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.httpBasic;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(properties = {
        "catworld.security.username=test-admin",
        "catworld.security.password=test-password",
        "catworld.security.cors-allowed-origins=http://localhost:4200"
})
@AutoConfigureMockMvc
@ActiveProfiles("test")
class SecurityConfigTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserAccountRepository userAccountRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private UserAccountBootstrap userAccountBootstrap;

    @BeforeEach
    void bootstrapUserAccounts() {
        userAccountRepository.deleteAll();
        userAccountBootstrap.bootstrapFirstAdminIfRequired();
    }

    @Test
    void apiRequestWithoutAuthenticationReturnsUnauthorized() throws Exception {
        mockMvc.perform(get("/api/owners"))
                .andExpect(status().isUnauthorized())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.error", is("Unauthorized")));
    }

    @Test
    void loginWithBootstrapCredentialsReturnsAuthenticatedUser() throws Exception {
        assertEquals(1, userAccountRepository.count());
        UserAccount administrator = userAccountRepository.findAll().get(0);
        assertEquals("test-admin", administrator.getUsername());
        assertTrue(passwordEncoder.matches("test-password", administrator.getPasswordHash()));

        mockMvc.perform(post("/api/auth/login")
                        .with(httpBasic("test-admin", "test-password")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username", is("test-admin")))
                .andExpect(jsonPath("$.role", is("ADMIN")));
    }

    @Test
    void loginWithValidDatabaseCredentialsReturnsAuthenticatedUser() throws Exception {
        String username = "staff-user-" + UUID.randomUUID();
        saveUser(username, "staff-password", UserRole.STAFF, true);

        mockMvc.perform(post("/api/auth/login")
                        .with(httpBasic(username, "staff-password")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username", is(username)))
                .andExpect(jsonPath("$.role", is("STAFF")))
                .andExpect(jsonPath("$.passwordHash").doesNotExist())
                .andExpect(jsonPath("$.enabled").doesNotExist())
                .andExpect(jsonPath("$.id").doesNotExist())
                .andExpect(jsonPath("$.createdAt").doesNotExist())
                .andExpect(jsonPath("$.updatedAt").doesNotExist())
                .andExpect(jsonPath("$.password").doesNotExist());
    }

    @Test
    void loginNormalizesUsernameBeforeLookup() throws Exception {
        saveUser("admin", "admin-password", UserRole.ADMIN, true);

        mockMvc.perform(post("/api/auth/login")
                        .with(httpBasic("Admin", "admin-password")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username", is("admin")))
                .andExpect(jsonPath("$.role", is("ADMIN")));
    }

    @Test
    void loginWithInvalidCredentialsReturnsUnauthorized() throws Exception {
        mockMvc.perform(post("/api/auth/login")
                        .with(httpBasic("test-admin", "wrong-password")))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error", is("Unauthorized")));
    }

    @Test
    void loginWithDisabledUserReturnsUnauthorized() throws Exception {
        String username = "disabled-user-" + UUID.randomUUID();
        saveUser(username, "disabled-password", UserRole.STAFF, false);

        mockMvc.perform(post("/api/auth/login")
                        .with(httpBasic(username, "disabled-password")))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error", is("Unauthorized")));
    }

    @Test
    void corsPreflightRequestIsAllowed() throws Exception {
        mockMvc.perform(options("/api/owners")
                        .header("Origin", "http://localhost:4200")
                        .header("Access-Control-Request-Method", "GET")
                        .header("Access-Control-Request-Headers", "Authorization"))
                .andExpect(status().isOk())
                .andExpect(header().string("Access-Control-Allow-Origin", "http://localhost:4200"));
    }

    private void saveUser(String username, String password, UserRole role, boolean enabled) {
        userAccountRepository.saveAndFlush(UserAccount.builder()
                .username(username)
                .passwordHash(passwordEncoder.encode(password))
                .role(role)
                .enabled(enabled)
                .build());
    }
}
