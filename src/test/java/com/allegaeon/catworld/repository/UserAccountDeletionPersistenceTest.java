package com.allegaeon.catworld.repository;

import com.allegaeon.catworld.config.JpaAuditingConfig;
import com.allegaeon.catworld.model.Cat;
import com.allegaeon.catworld.model.Owner;
import com.allegaeon.catworld.model.Sex;
import com.allegaeon.catworld.model.Stay;
import com.allegaeon.catworld.model.UserAccount;
import com.allegaeon.catworld.model.UserRole;
import com.allegaeon.catworld.model.Vet;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
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
class UserAccountDeletionPersistenceTest {

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
    void deletesUnreferencedAccountWithoutChangingOtherAccounts() {
        UserAccount target = saveAccount("unreferenced-target");
        UserAccount unrelated = saveAccount("unrelated-account");
        UUID targetId = target.getId();
        UUID unrelatedId = unrelated.getId();

        assertFalse(hasAnyCreatorReference(targetId));

        userAccountRepository.delete(target);
        userAccountRepository.flush();
        entityManager.clear();

        assertTrue(userAccountRepository.findById(targetId).isEmpty());
        assertTrue(userAccountRepository.findById(unrelatedId).isPresent());
    }

    @ParameterizedTest
    @EnumSource(CreatorReference.class)
    void creatorForeignKeyRejectsReferencedAccountDeletion(CreatorReference reference) {
        UserAccount target = saveAccount(reference.name().toLowerCase() + "-target");
        UserAccount supportingCreator = saveAccount(reference.name().toLowerCase() + "-support");
        createReference(reference, target, supportingCreator);
        UUID targetId = target.getId();

        assertTrue(hasReference(reference, targetId));

        assertThrows(
                DataIntegrityViolationException.class,
                () -> jdbcTemplate.update("delete from user_accounts where id = ?", targetId));

        assertEquals(1, jdbcTemplate.queryForObject(
                "select count(*) from user_accounts where id = ?",
                Integer.class,
                targetId));
    }

    private void createReference(
            CreatorReference reference,
            UserAccount target,
            UserAccount supportingCreator) {
        switch (reference) {
            case OWNER -> saveOwner("Target-created owner", target);
            case VET -> vetRepository.saveAndFlush(Vet.builder()
                    .name("Target-created vet")
                    .createdBy(target)
                    .build());
            case CAT -> {
                Owner owner = saveOwner("Supporting cat owner", supportingCreator);
                catRepository.saveAndFlush(Cat.builder()
                        .name("Target-created cat")
                        .birthDate(LocalDate.of(2020, 1, 1))
                        .sex(Sex.FEMALE)
                        .owner(owner)
                        .createdBy(target)
                        .build());
            }
            case STAY -> {
                Owner owner = saveOwner("Supporting stay owner", supportingCreator);
                stayRepository.saveAndFlush(Stay.builder()
                        .startAt(LocalDateTime.now().plusDays(1))
                        .endAt(LocalDateTime.now().plusDays(2))
                        .owner(owner)
                        .createdBy(target)
                        .build());
            }
        }
    }

    private boolean hasAnyCreatorReference(UUID accountId) {
        return ownerRepository.existsByCreatedBy_Id(accountId)
                || catRepository.existsByCreatedBy_Id(accountId)
                || vetRepository.existsByCreatedBy_Id(accountId)
                || stayRepository.existsByCreatedBy_Id(accountId);
    }

    private boolean hasReference(CreatorReference reference, UUID accountId) {
        return switch (reference) {
            case OWNER -> ownerRepository.existsByCreatedBy_Id(accountId);
            case CAT -> catRepository.existsByCreatedBy_Id(accountId);
            case VET -> vetRepository.existsByCreatedBy_Id(accountId);
            case STAY -> stayRepository.existsByCreatedBy_Id(accountId);
        };
    }

    private UserAccount saveAccount(String username) {
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

    private enum CreatorReference {
        OWNER,
        CAT,
        VET,
        STAY
    }
}
