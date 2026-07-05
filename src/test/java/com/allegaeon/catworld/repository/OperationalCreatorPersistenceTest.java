package com.allegaeon.catworld.repository;

import com.allegaeon.catworld.config.JpaAuditingConfig;
import com.allegaeon.catworld.model.Cat;
import com.allegaeon.catworld.model.Owner;
import com.allegaeon.catworld.model.Sex;
import com.allegaeon.catworld.model.Stay;
import com.allegaeon.catworld.model.UserAccount;
import com.allegaeon.catworld.model.UserRole;
import com.allegaeon.catworld.model.Vet;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.context.annotation.Import;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.jdbc.core.JdbcTemplate;

import java.sql.Timestamp;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;

@DataJpaTest(properties = {
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "spring.flyway.enabled=false"
})
@Import(JpaAuditingConfig.class)
class OperationalCreatorPersistenceTest {

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

    @Test
    void persistsValidCreatorsForOperationalRecords() {
        UserAccount creator = saveCreator("creator");

        Owner owner = ownerRepository.saveAndFlush(Owner.builder()
                .fullName("John Owner")
                .primaryPhone("123456789")
                .createdBy(creator)
                .build());

        Vet vet = vetRepository.saveAndFlush(Vet.builder()
                .name("Central Vet")
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

        Stay stay = stayRepository.saveAndFlush(Stay.builder()
                .startAt(LocalDateTime.now().plusDays(1))
                .endAt(LocalDateTime.now().plusDays(5))
                .owner(owner)
                .createdBy(creator)
                .build());

        assertEquals(creator.getId(), owner.getCreatedBy().getId());
        assertEquals(creator.getId(), vet.getCreatedBy().getId());
        assertEquals(creator.getId(), cat.getCreatedBy().getId());
        assertEquals(creator.getId(), stay.getCreatedBy().getId());
    }

    @Test
    void ownerRejectsMissingOrInvalidCreator() {
        assertThrows(DataIntegrityViolationException.class, () ->
                insertOwner(UUID.randomUUID(), null));
        assertThrows(DataIntegrityViolationException.class, () ->
                insertOwner(UUID.randomUUID(), UUID.randomUUID()));
    }

    @Test
    void vetRejectsMissingOrInvalidCreator() {
        assertThrows(DataIntegrityViolationException.class, () ->
                insertVet(UUID.randomUUID(), null));
        assertThrows(DataIntegrityViolationException.class, () ->
                insertVet(UUID.randomUUID(), UUID.randomUUID()));
    }

    @Test
    void catRejectsMissingOrInvalidCreator() {
        UserAccount creator = saveCreator("cat-owner-creator");
        Owner owner = saveOwner("Cat Owner", creator);

        assertThrows(DataIntegrityViolationException.class, () ->
                insertCat(UUID.randomUUID(), owner.getId(), null));
        assertThrows(DataIntegrityViolationException.class, () ->
                insertCat(UUID.randomUUID(), owner.getId(), UUID.randomUUID()));
    }

    @Test
    void stayRejectsMissingOrInvalidCreator() {
        UserAccount creator = saveCreator("stay-owner-creator");
        Owner owner = saveOwner("Stay Owner", creator);

        assertThrows(DataIntegrityViolationException.class, () ->
                insertStay(UUID.randomUUID(), owner.getId(), null));
        assertThrows(DataIntegrityViolationException.class, () ->
                insertStay(UUID.randomUUID(), owner.getId(), UUID.randomUUID()));
    }

    @Test
    void userAccountDoesNotHaveCreatorSelfReference() {
        Integer columnCount = jdbcTemplate.queryForObject("""
                select count(*)
                from INFORMATION_SCHEMA.COLUMNS
                where TABLE_NAME = 'USER_ACCOUNTS'
                and COLUMN_NAME = 'CREATED_BY_ID'
                """, Integer.class);

        assertEquals(0, columnCount);
        assertFalse(UserAccount.class.getDeclaredFields().length == 0);
        assertThrows(NoSuchFieldException.class, () -> UserAccount.class.getDeclaredField("createdBy"));
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

    private void insertOwner(UUID ownerId, UUID creatorId) {
        jdbcTemplate.update("""
                insert into owners (id, full_name, primary_phone, created_by_id, created_at, updated_at)
                values (?, ?, ?, ?, ?, ?)
                """,
                ownerId,
                "Owner",
                "123456789",
                creatorId,
                Timestamp.from(Instant.now()),
                Timestamp.from(Instant.now()));
    }

    private void insertVet(UUID vetId, UUID creatorId) {
        jdbcTemplate.update("""
                insert into vets (id, name, created_by_id, created_at, updated_at)
                values (?, ?, ?, ?, ?)
                """,
                vetId,
                "Central Vet",
                creatorId,
                Timestamp.from(Instant.now()),
                Timestamp.from(Instant.now()));
    }

    private void insertCat(UUID catId, UUID ownerId, UUID creatorId) {
        jdbcTemplate.update("""
                insert into cats (id, name, birth_date, sex, owner_id, created_by_id, created_at, updated_at)
                values (?, ?, ?, ?, ?, ?, ?, ?)
                """,
                catId,
                "Milo",
                LocalDate.of(2020, 1, 1),
                Sex.MALE.name(),
                ownerId,
                creatorId,
                Timestamp.from(Instant.now()),
                Timestamp.from(Instant.now()));
    }

    private void insertStay(UUID stayId, UUID ownerId, UUID creatorId) {
        jdbcTemplate.update("""
                insert into stays (id, owner_id, start_at, end_at, created_by_id, created_at, updated_at)
                values (?, ?, ?, ?, ?, ?, ?)
                """,
                stayId,
                ownerId,
                Timestamp.valueOf(LocalDateTime.now().plusDays(1)),
                Timestamp.valueOf(LocalDateTime.now().plusDays(5)),
                creatorId,
                Timestamp.from(Instant.now()),
                Timestamp.from(Instant.now()));
    }
}
