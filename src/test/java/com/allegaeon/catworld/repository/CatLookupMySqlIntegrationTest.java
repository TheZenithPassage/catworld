package com.allegaeon.catworld.repository;

import com.allegaeon.catworld.dto.lookup.CatLookupOptionDTO;
import com.allegaeon.catworld.dto.lookup.LookupPageResponseDTO;
import com.allegaeon.catworld.model.Cat;
import com.allegaeon.catworld.model.Owner;
import com.allegaeon.catworld.model.Sex;
import com.allegaeon.catworld.model.UserAccount;
import com.allegaeon.catworld.model.UserRole;
import com.allegaeon.catworld.service.ICatService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;

import java.time.LocalDate;
import java.util.ArrayList;
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
class CatLookupMySqlIntegrationTest {

    @DynamicPropertySource
    static void nativeProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", () -> System.getenv("CATWORLD_NATIVE_MYSQL_URL"));
        registry.add("spring.datasource.username", () -> System.getenv("CATWORLD_NATIVE_MYSQL_USERNAME"));
        registry.add("spring.datasource.password", () -> System.getenv("CATWORLD_NATIVE_MYSQL_PASSWORD"));
    }

    @Autowired ICatService catService;
    @Autowired CatRepository catRepository;
    @Autowired OwnerRepository ownerRepository;
    @Autowired UserAccountRepository userAccountRepository;
    @Autowired PasswordEncoder passwordEncoder;

    private final List<UUID> fixtureCatIds = new ArrayList<>();
    private Owner owner;
    private UserAccount actor;

    @BeforeEach
    void createFixtureOwner() {
        actor = userAccountRepository.saveAndFlush(UserAccount.builder()
                .username("cat-lookup-" + UUID.randomUUID())
                .passwordHash(passwordEncoder.encode("password"))
                .role(UserRole.ADMIN)
                .enabled(true)
                .build());
        owner = ownerRepository.saveAndFlush(Owner.builder()
                .fullName("Owner Search Must Not Match")
                .primaryPhone("555-0160")
                .createdBy(actor)
                .build());
    }

    @AfterEach
    void removeFixtureRows() {
        fixtureCatIds.forEach(catRepository::deleteById);
        catRepository.flush();
        ownerRepository.deleteById(owner.getId());
        ownerRepository.flush();
        userAccountRepository.deleteById(actor.getId());
        userAccountRepository.flush();
    }

    @Test
    void lookupUsesCatNameOnlyWithAccentInsensitiveStableBoundedPaging() {
        String prefix = "Lookup160";
        List<String> names = List.of(
                prefix + " Mála One", prefix + " Mala Two", prefix + " Mála Three",
                prefix + " Mala Four", prefix + " Mála Five", prefix + " Mala Six",
                prefix + " Mála Seven");
        names.forEach(this::saveCat);
        Cat resolved = saveCat(prefix + " Zelda");

        LookupPageResponseDTO<CatLookupOptionDTO> first =
                catService.searchLookupOptions(prefix + " mala", 0);
        assertEquals(5, first.items().size());
        assertEquals(0, first.page());
        assertTrue(first.hasNext());
        assertEquals(List.of(
                        prefix + " Mála Five", prefix + " Mala Four", prefix + " Mála One",
                        prefix + " Mála Seven", prefix + " Mala Six"),
                first.items().stream().map(CatLookupOptionDTO::name).toList());
        assertTrue(first.items().stream()
                .allMatch(option -> option.ownerName().equals(owner.getFullName())));

        LookupPageResponseDTO<CatLookupOptionDTO> second =
                catService.searchLookupOptions(prefix.toUpperCase() + " MÁLA", 1);
        assertEquals(List.of(prefix + " Mála Three", prefix + " Mala Two"),
                second.items().stream().map(CatLookupOptionDTO::name).toList());
        assertFalse(second.hasNext());
        assertTrue(catService.searchLookupOptions("Owner Search Must Not Match", 0).items().isEmpty());

        assertEquals(new CatLookupOptionDTO(
                        resolved.getId(), prefix + " Zelda", owner.getFullName()),
                catService.getLookupOption(resolved.getId()));
    }

    private Cat saveCat(String name) {
        Cat cat = catRepository.saveAndFlush(Cat.builder()
                .name(name)
                .birthDate(LocalDate.of(2020, 1, 1))
                .sex(Sex.FEMALE)
                .owner(owner)
                .createdBy(actor)
                .build());
        fixtureCatIds.add(cat.getId());
        return cat;
    }
}
