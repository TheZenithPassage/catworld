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
import java.time.LocalDateTime;
import java.math.BigDecimal;
import java.util.Set;
import jakarta.persistence.EntityManager;
import org.springframework.transaction.annotation.Transactional;
import com.allegaeon.catworld.dto.PaymentCondition;

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
    @Autowired StayOverviewReadRepository stayOverviews;
    @Autowired EntityManager entityManager;

    @Test
    @Transactional
    void mysqlCollationProvidesCaseAndAccentInsensitiveDomainMatching() {
        UserAccount actor = users.saveAndFlush(UserAccount.builder().username("lookup-native")
                .passwordHash("hash").role(UserRole.ADMIN).enabled(true).build());
        Owner owner = owners.saveAndFlush(Owner.builder().fullName("José Álvarez")
                .primaryPhone("1").createdBy(actor).build());
        Cat cat = cats.saveAndFlush(Cat.builder().name("Míša").birthDate(LocalDate.of(2020, 1, 1)).sex(Sex.FEMALE)
                .owner(owner).createdBy(actor).build());
        vets.saveAndFlush(Vet.builder().name("Clínica Ñandú").createdBy(actor).build());
        Owner literalOwner = owners.saveAndFlush(Owner.builder().fullName("Literal %_!")
                .primaryPhone("2").createdBy(actor).build());
        Cat literalCat = cats.saveAndFlush(Cat.builder().name("Literal_%!")
                .birthDate(LocalDate.of(2020, 1, 1)).sex(Sex.MALE).owner(literalOwner).createdBy(actor).build());
        Vet literalVet = vets.saveAndFlush(Vet.builder().name("Literal_%!").createdBy(actor).build());

        assertEquals(owner.getId(), owners.search("JOSE", PageRequest.of(0, 5,
                Sort.by("fullName", "id"))).getContent().getFirst().getId());
        assertEquals("Míša", cats.search("misa", PageRequest.of(0, 5,
                Sort.by("name", "id"))).getContent().getFirst().getName());
        assertEquals("Clínica Ñandú", vets.search("clinica nandu", PageRequest.of(0, 5,
                Sort.by("name", "id"))).getContent().getFirst().getName());
        assertEquals(literalOwner.getId(), owners.search("!%!_!!", PageRequest.of(0, 5,
                Sort.by("fullName", "id"))).getContent().getFirst().getId());
        assertEquals(literalCat.getId(), cats.search("!_!%!!", PageRequest.of(0, 5,
                Sort.by("name", "id"))).getContent().getFirst().getId());
        assertEquals(literalVet.getId(), vets.search("!_!%!!", PageRequest.of(0, 5,
                Sort.by("name", "id"))).getContent().getFirst().getId());

        assertEquals(owner.getId(), owners.searchOverview("JOSE", PageRequest.of(0, 10,
                Sort.by("fullName", "id"))).getContent().getFirst().getId());
        assertEquals("Míša", cats.searchOverview("alvarez", PageRequest.of(0, 10,
                Sort.by("name", "id"))).getContent().getFirst().getName());
        assertEquals("Clínica Ñandú", vets.searchOverview("clinica nandu", PageRequest.of(0, 10,
                Sort.by("name", "id"))).getContent().getFirst().getName());

        Stay later = Stay.builder().startAt(LocalDateTime.of(2030, 1, 3, 10, 0))
                .endAt(LocalDateTime.of(2030, 1, 5, 10, 0)).agreedAmount(new BigDecimal("100"))
                .owner(owner).createdBy(actor).build();
        Stay earlier = Stay.builder().startAt(LocalDateTime.of(2030, 1, 1, 10, 0))
                .endAt(LocalDateTime.of(2030, 1, 2, 10, 0)).agreedAmount(new BigDecimal("100"))
                .owner(owner).createdBy(actor).build();
        entityManager.persist(later);
        entityManager.persist(earlier);
        entityManager.flush();
        entityManager.persist(StayCat.builder().id(new StayCatId(earlier.getId(), cat.getId()))
                .stay(earlier).cat(cat).build());
        entityManager.flush();

        var stayPage = stayOverviews.find(0, 10, LocalDateTime.of(2029, 1, 1, 0, 0),
                Set.of(StayStatus.RESERVED), owner.getId(), cat.getId(),
                Set.of(PaymentCondition.NO_PAYMENT), true);
        assertEquals(1, stayPage.getTotalElements());
        assertEquals(earlier.getId(), stayPage.getContent().getFirst().getId());
    }
}
