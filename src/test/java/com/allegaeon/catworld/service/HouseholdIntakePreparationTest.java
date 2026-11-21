package com.allegaeon.catworld.service;

import com.allegaeon.catworld.config.JpaAuditingConfig;
import com.allegaeon.catworld.exception.ResourceNotFoundException;
import com.allegaeon.catworld.model.Cat;
import com.allegaeon.catworld.model.Owner;
import com.allegaeon.catworld.model.Sex;
import com.allegaeon.catworld.model.Stay;
import com.allegaeon.catworld.model.StayCat;
import com.allegaeon.catworld.model.StayStatus;
import com.allegaeon.catworld.model.UserAccount;
import com.allegaeon.catworld.model.UserRole;
import com.allegaeon.catworld.repository.CatRepository;
import com.allegaeon.catworld.repository.OwnerRepository;
import com.allegaeon.catworld.repository.StayCatRepository;
import com.allegaeon.catworld.repository.StayRepository;
import com.allegaeon.catworld.repository.UserAccountRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.context.annotation.Import;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@DataJpaTest(properties = {"spring.jpa.hibernate.ddl-auto=create-drop", "spring.flyway.enabled=false"})
@Import(JpaAuditingConfig.class)
class HouseholdIntakePreparationTest {
    private static final Clock CLOCK = Clock.fixed(Instant.parse("2026-11-21T01:00:00Z"),
            ZoneId.of("America/Argentina/Buenos_Aires"));
    private static final LocalDate TODAY = LocalDate.of(2026, 11, 20);

    @Autowired private CatRepository cats;
    @Autowired private OwnerRepository owners;
    @Autowired private StayRepository stays;
    @Autowired private StayCatRepository stayCats;
    @Autowired private UserAccountRepository users;
    private HouseholdIntakePreparation preparation;
    private UserAccount creator;
    private Owner owner;

    @BeforeEach
    void setUp() {
        preparation = new HouseholdIntakePreparation(cats, stays, stayCats, CLOCK);
        creator = users.save(UserAccount.builder().username("household-test").passwordHash("hash")
                .role(UserRole.ADMIN).enabled(true).build());
        owner = saveOwner("Primary tutor");
    }

    @Test
    void scopesLivingCatsToTheTutorAndKeepsNamesAndDuplicateNamesOrdered() {
        Cat first = saveCat(owner, "Alba", false);
        Cat second = saveCat(owner, "Alba", false);
        Cat last = saveCat(owner, "Tilo", false);
        Cat deceased = saveCat(owner, "Absent", true);
        Cat foreign = saveCat(saveOwner("Another tutor"), "Foreign", false);

        List<UUID> ids = preparation.livingCats(owner.getId()).stream().map(Cat::getId).toList();

        assertThat(ids.subList(0, 2)).containsExactlyInAnyOrder(first.getId(), second.getId());
        assertThat(ids).hasSize(3).endsWith(last.getId());
        assertThat(preparation.livingCats(owner.getId())).extracting(Cat::getId).containsExactlyElementsOf(ids);
        assertThat(preparation.prepare(owner.getId(), List.of(first, deceased, foreign), null))
                .containsOnlyKeys(first.getId());
    }

    @Test
    void usesSelectedArrivalForItsCatsAndEarliestUpcomingStayForOthers() {
        Cat booked = saveCat(owner, "Alba", false);
        booked.setLastRabiesDate(LocalDate.of(2025, 11, 30));
        Cat other = saveCat(owner, "Tilo", false);
        Arrival earlier = new Arrival("2026-11-21T09:00", "2026-11-22T09:00");
        saveStay(owner, earlier, null, booked);
        Stay selected = saveStay(owner, new Arrival("2026-11-28T00:00", "2026-11-30T10:00"), null, booked);
        saveStay(owner, new Arrival("2026-11-20T20:00", "2026-11-21T10:00"), null, other);
        saveStay(owner, new Arrival("2026-11-24T10:00", "2026-11-25T10:00"), LocalDateTime.now(CLOCK), other);
        saveStay(owner, new Arrival("2026-12-01T10:00", "2026-12-03T10:00"), null, other);
        saveStay(owner, new Arrival("2026-12-05T10:00", "2026-12-06T10:00"), null, other);

        var fromArrival = preparation.prepare(owner.getId(), List.of(booked, other), selected.getId());
        var fromTutor = preparation.prepare(owner.getId(), List.of(booked, other), null);

        assertThat(fromArrival.get(booked.getId()).through()).isEqualTo("2026-11-30");
        assertThat(fromArrival.get(booked.getId()).requestedFields()).contains("lastRabiesDate");
        assertThat(fromTutor.get(booked.getId()).through()).isEqualTo("2026-11-22");
        assertThat(fromTutor.get(booked.getId()).requestedFields()).doesNotContain("lastRabiesDate");
        assertThat(fromArrival.get(other.getId()).through()).isEqualTo("2026-12-03");
        assertThat(fromTutor.get(other.getId()).through()).isEqualTo("2026-12-03");
    }

    @Test
    void usesSelectedOverdueArrivalEvenWhenAnotherStayIsUpcomingForThatCat() {
        Cat cat = saveCat(owner, "Alba", false);
        Cat deceased = saveCat(owner, "Absent", true);
        Cat foreign = saveCat(saveOwner("Another tutor"), "Foreign", false);
        Stay overdue = saveStay(owner, new Arrival("2026-11-19T08:00", "2026-11-21T09:00"),
                null, cat, deceased, foreign);
        saveStay(owner, new Arrival("2026-11-24T09:00", "2026-11-26T09:00"), null, cat);

        var result = preparation.prepare(owner.getId(), List.of(cat, deceased, foreign), overdue.getId());

        assertThat(result).containsOnlyKeys(cat.getId());
        assertThat(result.get(cat.getId()).through()).isEqualTo("2026-11-21");
    }

    @Test
    void rejectsForeignCancelledAndConfirmedArrivalsAtIssuance() {
        Cat cat = saveCat(owner, "Alba", false);
        Owner foreignOwner = saveOwner("Another tutor");
        Stay foreign = saveStay(foreignOwner, new Arrival("2026-11-21T09:00", "2026-11-22T09:00"), null);
        Stay cancelled = saveStay(owner, new Arrival("2026-11-21T09:00", "2026-11-22T09:00"),
                LocalDateTime.now(CLOCK), cat);
        Stay checkedIn = saveStay(owner, new Arrival("2026-11-20T19:00", "2026-11-23T09:00"), null, cat);
        checkedIn.setMovementStatus(StayStatus.CHECKED_IN);

        for (Stay stay : List.of(foreign, cancelled, checkedIn)) {
            assertThatThrownBy(() -> preparation.prepare(owner.getId(), List.of(cat), stay.getId()))
                    .isInstanceOf(ResourceNotFoundException.class);
        }
    }

    @Test
    void fallsBackToBusinessDateAndRequestsMissingBrandsAndVaccinations() {
        Cat cat = saveCat(owner, "Alba", false);
        cat.setLitterBrand(" \t");
        cat.setLastRabiesDate(LocalDate.of(2025, 11, 21));

        var result = preparation.prepare(owner.getId(), List.of(cat), null).get(cat.getId());

        assertThat(result.through()).isEqualTo(TODAY);
        assertThat(result.requestedFields()).containsExactly("foodBrand", "litterBrand", "lastTripleFelineDate");
    }

    private Cat saveCat(Owner tutor, String name, boolean deceased) {
        return cats.save(Cat.builder().owner(tutor).name(name).deceased(deceased)
                .birthDate(LocalDate.of(2020, 1, 1)).sex(Sex.FEMALE).createdBy(creator).build());
    }

    private Owner saveOwner(String name) {
        return owners.save(Owner.builder().fullName(name).primaryPhone("1").createdBy(creator).build());
    }

    private Stay saveStay(Owner tutor, Arrival arrival, LocalDateTime cancelledAt, Cat... booked) {
        Stay stay = stays.save(Stay.builder().owner(tutor).createdBy(creator)
                .startAt(LocalDateTime.parse(arrival.start())).endAt(LocalDateTime.parse(arrival.end()))
                .cancelledAt(cancelledAt).pricePending(true).build());
        for (Cat cat : booked) {
            stayCats.save(StayCat.builder().stay(stay).cat(cat).build());
        }
        return stay;
    }

    private record Arrival(String start, String end) {}
}
