package com.allegaeon.catworld.repository;

import com.allegaeon.catworld.config.JpaAuditingConfig;
import com.allegaeon.catworld.mapper.UserAccountMapper;
import com.allegaeon.catworld.model.UserAccount;
import com.allegaeon.catworld.model.UserRole;
import com.allegaeon.catworld.security.CurrentUserAccountService;
import com.allegaeon.catworld.service.UserAccountService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.context.annotation.Import;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.factory.PasswordEncoderFactories;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;

@DataJpaTest(properties = {
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "spring.flyway.enabled=false"
})
@Import(JpaAuditingConfig.class)
class UserAccountMutationPersistenceTest {

    @Autowired
    private UserAccountRepository userAccountRepository;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private UserAccountService userAccountService;

    @BeforeEach
    void setUp() {
        userAccountService = new UserAccountService(
                userAccountRepository,
                new UserAccountMapper(),
                PasswordEncoderFactories.createDelegatingPasswordEncoder(),
                mock(CurrentUserAccountService.class),
                mock(OwnerRepository.class),
                mock(CatRepository.class),
                mock(VetRepository.class),
                mock(StayRepository.class)
        );
    }

    @Test
    void roleReducerPersistsRequestedValueAndPreservesCurrentEnabledState() {
        UserAccount staleTarget = saveAccount("stale-role-target", UserRole.STAFF, false);
        saveAccount("other-role-admin", UserRole.ADMIN, true);
        UUID targetId = staleTarget.getId();
        makeTargetCurrentEnabledAdmin(targetId);

        assertEquals(UserRole.STAFF, staleTarget.getRole());
        assertFalse(staleTarget.isEnabled());

        var response = userAccountService.changeRole(targetId, UserRole.STAFF);

        assertEquals(UserRole.STAFF, response.getRole());
        assertTrue(response.isEnabled());
        assertEquals(UserRole.STAFF.name(), storedRole(targetId));
        assertTrue(storedEnabled(targetId));
    }

    @Test
    void enabledReducerPersistsRequestedValueAndPreservesCurrentRole() {
        UserAccount staleTarget = saveAccount("stale-enabled-target", UserRole.STAFF, false);
        saveAccount("other-enabled-admin", UserRole.ADMIN, true);
        UUID targetId = staleTarget.getId();
        makeTargetCurrentEnabledAdmin(targetId);

        assertEquals(UserRole.STAFF, staleTarget.getRole());
        assertFalse(staleTarget.isEnabled());

        var response = userAccountService.changeEnabled(targetId, false);

        assertEquals(UserRole.ADMIN, response.getRole());
        assertFalse(response.isEnabled());
        assertEquals(UserRole.ADMIN.name(), storedRole(targetId));
        assertFalse(storedEnabled(targetId));
    }

    private UserAccount saveAccount(String username, UserRole role, boolean enabled) {
        return userAccountRepository.saveAndFlush(UserAccount.builder()
                .username(username)
                .passwordHash("hash")
                .role(role)
                .enabled(enabled)
                .build());
    }

    private void makeTargetCurrentEnabledAdmin(UUID targetId) {
        jdbcTemplate.update(
                "update user_accounts set role = ?, enabled = ? where id = ?",
                UserRole.ADMIN.name(),
                true,
                targetId);
    }

    private String storedRole(UUID targetId) {
        return jdbcTemplate.queryForObject(
                "select role from user_accounts where id = ?",
                String.class,
                targetId);
    }

    private boolean storedEnabled(UUID targetId) {
        return Boolean.TRUE.equals(jdbcTemplate.queryForObject(
                "select enabled from user_accounts where id = ?",
                Boolean.class,
                targetId));
    }
}
