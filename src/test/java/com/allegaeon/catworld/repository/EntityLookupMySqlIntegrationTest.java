package com.allegaeon.catworld.repository;

import com.allegaeon.catworld.model.*;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;

import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.assertEquals;

@EnabledIfEnvironmentVariable(named = "CATWORLD_NATIVE_MYSQL_URL", matches = ".+")
@SpringBootTest(properties = {"spring.jpa.hibernate.ddl-auto=validate", "spring.flyway.enabled=true"})
class EntityLookupMySqlIntegrationTest {
    @DynamicPropertySource
    static void properties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", () -> System.getenv("CATWORLD_NATIVE_MYSQL_URL"));
        registry.add("spring.datasource.username", () -> System.getenv("CATWORLD_NATIVE_MYSQL_USERNAME"));
        registry.add("spring.datasource.password", () -> System.getenv("CATWORLD_NATIVE_MYSQL_PASSWORD"));
    }

    @Autowired UserAccountRepository users;
    @Autowired OwnerRepository owners;
    @Autowired CatRepository cats;
    @Autowired VetRepository vets;

    @Test
    void mysqlCollationProvidesCaseAndAccentInsensitiveDomainMatching() {
        UserAccount actor = users.saveAndFlush(UserAccount.builder().username("lookup-native")
                .passwordHash("hash").role(UserRole.ADMIN).enabled(true).build());
        Owner owner = owners.saveAndFlush(Owner.builder().fullName("José Álvarez")
                .primaryPhone("1").createdBy(actor).build());
        cats.saveAndFlush(Cat.builder().name("Míša").birthDate(LocalDate.of(2020, 1, 1)).sex(Sex.FEMALE)
                .owner(owner).createdBy(actor).build());
        vets.saveAndFlush(Vet.builder().name("Clínica Ñandú").createdBy(actor).build());

        assertEquals(owner.getId(), owners.search("JOSE", PageRequest.of(0, 5,
                Sort.by("fullName", "id"))).getContent().getFirst().getId());
        assertEquals("Míša", cats.search("misa", PageRequest.of(0, 5,
                Sort.by("name", "id"))).getContent().getFirst().getName());
        assertEquals("Clínica Ñandú", vets.search("clinica nandu", PageRequest.of(0, 5,
                Sort.by("name", "id"))).getContent().getFirst().getName());
    }
}
