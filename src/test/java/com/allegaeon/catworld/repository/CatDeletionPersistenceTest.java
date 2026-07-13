package com.allegaeon.catworld.repository;

import com.allegaeon.catworld.config.JpaAuditingConfig;
import com.allegaeon.catworld.model.Cat;
import com.allegaeon.catworld.model.Owner;
import com.allegaeon.catworld.model.Sex;
import com.allegaeon.catworld.model.Stay;
import com.allegaeon.catworld.model.StayCat;
import com.allegaeon.catworld.model.StayStatus;
import com.allegaeon.catworld.model.UserAccount;
import com.allegaeon.catworld.model.UserRole;
import com.allegaeon.catworld.model.Vet;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.context.annotation.Import;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.jdbc.core.JdbcTemplate;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

@DataJpaTest(properties = {
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "spring.flyway.enabled=false"
})
@Import(JpaAuditingConfig.class)
class CatDeletionPersistenceTest {

    @Autowired
    private UserAccountRepository userAccountRepository;

    @Autowired
    private OwnerRepository ownerRepository;

    @Autowired
    private CatRepository catRepository;

    @Autowired
    private VetRepository vetRepository;

    @Autowired
    private StayRepository stayRepository;

    @Autowired
    private StayCatRepository stayCatRepository;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Test
    void deletingUnreferencedCatPreservesOwnerVetAndCreator() {
        UserAccount creator = saveCreator("unreferenced-cat-creator");
        Owner owner = saveOwner(creator);
        Vet vet = saveVet(creator);
        Cat cat = saveCat("Milo", owner, vet, creator);
        UUID catId = cat.getId();
        UUID ownerId = owner.getId();
        UUID vetId = vet.getId();
        UUID creatorId = creator.getId();

        assertFalse(stayCatRepository.existsByCat_Id(catId));

        catRepository.delete(cat);
        catRepository.flush();

        assertTrue(catRepository.findById(catId).isEmpty());
        assertTrue(ownerRepository.findById(ownerId).isPresent());
        assertTrue(vetRepository.findById(vetId).isPresent());
        assertTrue(userAccountRepository.findById(creatorId).isPresent());
    }

    @Test
    void foreignKeyBlocksDeletionAndPreservesEveryKindOfStayHistory() {
        UserAccount creator = saveCreator("referenced-cat-creator");
        Owner owner = saveOwner(creator);
        Vet vet = saveVet(creator);
        Cat cat = saveCat("Luna", owner, vet, creator);
        LocalDateTime now = LocalDateTime.now();

        Stay futureStay = saveStay(
                cat,
                owner,
                creator,
                now.plusDays(1),
                now.plusDays(2),
                null);
        Stay cancelledStay = saveStay(
                cat,
                owner,
                creator,
                now.minusDays(3),
                now.minusDays(2),
                now.minusDays(2));
        Stay historicalStay = saveStay(
                cat,
                owner,
                creator,
                now.minusDays(10),
                now.minusDays(5),
                null);

        UUID catId = cat.getId();
        assertEquals(StayStatus.RESERVED, futureStay.getStatus());
        assertEquals(StayStatus.CANCELLED, cancelledStay.getStatus());
        assertEquals(StayStatus.CHECKED_OUT, historicalStay.getStatus());
        assertTrue(stayCatRepository.existsByCat_Id(catId));
        assertEquals(3, countStayCatRows(catId));

        assertThrows(
                DataIntegrityViolationException.class,
                () -> jdbcTemplate.update("delete from cats where id = ?", catId));

        assertEquals(1, countCatRows(catId));
        assertEquals(3, countStayCatRows(catId));
        assertTrue(stayRepository.findById(futureStay.getId()).isPresent());
        assertTrue(stayRepository.findById(cancelledStay.getId()).isPresent());
        assertTrue(stayRepository.findById(historicalStay.getId()).isPresent());
        assertTrue(ownerRepository.findById(owner.getId()).isPresent());
        assertTrue(vetRepository.findById(vet.getId()).isPresent());
        assertTrue(userAccountRepository.findById(creator.getId()).isPresent());
    }

    private UserAccount saveCreator(String username) {
        return userAccountRepository.saveAndFlush(UserAccount.builder()
                .username(username)
                .passwordHash("hash")
                .role(UserRole.STAFF)
                .enabled(true)
                .build());
    }

    private Owner saveOwner(UserAccount creator) {
        return ownerRepository.saveAndFlush(Owner.builder()
                .fullName("Cat Owner")
                .primaryPhone("123456789")
                .createdBy(creator)
                .build());
    }

    private Vet saveVet(UserAccount creator) {
        return vetRepository.saveAndFlush(Vet.builder()
                .name("Central Vet")
                .createdBy(creator)
                .build());
    }

    private Cat saveCat(String name, Owner owner, Vet vet, UserAccount creator) {
        return catRepository.saveAndFlush(Cat.builder()
                .name(name)
                .birthDate(LocalDate.of(2020, 1, 1))
                .sex(Sex.FEMALE)
                .owner(owner)
                .vet(vet)
                .createdBy(creator)
                .build());
    }

    private Stay saveStay(
            Cat cat,
            Owner owner,
            UserAccount creator,
            LocalDateTime startAt,
            LocalDateTime endAt,
            LocalDateTime cancelledAt) {
        Stay stay = Stay.builder()
                .startAt(startAt)
                .endAt(endAt)
                .cancelledAt(cancelledAt)
                .owner(owner)
                .createdBy(creator)
                .build();
        StayCat stayCat = StayCat.builder()
                .stay(stay)
                .cat(cat)
                .build();
        stay.getStayCats().add(stayCat);
        cat.getStayCats().add(stayCat);

        return stayRepository.saveAndFlush(stay);
    }

    private Integer countCatRows(UUID catId) {
        return jdbcTemplate.queryForObject(
                "select count(*) from cats where id = ?",
                Integer.class,
                catId);
    }

    private Integer countStayCatRows(UUID catId) {
        return jdbcTemplate.queryForObject(
                "select count(*) from stay_cat where cat_id = ?",
                Integer.class,
                catId);
    }
}
