package com.allegaeon.catworld.repository;

import com.allegaeon.catworld.config.JpaAuditingConfig;
import com.allegaeon.catworld.model.Cat;
import com.allegaeon.catworld.model.Owner;
import com.allegaeon.catworld.model.Sex;
import com.allegaeon.catworld.model.Stay;
import com.allegaeon.catworld.model.StayCat;
import com.allegaeon.catworld.model.UserAccount;
import com.allegaeon.catworld.model.UserRole;
import com.allegaeon.catworld.model.Vet;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.context.annotation.Import;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.jdbc.core.JdbcTemplate;

import java.time.Instant;
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
class VetDeletionPersistenceTest {

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
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private EntityManager entityManager;

    @Test
    void existingForeignKeyRejectsDeletingVetReferencedByCatAndPreservesBothRecords() {
        UserAccount creator = saveCreator("referenced-vet-creator");
        Owner owner = saveOwner(creator, "Referenced Vet Owner");
        Vet vet = vetRepository.saveAndFlush(Vet.builder()
                .name("Referenced Vet")
                .createdBy(creator)
                .build());
        Cat cat = catRepository.saveAndFlush(Cat.builder()
                .name("Milo")
                .birthDate(LocalDate.of(2020, 1, 1))
                .sex(Sex.MALE)
                .owner(owner)
                .vet(vet)
                .createdBy(creator)
                .build());

        UUID vetId = vet.getId();
        UUID catId = cat.getId();
        assertTrue(vetRepository.existsByIdAndCatsIsNotEmpty(vetId));

        assertThrows(DataIntegrityViolationException.class,
                () -> jdbcTemplate.update("delete from vets where id = ?", vetId));

        assertEquals(1, countRows("vets", vetId));
        assertEquals(1, countRows("cats", catId));
        assertEquals(1, jdbcTemplate.queryForObject(
                "select count(*) from cats where id = ? and vet_id = ?",
                Integer.class,
                catId,
                vetId));
    }

    @Test
    void deletingUnreferencedVetLeavesUnrelatedOperationalRecordsUnchanged() {
        UserAccount creator = saveCreator("unreferenced-vet-creator");
        Owner owner = saveOwner(creator, "Unrelated Owner");
        Vet vet = vetRepository.saveAndFlush(Vet.builder()
                .name("Unreferenced Vet")
                .createdBy(creator)
                .build());
        Cat cat = catRepository.saveAndFlush(Cat.builder()
                .name("Luna")
                .birthDate(LocalDate.of(2021, 2, 2))
                .sex(Sex.FEMALE)
                .owner(owner)
                .createdBy(creator)
                .build());
        Stay stay = Stay.builder()
                .startAt(LocalDateTime.now().plusDays(1))
                .endAt(LocalDateTime.now().plusDays(3))
                .owner(owner)
                .createdBy(creator)
                .build();
        StayCat stayCat = StayCat.builder()
                .stay(stay)
                .cat(cat)
                .build();
        stay.getStayCats().add(stayCat);
        cat.getStayCats().add(stayCat);
        stay = stayRepository.saveAndFlush(stay);

        UUID vetId = vet.getId();
        UUID creatorId = creator.getId();
        UUID ownerId = owner.getId();
        UUID catId = cat.getId();
        UUID stayId = stay.getId();

        entityManager.clear();
        Vet persistedVet = vetRepository.findById(vetId).orElseThrow();
        Instant creatorUpdatedAt = userAccountRepository.findById(creatorId).orElseThrow().getUpdatedAt();
        Instant ownerUpdatedAt = ownerRepository.findById(ownerId).orElseThrow().getUpdatedAt();
        Instant catUpdatedAt = catRepository.findById(catId).orElseThrow().getUpdatedAt();
        Instant stayUpdatedAt = stayRepository.findById(stayId).orElseThrow().getUpdatedAt();

        assertFalse(vetRepository.existsByIdAndCatsIsNotEmpty(vetId));

        vetRepository.delete(persistedVet);
        vetRepository.flush();
        entityManager.clear();

        assertTrue(vetRepository.findById(vetId).isEmpty());
        assertEquals(creatorUpdatedAt, userAccountRepository.findById(creatorId).orElseThrow().getUpdatedAt());
        assertEquals(ownerUpdatedAt, ownerRepository.findById(ownerId).orElseThrow().getUpdatedAt());
        assertEquals(catUpdatedAt, catRepository.findById(catId).orElseThrow().getUpdatedAt());
        assertEquals(stayUpdatedAt, stayRepository.findById(stayId).orElseThrow().getUpdatedAt());
        assertEquals(1, jdbcTemplate.queryForObject(
                "select count(*) from stay_cat where stay_id = ? and cat_id = ?",
                Integer.class,
                stayId,
                catId));
    }

    @Test
    void bulkCatReferenceLookupReturnsOnlyReferencedCandidateVetIds() {
        UserAccount creator = saveCreator("bulk-vet-reference-creator");
        Owner owner = saveOwner(creator, "Bulk Vet Owner");
        Vet referencedCandidate = vetRepository.saveAndFlush(Vet.builder()
                .name("Referenced candidate")
                .createdBy(creator)
                .build());
        Vet unreferencedCandidate = vetRepository.saveAndFlush(Vet.builder()
                .name("Unreferenced candidate")
                .createdBy(creator)
                .build());
        Vet referencedNonCandidate = vetRepository.saveAndFlush(Vet.builder()
                .name("Referenced non-candidate")
                .createdBy(creator)
                .build());

        catRepository.saveAndFlush(Cat.builder()
                .name("First candidate cat")
                .birthDate(LocalDate.of(2020, 1, 1))
                .sex(Sex.FEMALE)
                .owner(owner)
                .vet(referencedCandidate)
                .createdBy(creator)
                .build());
        catRepository.saveAndFlush(Cat.builder()
                .name("Second candidate cat")
                .birthDate(LocalDate.of(2021, 1, 1))
                .sex(Sex.MALE)
                .owner(owner)
                .vet(referencedCandidate)
                .createdBy(creator)
                .build());
        catRepository.saveAndFlush(Cat.builder()
                .name("Non-candidate cat")
                .birthDate(LocalDate.of(2022, 1, 1))
                .sex(Sex.FEMALE)
                .owner(owner)
                .vet(referencedNonCandidate)
                .createdBy(creator)
                .build());

        Set<UUID> result = vetRepository.findVetIdsReferencedByCats(Set.of(
                referencedCandidate.getId(),
                unreferencedCandidate.getId()));

        assertEquals(Set.of(referencedCandidate.getId()), result);
    }

    private UserAccount saveCreator(String username) {
        return userAccountRepository.saveAndFlush(UserAccount.builder()
                .username(username)
                .passwordHash("hash")
                .role(UserRole.STAFF)
                .enabled(true)
                .build());
    }

    private Owner saveOwner(UserAccount creator, String name) {
        return ownerRepository.saveAndFlush(Owner.builder()
                .fullName(name)
                .primaryPhone("123456789")
                .createdBy(creator)
                .build());
    }

    private Integer countRows(String table, UUID id) {
        return jdbcTemplate.queryForObject(
                "select count(*) from " + table + " where id = ?",
                Integer.class,
                id);
    }

}
