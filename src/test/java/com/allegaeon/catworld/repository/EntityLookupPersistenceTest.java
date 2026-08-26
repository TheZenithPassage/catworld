package com.allegaeon.catworld.repository;

import com.allegaeon.catworld.config.JpaAuditingConfig;
import com.allegaeon.catworld.model.*;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;

import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;

@DataJpaTest(properties = {"spring.jpa.hibernate.ddl-auto=create-drop", "spring.flyway.enabled=false"})
@Import(JpaAuditingConfig.class)
class EntityLookupPersistenceTest {
    @Autowired UserAccountRepository users;
    @Autowired OwnerRepository owners;
    @Autowired CatRepository cats;
    @Autowired VetRepository vets;

    @Test
    void lookupsFilterCountOrderAndPageAtTheDatabaseBoundary() {
        UserAccount actor = users.save(UserAccount.builder().username("lookup")
                .passwordHash("hash").role(UserRole.ADMIN).enabled(true).build());
        Owner catMatch = owners.save(Owner.builder().fullName("Zulu").primaryPhone("1").createdBy(actor).build());
        Owner nameMatch = owners.save(Owner.builder().fullName("Alpha needle").primaryPhone("2").createdBy(actor).build());
        Owner other = owners.save(Owner.builder().fullName("Other").primaryPhone("3").createdBy(actor).build());
        cats.save(Cat.builder().name("Needle one").birthDate(LocalDate.of(2020, 1, 1)).sex(Sex.FEMALE)
                .owner(catMatch).createdBy(actor).build());
        cats.save(Cat.builder().name("needle two").birthDate(LocalDate.of(2020, 1, 1)).sex(Sex.MALE)
                .owner(catMatch).createdBy(actor).build());
        cats.save(Cat.builder().name("Context only").birthDate(LocalDate.of(2020, 1, 1)).sex(Sex.MALE)
                .owner(nameMatch).createdBy(actor).build());
        cats.save(Cat.builder().name("Cat target").birthDate(LocalDate.of(2020, 1, 1)).sex(Sex.MALE)
                .owner(other).createdBy(actor).build());
        vets.save(Vet.builder().name("Vet Target").createdBy(actor).build());

        var ownerPage = owners.search("NEEDLE", PageRequest.of(0, 5,
                Sort.by(Sort.Order.asc("fullName"), Sort.Order.asc("id"))));
        assertEquals(List.of(nameMatch.getId(), catMatch.getId()), ownerPage.map(Owner::getId).getContent());
        assertEquals(2, ownerPage.getTotalElements());
        assertEquals(List.of("Cat target"), cats.search("target", PageRequest.of(0, 5,
                Sort.by("name", "id"))).map(Cat::getName).getContent());
        assertEquals(List.of("Vet Target"), vets.search("target", PageRequest.of(0, 5,
                Sort.by("name", "id"))).map(Vet::getName).getContent());
        assertEquals(2, cats.findLookupCatsByOwnerIds(List.of(catMatch.getId())).size());
        assertEquals(2, owners.search("needle", PageRequest.of(4, 5,
                Sort.by("fullName", "id"))).getTotalElements());
    }
}
