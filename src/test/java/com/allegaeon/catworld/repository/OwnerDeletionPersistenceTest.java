package com.allegaeon.catworld.repository;

import com.allegaeon.catworld.config.JpaAuditingConfig;
import com.allegaeon.catworld.model.Cat;
import com.allegaeon.catworld.model.Owner;
import com.allegaeon.catworld.model.Sex;
import com.allegaeon.catworld.model.Stay;
import com.allegaeon.catworld.model.StayCat;
import com.allegaeon.catworld.model.UserAccount;
import com.allegaeon.catworld.model.UserRole;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.context.annotation.Import;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.jdbc.core.JdbcTemplate;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Set;
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
class OwnerDeletionPersistenceTest {

    @Autowired
    private UserAccountRepository userAccountRepository;

    @Autowired
    private OwnerRepository ownerRepository;

    @Autowired
    private CatRepository catRepository;

    @Autowired
    private StayRepository stayRepository;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private EntityManager entityManager;

    @Test
    void deletingUnreferencedOwnerPreservesCreatorAndUnrelatedOperationalRecords() {
        UserAccount creator = saveCreator("unreferenced-owner-creator");
        Owner targetOwner = saveOwner("Unreferenced Owner", creator);
        Owner unrelatedOwner = saveOwner("Unrelated Owner", creator);
        Cat unrelatedCat = saveCat("Milo", unrelatedOwner, creator);
        Stay unrelatedStay = saveStay(unrelatedOwner, unrelatedCat, creator);

        UUID targetOwnerId = targetOwner.getId();
        UUID creatorId = creator.getId();
        UUID unrelatedOwnerId = unrelatedOwner.getId();
        UUID unrelatedCatId = unrelatedCat.getId();
        UUID unrelatedStayId = unrelatedStay.getId();

        assertFalse(ownerRepository.existsByIdAndCatsIsNotEmpty(targetOwnerId));
        assertFalse(stayRepository.existsByOwner_Id(targetOwnerId));

        ownerRepository.delete(targetOwner);
        ownerRepository.flush();
        entityManager.clear();

        assertTrue(ownerRepository.findById(targetOwnerId).isEmpty());
        assertTrue(userAccountRepository.findById(creatorId).isPresent());
        assertTrue(ownerRepository.findById(unrelatedOwnerId).isPresent());
        assertTrue(catRepository.findById(unrelatedCatId).isPresent());
        assertTrue(stayRepository.findById(unrelatedStayId).isPresent());
        assertEquals(1, jdbcTemplate.queryForObject(
                "select count(*) from stay_cat where stay_id = ? and cat_id = ?",
                Integer.class,
                unrelatedStayId,
                unrelatedCatId));
    }

    @Test
    void catsOwnerForeignKeyIndependentlyRejectsOwnerDeletionAndPreservesRecords() {
        UserAccount creator = saveCreator("cat-owner-reference-creator");
        Owner owner = saveOwner("Referenced By Cat", creator);
        Cat cat = saveCat("Luna", owner, creator);
        UUID ownerId = owner.getId();
        UUID catId = cat.getId();

        assertTrue(ownerRepository.existsByIdAndCatsIsNotEmpty(ownerId));
        assertFalse(stayRepository.existsByOwner_Id(ownerId));

        assertThrows(
                DataIntegrityViolationException.class,
                () -> jdbcTemplate.update("delete from owners where id = ?", ownerId));

        assertEquals(1, countRows("owners", ownerId));
        assertEquals(1, countRows("cats", catId));
        assertEquals(1, jdbcTemplate.queryForObject(
                "select count(*) from cats where id = ? and owner_id = ?",
                Integer.class,
                catId,
                ownerId));
        assertTrue(userAccountRepository.findById(creator.getId()).isPresent());
    }

    @Test
    void staysOwnerForeignKeyIndependentlyRejectsOwnerDeletionAndPreservesRecords() {
        UserAccount creator = saveCreator("stay-owner-reference-creator");
        Owner owner = saveOwner("Referenced By Stay", creator);
        Stay stay = stayRepository.saveAndFlush(Stay.builder()
                .startAt(LocalDateTime.now().minusDays(2))
                .endAt(LocalDateTime.now().minusDays(1))
                .owner(owner)
                .createdBy(creator)
                .build());
        UUID ownerId = owner.getId();
        UUID stayId = stay.getId();

        assertFalse(ownerRepository.existsByIdAndCatsIsNotEmpty(ownerId));
        assertTrue(stayRepository.existsByOwner_Id(ownerId));

        assertThrows(
                DataIntegrityViolationException.class,
                () -> jdbcTemplate.update("delete from owners where id = ?", ownerId));

        assertEquals(1, countRows("owners", ownerId));
        assertEquals(1, countRows("stays", stayId));
        assertEquals(1, jdbcTemplate.queryForObject(
                "select count(*) from stays where id = ? and owner_id = ?",
                Integer.class,
                stayId,
                ownerId));
        assertTrue(userAccountRepository.findById(creator.getId()).isPresent());
    }

    @Test
    void bulkRelationshipLookupsReturnOnlyBlockedCandidateOwnerIds() {
        UserAccount creator = saveCreator("bulk-owner-reference-creator");
        Owner catBlocked = saveOwner("Cat blocked", creator);
        Owner stayBlocked = saveOwner("Stay blocked", creator);
        Owner clear = saveOwner("Clear", creator);
        Owner referencedNonCandidate = saveOwner("Referenced non-candidate", creator);

        saveCat("Cat-blocking cat", catBlocked, creator);
        saveCat("Non-candidate cat", referencedNonCandidate, creator);
        stayRepository.saveAndFlush(Stay.builder()
                .startAt(LocalDateTime.now().plusDays(1))
                .endAt(LocalDateTime.now().plusDays(2))
                .owner(stayBlocked)
                .createdBy(creator)
                .build());
        stayRepository.saveAndFlush(Stay.builder()
                .startAt(LocalDateTime.now().plusDays(3))
                .endAt(LocalDateTime.now().plusDays(4))
                .owner(referencedNonCandidate)
                .createdBy(creator)
                .build());

        Set<UUID> catBlockedIds = ownerRepository.findOwnerIdsReferencedByCats(Set.of(
                catBlocked.getId(),
                stayBlocked.getId(),
                clear.getId()));
        Set<UUID> stayBlockedIds = stayRepository.findOwnerIdsReferencedByStays(Set.of(
                stayBlocked.getId(),
                clear.getId()));

        assertEquals(Set.of(catBlocked.getId()), catBlockedIds);
        assertEquals(Set.of(stayBlocked.getId()), stayBlockedIds);
    }

    private UserAccount saveCreator(String username) {
        return userAccountRepository.saveAndFlush(UserAccount.builder()
                .username(username)
                .passwordHash("hash")
                .role(UserRole.STAFF)
                .enabled(true)
                .build());
    }

    private Owner saveOwner(String fullName, UserAccount creator) {
        return ownerRepository.saveAndFlush(Owner.builder()
                .fullName(fullName)
                .primaryPhone("123456789")
                .createdBy(creator)
                .build());
    }

    private Cat saveCat(String name, Owner owner, UserAccount creator) {
        return catRepository.saveAndFlush(Cat.builder()
                .name(name)
                .birthDate(LocalDate.of(2020, 1, 1))
                .sex(Sex.FEMALE)
                .owner(owner)
                .createdBy(creator)
                .build());
    }

    private Stay saveStay(Owner owner, Cat cat, UserAccount creator) {
        Stay stay = Stay.builder()
                .startAt(LocalDateTime.now().plusDays(1))
                .endAt(LocalDateTime.now().plusDays(2))
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

    private Integer countRows(String table, UUID id) {
        return jdbcTemplate.queryForObject(
                "select count(*) from " + table + " where id = ?",
                Integer.class,
                id);
    }
}
