package com.allegaeon.catworld.repository;

import com.allegaeon.catworld.dto.lookup.LookupPageResponseDTO;
import com.allegaeon.catworld.dto.lookup.VetLookupOptionDTO;
import com.allegaeon.catworld.model.UserAccount;
import com.allegaeon.catworld.model.UserRole;
import com.allegaeon.catworld.model.Vet;
import com.allegaeon.catworld.service.IVetService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

@EnabledIfEnvironmentVariable(named = "CATWORLD_NATIVE_MYSQL_URL", matches = ".+")
@SpringBootTest(properties = {
        "spring.datasource.driver-class-name=com.mysql.cj.jdbc.Driver",
        "spring.jpa.database-platform=org.hibernate.dialect.MySQLDialect",
        "spring.jpa.hibernate.ddl-auto=validate",
        "spring.flyway.enabled=true",
        "catworld.security.username=native-admin",
        "catworld.security.password=native-password",
        "catworld.security.cors-allowed-origins=http://localhost:4200"
})
@Transactional
class VetLookupMySqlIntegrationTest {

    @DynamicPropertySource
    static void nativeProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", () -> System.getenv("CATWORLD_NATIVE_MYSQL_URL"));
        registry.add("spring.datasource.username", () -> System.getenv("CATWORLD_NATIVE_MYSQL_USERNAME"));
        registry.add("spring.datasource.password", () -> System.getenv("CATWORLD_NATIVE_MYSQL_PASSWORD"));
    }

    @Autowired
    private UserAccountRepository userAccountRepository;

    @Autowired
    private VetRepository vetRepository;

    @Autowired
    private IVetService vetService;

    @Test
    void searchUsesAccentInsensitiveMySqlOrderingAndOneCandidateLookAhead() {
        String marker = "s" + UUID.randomUUID().toString().replace("-", "");
        UserAccount creator = userAccountRepository.save(UserAccount.builder()
                .username("lookup-" + UUID.randomUUID())
                .passwordHash("unused")
                .role(UserRole.ADMIN)
                .enabled(true)
                .build());
        insertVet(creator, "Clínica " + marker + " Alfa");
        insertVet(creator, "clinica " + marker + " Beta");
        insertVet(creator, "CLÍNICA " + marker + " Delta");
        insertVet(creator, "Clínica " + marker + " Épsilon");
        insertVet(creator, "clinica " + marker + " Gamma");
        insertVet(creator, "Clínica " + marker + " Zeta");
        insertVet(creator, "Unrelated Vet");
        vetRepository.flush();

        LookupPageResponseDTO<VetLookupOptionDTO> first =
                vetService.searchLookupOptions("clinica " + marker, 0);
        LookupPageResponseDTO<VetLookupOptionDTO> second =
                vetService.searchLookupOptions("CLÍNICA " + marker, 1);

        assertEquals(5, first.items().size());
        assertEquals(List.of(
                        "Clínica " + marker + " Alfa", "clinica " + marker + " Beta",
                        "CLÍNICA " + marker + " Delta", "Clínica " + marker + " Épsilon",
                        "clinica " + marker + " Gamma"),
                first.items().stream().map(VetLookupOptionDTO::name).toList());
        assertTrue(first.hasNext());
        assertEquals(1, second.items().size());
        assertEquals("Clínica " + marker + " Zeta", second.items().get(0).name());
        assertFalse(second.hasNext());
    }

    private void insertVet(UserAccount creator, String name) {
        vetRepository.save(Vet.builder().name(name).createdBy(creator).build());
    }
}
