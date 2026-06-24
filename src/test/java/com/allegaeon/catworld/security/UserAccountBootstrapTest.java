package com.allegaeon.catworld.security;

import com.allegaeon.catworld.config.CatWorldSecurityProperties;
import com.allegaeon.catworld.config.JpaAuditingConfig;
import com.allegaeon.catworld.model.UserAccount;
import com.allegaeon.catworld.model.UserRole;
import com.allegaeon.catworld.repository.UserAccountRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.context.annotation.Import;
import org.springframework.security.crypto.factory.PasswordEncoderFactories;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@DataJpaTest(properties = {
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "spring.flyway.enabled=false"
})
@Import(JpaAuditingConfig.class)
class UserAccountBootstrapTest {

    @Autowired
    private UserAccountRepository userAccountRepository;

    private final PasswordEncoder passwordEncoder = PasswordEncoderFactories.createDelegatingPasswordEncoder();

    @Test
    void createsExactlyOneAdminWhenDatabaseIsFresh() {
        bootstrap(" First-Admin ", "first-password").bootstrapFirstAdminIfRequired();

        List<UserAccount> users = userAccountRepository.findAll();

        assertEquals(1, users.size());
        UserAccount administrator = users.get(0);
        assertEquals("first-admin", administrator.getUsername());
        assertEquals(UserRole.ADMIN, administrator.getRole());
        assertTrue(administrator.isEnabled());
        assertNotEquals("first-password", administrator.getPasswordHash());
        assertTrue(passwordEncoder.matches("first-password", administrator.getPasswordHash()));
        assertNotNull(administrator.getCreatedAt());
        assertNotNull(administrator.getUpdatedAt());
    }

    @Test
    void runningBootstrapAgainDoesNotCreateOrModifyUsers() {
        UserAccountBootstrap bootstrap = bootstrap("first-admin", "first-password");
        bootstrap.bootstrapFirstAdminIfRequired();

        UserAccount original = userAccountRepository.findAll().get(0);
        UUID originalId = original.getId();
        String originalPasswordHash = original.getPasswordHash();
        Instant originalUpdatedAt = original.getUpdatedAt();

        bootstrap.bootstrapFirstAdminIfRequired();
        userAccountRepository.flush();

        List<UserAccount> users = userAccountRepository.findAll();

        assertEquals(1, users.size());
        UserAccount administrator = users.get(0);
        assertEquals(originalId, administrator.getId());
        assertEquals("first-admin", administrator.getUsername());
        assertEquals(UserRole.ADMIN, administrator.getRole());
        assertTrue(administrator.isEnabled());
        assertEquals(originalPasswordHash, administrator.getPasswordHash());
        assertEquals(originalUpdatedAt, administrator.getUpdatedAt());
    }

    @Test
    void doesNothingWhenAnyUserAlreadyExists() {
        String existingPasswordHash = passwordEncoder.encode("existing-password");
        UserAccount existingUser = userAccountRepository.saveAndFlush(UserAccount.builder()
                .username("existing-staff")
                .passwordHash(existingPasswordHash)
                .role(UserRole.STAFF)
                .enabled(false)
                .build());
        Instant originalUpdatedAt = existingUser.getUpdatedAt();

        bootstrap("bootstrap-admin", "bootstrap-password").bootstrapFirstAdminIfRequired();
        userAccountRepository.flush();

        List<UserAccount> users = userAccountRepository.findAll();

        assertEquals(1, users.size());
        UserAccount storedUser = users.get(0);
        assertEquals(existingUser.getId(), storedUser.getId());
        assertEquals("existing-staff", storedUser.getUsername());
        assertEquals(existingPasswordHash, storedUser.getPasswordHash());
        assertEquals(UserRole.STAFF, storedUser.getRole());
        assertFalse(storedUser.isEnabled());
        assertEquals(originalUpdatedAt, storedUser.getUpdatedAt());
    }

    private UserAccountBootstrap bootstrap(String username, String password) {
        return new UserAccountBootstrap(
                userAccountRepository,
                passwordEncoder,
                new CatWorldSecurityProperties(username, password, List.of("http://localhost:4200"))
        );
    }
}
