package com.allegaeon.catworld.repository;

import com.allegaeon.catworld.dto.CatRequestDTO;
import com.allegaeon.catworld.exception.CatPhotoException;
import com.allegaeon.catworld.model.*;
import com.allegaeon.catworld.security.CurrentUserAccountService;
import com.allegaeon.catworld.service.CatMutationTransactionService;
import com.allegaeon.catworld.service.NormalizedCatPhoto;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

import java.time.LocalDate;
import java.util.List;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;

@EnabledIfEnvironmentVariable(named = "CATWORLD_NATIVE_MYSQL_URL", matches = ".+")
@SpringBootTest(properties = {"spring.jpa.hibernate.ddl-auto=validate", "spring.flyway.enabled=true"})
class CatPhotoMySqlIntegrationTest {
    @DynamicPropertySource
    static void properties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", () -> System.getenv("CATWORLD_NATIVE_MYSQL_URL"));
        registry.add("spring.datasource.username", () -> System.getenv("CATWORLD_NATIVE_MYSQL_USERNAME"));
        registry.add("spring.datasource.password", () -> System.getenv("CATWORLD_NATIVE_MYSQL_PASSWORD"));
    }

    @Autowired CatMutationTransactionService mutations;
    @Autowired CatRepository cats;
    @Autowired CatPhotoRepository photos;
    @Autowired OwnerRepository owners;
    @Autowired UserAccountRepository users;
    @Autowired JdbcTemplate jdbc;
    @MockitoBean CurrentUserAccountService currentUser;

    @Test
    void v9LifecycleBulkPresenceRollbackAndCascadeAreDatabaseAuthoritative() {
        assertEquals(List.of("1", "2", "3", "4", "5", "6", "7", "8", "9"), jdbc.queryForList(
                "select version from flyway_schema_history where success=1 and version is not null order by installed_rank",
                String.class));
        UserAccount actor = users.saveAndFlush(UserAccount.builder().username("photo-native")
                .passwordHash("not-used").role(UserRole.ADMIN).enabled(true).build());
        Owner owner = owners.saveAndFlush(Owner.builder().fullName("Photo Owner").primaryPhone("555")
                .createdBy(actor).build());
        when(currentUser.getCurrentUserAccount()).thenReturn(actor);
        CatRequestDTO request = CatRequestDTO.builder().name("Milo").birthDate(LocalDate.of(2020, 1, 1))
                .sex(Sex.MALE).ownerId(owner.getId()).build();
        NormalizedCatPhoto first = photo(new byte[] {1, 2, 3}, "a".repeat(64));
        Cat cat = mutations.create(request, first);
        assertArrayEquals(first.bytes(), photos.findById(cat.getId()).orElseThrow().getContent());
        assertEquals(Set.of(cat.getId()), photos.findPresentCatIds(List.of(cat.getId())));

        mutations.update(cat.getId(), request, null, false);
        assertArrayEquals(first.bytes(), photos.findById(cat.getId()).orElseThrow().getContent());
        NormalizedCatPhoto replacement = photo(new byte[] {4, 5}, "b".repeat(64));
        mutations.update(cat.getId(), request, replacement, false);
        assertArrayEquals(replacement.bytes(), photos.findById(cat.getId()).orElseThrow().getContent());
        assertThrows(CatPhotoException.class, () -> mutations.update(cat.getId(), request, replacement, true));
        assertArrayEquals(replacement.bytes(), photos.findById(cat.getId()).orElseThrow().getContent());
        mutations.update(cat.getId(), request, null, true);
        assertFalse(photos.existsById(cat.getId()));

        CatRequestDTO changed = CatRequestDTO.builder().name("Should Roll Back").birthDate(request.getBirthDate())
                .sex(request.getSex()).ownerId(owner.getId()).build();
        assertThrows(RuntimeException.class, () -> mutations.update(cat.getId(), changed,
                new NormalizedCatPhoto(new byte[] {9}, 0, 1, "c".repeat(64)), false));
        assertEquals("Milo", cats.findById(cat.getId()).orElseThrow().getName());
        mutations.update(cat.getId(), request, first, false);
        cats.deleteById(cat.getId());
        cats.flush();
        assertFalse(photos.existsById(cat.getId()));
    }

    private NormalizedCatPhoto photo(byte[] bytes, String digest) {
        return new NormalizedCatPhoto(bytes, 2, 2, digest);
    }
}
