package com.allegaeon.catworld.controller;

import com.allegaeon.catworld.model.UserAccount;
import com.allegaeon.catworld.model.UserRole;
import com.allegaeon.catworld.repository.UserAccountRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

import java.util.UUID;
import java.util.stream.Stream;

import static org.hamcrest.Matchers.is;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.httpBasic;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(properties = {
        "catworld.security.username=test-admin",
        "catworld.security.password=test-password",
        "catworld.security.cors-allowed-origins=http://localhost:4200"
})
@AutoConfigureMockMvc
@ActiveProfiles("test")
class UserAccountControllerSecurityTest {

    private static final String ADMIN_USERNAME = "admin-user";
    private static final String ADMIN_PASSWORD = "admin-password";
    private static final String STAFF_USERNAME = "staff-user";
    private static final String STAFF_PASSWORD = "staff-password";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserAccountRepository userAccountRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private UserAccount administrator;
    private UserAccount staff;

    @BeforeEach
    void setUpUsers() {
        userAccountRepository.deleteAll();
        administrator = saveUser(ADMIN_USERNAME, ADMIN_PASSWORD, UserRole.ADMIN, true);
        staff = saveUser(STAFF_USERNAME, STAFF_PASSWORD, UserRole.STAFF, true);
    }

    @Test
    void adminCanListUsersWithoutPasswordData() throws Exception {
        mockMvc.perform(get("/api/users").with(httpBasic(ADMIN_USERNAME, ADMIN_PASSWORD)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.username == 'admin-user')].role").value(UserRole.ADMIN.name()))
                .andExpect(jsonPath("$[?(@.username == 'staff-user')].role").value(UserRole.STAFF.name()))
                .andExpect(jsonPath("$[0].password").doesNotExist())
                .andExpect(jsonPath("$[0].passwordHash").doesNotExist());
    }

    @Test
    void adminCanCreateNormalizedUserWhosePasswordIsEncodedAndAuthenticates() throws Exception {
        String request = """
                {"username":" New-User ","password":" new-password ","role":"STAFF"}
                """;

        mockMvc.perform(post("/api/users")
                        .with(httpBasic(ADMIN_USERNAME, ADMIN_PASSWORD))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(request))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.username", is("new-user")))
                .andExpect(jsonPath("$.role", is("STAFF")))
                .andExpect(jsonPath("$.enabled", is(true)))
                .andExpect(jsonPath("$.password").doesNotExist())
                .andExpect(jsonPath("$.passwordHash").doesNotExist());

        UserAccount created = userAccountRepository.findByUsername("new-user").orElseThrow();
        assertNotEquals(" new-password ", created.getPasswordHash());
        assertTrue(passwordEncoder.matches(" new-password ", created.getPasswordHash()));

        mockMvc.perform(post("/api/auth/login").with(httpBasic("NEW-USER", " new-password ")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username", is("new-user")));
    }

    @Test
    void adminCanChangeUserRole() throws Exception {
        mockMvc.perform(patch("/api/users/{id}/role", staff.getId())
                        .with(httpBasic(ADMIN_USERNAME, ADMIN_PASSWORD))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"role\":\"ADMIN\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id", is(staff.getId().toString())))
                .andExpect(jsonPath("$.role", is("ADMIN")));

        assertEquals(UserRole.ADMIN, userAccountRepository.findById(staff.getId()).orElseThrow().getRole());
    }

    @Test
    void adminCanDisableAndEnableUserAndDisabledUserCannotAuthenticate() throws Exception {
        mockMvc.perform(patch("/api/users/{id}/enabled", staff.getId())
                        .with(httpBasic(ADMIN_USERNAME, ADMIN_PASSWORD))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"enabled\":false}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.enabled", is(false)));

        assertFalse(userAccountRepository.findById(staff.getId()).orElseThrow().isEnabled());
        mockMvc.perform(post("/api/auth/login").with(httpBasic(STAFF_USERNAME, STAFF_PASSWORD)))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(patch("/api/users/{id}/enabled", staff.getId())
                        .with(httpBasic(ADMIN_USERNAME, ADMIN_PASSWORD))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"enabled\":true}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.enabled", is(true)));

        mockMvc.perform(post("/api/auth/login").with(httpBasic(STAFF_USERNAME, STAFF_PASSWORD)))
                .andExpect(status().isOk());
    }

    @Test
    void duplicateNormalizedAndInvalidUsernamesAreRejected() throws Exception {
        mockMvc.perform(post("/api/users")
                        .with(httpBasic(ADMIN_USERNAME, ADMIN_PASSWORD))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\" STAFF-USER \",\"password\":\"password\",\"role\":\"STAFF\"}"))
                .andExpect(status().isConflict())
                .andExpect(content().string("User account with username staff-user already exists"));

        mockMvc.perform(post("/api/users")
                        .with(httpBasic(ADMIN_USERNAME, ADMIN_PASSWORD))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"   \",\"password\":\"password\",\"role\":\"STAFF\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.username", is("Username is required")));
    }

    @Test
    void invalidRoleAndUnknownUserAreRejected() throws Exception {
        mockMvc.perform(post("/api/users")
                        .with(httpBasic(ADMIN_USERNAME, ADMIN_PASSWORD))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"user\",\"password\":\"password\",\"role\":\"OWNER\"}"))
                .andExpect(status().isBadRequest());

        UUID missingId = UUID.randomUUID();
        mockMvc.perform(patch("/api/users/{id}/role", missingId)
                        .with(httpBasic(ADMIN_USERNAME, ADMIN_PASSWORD))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"role\":\"STAFF\"}"))
                .andExpect(status().isNotFound())
                .andExpect(content().string("User account with id " + missingId + " not found"));
    }

    @Test
    void lastEnabledAdminCannotBeDisabledOrDemoted() throws Exception {
        mockMvc.perform(patch("/api/users/{id}/enabled", administrator.getId())
                        .with(httpBasic(ADMIN_USERNAME, ADMIN_PASSWORD))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"enabled\":false}"))
                .andExpect(status().isConflict())
                .andExpect(content().string("At least one enabled ADMIN account is required"));

        mockMvc.perform(patch("/api/users/{id}/role", administrator.getId())
                        .with(httpBasic(ADMIN_USERNAME, ADMIN_PASSWORD))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"role\":\"STAFF\"}"))
                .andExpect(status().isConflict())
                .andExpect(content().string("At least one enabled ADMIN account is required"));
    }

    @ParameterizedTest(name = "STAFF receives 403 for {0}")
    @MethodSource("userManagementRequests")
    void staffCannotAccessAnyUserManagementOperation(
            String operation,
            MockHttpServletRequestBuilder request) throws Exception {
        mockMvc.perform(request.with(httpBasic(STAFF_USERNAME, STAFF_PASSWORD)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error", is("Forbidden")));
    }

    @ParameterizedTest(name = "anonymous receives 401 for {0}")
    @MethodSource("userManagementRequests")
    void unauthenticatedUserCannotAccessAnyUserManagementOperation(
            String operation,
            MockHttpServletRequestBuilder request) throws Exception {
        mockMvc.perform(request)
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error", is("Unauthorized")));
    }

    private static Stream<Arguments> userManagementRequests() {
        UUID id = UUID.fromString("00000000-0000-0000-0000-000000000001");
        return Stream.of(
                Arguments.of("list", get("/api/users")),
                Arguments.of("create", post("/api/users")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"new-user\",\"password\":\"password\",\"role\":\"STAFF\"}")),
                Arguments.of("change role", patch("/api/users/{id}/role", id)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"role\":\"ADMIN\"}")),
                Arguments.of("change enabled", patch("/api/users/{id}/enabled", id)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"enabled\":false}"))
        );
    }

    private UserAccount saveUser(String username, String password, UserRole role, boolean enabled) {
        return userAccountRepository.saveAndFlush(UserAccount.builder()
                .username(username)
                .passwordHash(passwordEncoder.encode(password))
                .role(role)
                .enabled(enabled)
                .build());
    }
}
