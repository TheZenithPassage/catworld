package com.allegaeon.catworld.controller;

import com.allegaeon.catworld.model.UserAccount;
import com.allegaeon.catworld.model.UserRole;
import com.allegaeon.catworld.repository.UserAccountRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.util.UUID;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.httpBasic;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(properties = {"catworld.security.username=test-admin", "catworld.security.password=test-password"})
@AutoConfigureMockMvc
@ActiveProfiles("test")
class CatControllerSecurityTest {
    @Autowired MockMvc mockMvc;
    @Autowired UserAccountRepository users;
    @Autowired PasswordEncoder encoder;

    @BeforeEach
    void user() {
        users.deleteAll();
        users.saveAndFlush(UserAccount.builder().username("photo-reader")
                .passwordHash(encoder.encode("reader-password")).role(UserRole.STAFF).enabled(true).build());
    }

    @Test
    void photoContentRequiresBasicAuthenticationAndHidesMissingStorage() throws Exception {
        UUID missing = UUID.randomUUID();
        mockMvc.perform(get("/api/cats/{id}/photo", missing)).andExpect(status().isUnauthorized());
        mockMvc.perform(get("/api/cats/{id}/photo", missing)
                        .with(httpBasic("photo-reader", "reader-password")))
                .andExpect(status().isNotFound());
    }
}
