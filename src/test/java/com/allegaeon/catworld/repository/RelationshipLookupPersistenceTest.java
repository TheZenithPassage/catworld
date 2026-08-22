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
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;

@DataJpaTest(properties = {"spring.jpa.hibernate.ddl-auto=create-drop", "spring.flyway.enabled=false"})
@Import(JpaAuditingConfig.class)
class RelationshipLookupPersistenceTest {

    private static final Sort CAT_ORDER = Sort.by(Sort.Order.asc("name"), Sort.Order.asc("id"));
    private static final Sort STAY_ORDER = Sort.by(Sort.Order.desc("startAt"), Sort.Order.asc("id"));

    @Autowired UserAccountRepository userAccounts;
    @Autowired OwnerRepository owners;
    @Autowired VetRepository vets;
    @Autowired CatRepository cats;
    @Autowired StayRepository stays;
    @Autowired StayCatRepository stayCats;

    @Test
    void ownerAndVetCatPagesAreDatabaseOrderedBeforeFixedPageSelection() {
        UserAccount creator = userAccounts.save(UserAccount.builder().username("relationship-cats")
                .passwordHash("hash").role(UserRole.ADMIN).enabled(true).build());
        Owner owner = owners.save(Owner.builder().fullName("Owner").primaryPhone("1").createdBy(creator).build());
        Vet vet = vets.save(Vet.builder().name("Vet").createdBy(creator).build());
        List<Cat> saved = new ArrayList<>();
        for (String name : List.of("Zulu", "Alpha", "Echo", "Bravo", "Alpha", "Delta")) {
            saved.add(cats.save(Cat.builder().name(name).birthDate(LocalDate.of(2020, 1, 1))
                    .sex(Sex.FEMALE).owner(owner).vet(vet).createdBy(creator).build()));
        }
        List<Cat> expected = saved.stream().sorted(Comparator.comparing(Cat::getName)
                .thenComparing(value -> value.getId().toString())).toList();

        var ownerFirst = cats.findByOwner_Id(owner.getId(), PageRequest.of(0, 5, CAT_ORDER));
        var ownerSecond = cats.findByOwner_Id(owner.getId(), PageRequest.of(1, 5, CAT_ORDER));
        var vetFirst = cats.findByVet_Id(vet.getId(), PageRequest.of(0, 5, CAT_ORDER));

        assertEquals(expected.subList(0, 5).stream().map(Cat::getId).toList(), ownerFirst.map(Cat::getId).getContent());
        assertEquals(List.of(expected.get(5).getId()), ownerSecond.map(Cat::getId).getContent());
        assertEquals(expected.subList(0, 5).stream().map(Cat::getId).toList(), vetFirst.map(Cat::getId).getContent());
        assertEquals(6, ownerFirst.getTotalElements());
        assertEquals(2, ownerFirst.getTotalPages());
    }

    @Test
    void ownerAndCatStayPagesIncludeAllHistoryAndOrderBeforeLimiting() {
        LocalDateTime now = LocalDateTime.now();
        UserAccount creator = userAccounts.save(UserAccount.builder().username("relationship-stays")
                .passwordHash("hash").role(UserRole.ADMIN).enabled(true).build());
        Owner owner = owners.save(Owner.builder().fullName("Owner").primaryPhone("1").createdBy(creator).build());
        Cat cat = cats.save(Cat.builder().name("Cat").birthDate(LocalDate.of(2020, 1, 1))
                .sex(Sex.MALE).owner(owner).createdBy(creator).build());
        List<Stay> saved = new ArrayList<>();
        List<LocalDateTime> starts = List.of(now.plusDays(4), now.plusDays(1), now.minusHours(1),
                now.minusDays(2), now.minusDays(8), now.minusDays(8));
        for (int index = 0; index < starts.size(); index++) {
            LocalDateTime start = starts.get(index);
            Stay stay = stays.save(Stay.builder().startAt(start).endAt(start.plusHours(12)).owner(owner)
                    .cancelledAt(index == 3 ? now.minusDays(1) : null).createdBy(creator).build());
            stayCats.save(StayCat.builder().stay(stay).cat(cat).build());
            saved.add(stay);
        }
        List<Stay> expected = saved.stream().sorted(Comparator.comparing(Stay::getStartAt).reversed()
                .thenComparing(value -> value.getId().toString())).toList();

        var ownerFirst = stays.findByOwner_Id(owner.getId(), PageRequest.of(0, 5, STAY_ORDER));
        var catFirst = stayCats.findStaysByCatId(cat.getId(), PageRequest.of(0, 5));
        var catSecond = stayCats.findStaysByCatId(cat.getId(), PageRequest.of(1, 5));

        assertEquals(expected.subList(0, 5).stream().map(Stay::getId).toList(), ownerFirst.map(Stay::getId).getContent());
        assertEquals(expected.subList(0, 5).stream().map(Stay::getId).toList(), catFirst.map(Stay::getId).getContent());
        assertEquals(List.of(expected.get(5).getId()), catSecond.map(Stay::getId).getContent());
        assertEquals(6, catFirst.getTotalElements());
        assertEquals(2, catFirst.getTotalPages());
        assertEquals(List.of(StayStatus.RESERVED, StayStatus.CHECKED_IN, StayStatus.CANCELLED, StayStatus.CHECKED_OUT),
                saved.stream().limit(5).map(Stay::getStatus).distinct().toList());
    }
}
