package com.allegaeon.catworld.security;

import com.allegaeon.catworld.config.CatWorldSecurityProperties;
import com.allegaeon.catworld.model.UserAccount;
import com.allegaeon.catworld.model.UserRole;
import com.allegaeon.catworld.repository.UserAccountRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.Locale;

@Component
@RequiredArgsConstructor
public class UserAccountBootstrap implements ApplicationRunner {

    private final UserAccountRepository userAccountRepository;
    private final PasswordEncoder passwordEncoder;
    private final CatWorldSecurityProperties securityProperties;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        bootstrapFirstAdminIfRequired();
    }

    public void bootstrapFirstAdminIfRequired() {
        if (userAccountRepository.count() > 0) {
            return;
        }

        UserAccount administrator = UserAccount.builder()
                .username(securityProperties.username().trim().toLowerCase(Locale.ROOT))
                .passwordHash(passwordEncoder.encode(securityProperties.password()))
                .role(UserRole.ADMIN)
                .enabled(true)
                .build();

        userAccountRepository.save(administrator);
    }
}
