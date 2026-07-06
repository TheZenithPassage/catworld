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
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.context.annotation.Import;
import org.springframework.jdbc.core.JdbcTemplate;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

@DataJpaTest(properties = {
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "spring.flyway.enabled=false"
})
@Import(JpaAuditingConfig.class)
class StayDeletionPersistenceTest {

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
    void deletingStayDeletesOwnedStayCatLinksOnly() {
        UserAccount creator = userAccountRepository.saveAndFlush(UserAccount.builder()
                .username("creator")
                .passwordHash("hash")
                .role(UserRole.STAFF)
                .enabled(true)
                .build());

        Owner owner = ownerRepository.saveAndFlush(Owner.builder()
                .fullName("Stay Owner")
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

        Stay stay = Stay.builder()
                .startAt(LocalDateTime.now().plusDays(1))
                .endAt(LocalDateTime.now().plusDays(5))
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
        UUID stayId = stay.getId();
        UUID catId = cat.getId();
        UUID ownerId = owner.getId();
        UUID vetId = vet.getId();
        UUID creatorId = creator.getId();

        assertEquals(1, countStayCatRows(stayId));

        stayRepository.delete(stay);
        stayRepository.flush();

        assertTrue(stayRepository.findById(stayId).isEmpty());
        assertEquals(0, countStayCatRows(stayId));
        assertTrue(catRepository.findById(catId).isPresent());
        assertTrue(ownerRepository.findById(ownerId).isPresent());
        assertTrue(vetRepository.findById(vetId).isPresent());
        assertTrue(userAccountRepository.findById(creatorId).isPresent());
    }

    private Integer countStayCatRows(UUID stayId) {
        return jdbcTemplate.queryForObject(
                "select count(*) from stay_cat where stay_id = ?",
                Integer.class,
                stayId);
    }
}
