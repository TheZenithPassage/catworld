package com.allegaeon.catworld.repository;

import com.allegaeon.catworld.config.JpaAuditingConfig;
import com.allegaeon.catworld.dto.*;
import com.allegaeon.catworld.model.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.context.annotation.Import;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;
import static org.junit.jupiter.api.Assertions.*;

@DataJpaTest(properties = {"spring.jpa.hibernate.ddl-auto=create-drop", "spring.flyway.enabled=false"})
@Import({JpaAuditingConfig.class, StayOverviewReadRepository.class})
class StayDateFilterPersistenceTest {
    @Autowired StayOverviewReadRepository reads;
    @Autowired StayRepository stays;
    @Autowired OwnerRepository owners;
    @Autowired UserAccountRepository users;
    @Autowired CatRepository cats;
    @Autowired StayCatRepository stayCats;
    private UserAccount creator;
    private Owner owner;

    @BeforeEach void setup() {
        creator = users.save(UserAccount.builder().username("date-query").passwordHash("hash")
                .role(UserRole.ADMIN).enabled(true).build());
        owner = owners.save(Owner.builder().fullName("Date owner").primaryPhone("1").createdBy(creator).build());
    }

    @ParameterizedTest
    @CsvSource({
        "OVERLAPS,2030-01-10,2030-01-20,arrival|cover|departure|inside",
        "OVERLAPS,2030-01-10,,after|arrival|cover|departure|inside",
        "OVERLAPS,,2030-01-20,arrival|before|cover|departure|inside",
        "STAY_WITHIN_RANGE,2030-01-10,2030-01-20,inside",
        "STAY_WITHIN_RANGE,2030-01-10,,after|arrival|inside",
        "STAY_WITHIN_RANGE,,2030-01-20,before|departure|inside",
        "RANGE_WITHIN_STAY,2030-01-10,2030-01-20,cover|inside",
        "RANGE_WITHIN_STAY,2030-01-10,,cover|departure|inside",
        "RANGE_WITHIN_STAY,,2030-01-20,arrival|cover|inside"
    })
    void matchesInclusiveLocalDaysBeforeQueryAndCount(StayDateMatchMode mode, String from, String to, String expected) {
        save("before", "2030-01-01T10:00", "2030-01-09T23:59:59");
        save("departure", "2030-01-01T10:00", "2030-01-10T00:00");
        save("inside", "2030-01-10T23:00", "2030-01-20T23:59:59");
        save("cover", "2030-01-01T10:00", "2030-02-01T00:00");
        save("arrival", "2030-01-20T23:59:59", "2030-01-25T10:00");
        save("after", "2030-01-21T00:00", "2030-01-25T10:00");
        var dates = new StayDateFilter(from == null ? null : LocalDate.parse(from), to == null ? null : LocalDate.parse(to), mode);
        var result = reads.find(0, 10, LocalDateTime.of(2029, 1, 1, 0, 0), null, null, null, null, false, dates);
        assertEquals(List.of(expected.split("\\|")), result.stream().map(Stay::getNotes).sorted().toList());
        assertEquals(expected.split("\\|").length, result.getTotalElements());
    }

    @Test void composesBeforePagingAndBoundsAdjacentCalendarWindows() {
        Cat cat = cats.save(Cat.builder().name("Date cat").birthDate(LocalDate.of(2020,1,1))
                .sex(Sex.FEMALE).owner(owner).createdBy(creator).build());
        for (int day = 1; day <= 12; day++) {
            Stay stay = save("match", "2030-01-%02dT10:00".formatted(day), "2030-02-01T15:00");
            stayCats.save(StayCat.builder().stay(stay).cat(cat).build());
        }
        save("no-cat", "2030-01-01T10:00", "2030-02-01T15:00");
        save("outside", "2029-12-01T10:00", "2029-12-31T23:59:59");
        Stay cancelled = save("cancelled", "2030-01-01T10:00", "2030-02-01T15:00");
        cancelled.setCancelledAt(LocalDateTime.of(2029, 12, 1, 0, 0));
        var dates = new StayDateFilter(LocalDate.of(2030,1,1), LocalDate.of(2030,1,31), StayDateMatchMode.OVERLAPS);
        var first = reads.find(0,10, LocalDateTime.of(2029,1,1,0,0), Set.of(StayStatus.RESERVED), owner.getId(), cat.getId(), Set.of(PaymentCondition.NO_PAYMENT), true, dates);
        var second = reads.find(1,10, LocalDateTime.of(2029,1,1,0,0), Set.of(StayStatus.RESERVED), owner.getId(), cat.getId(), Set.of(PaymentCondition.NO_PAYMENT), true, dates);
        assertEquals(12, first.getTotalElements());
        assertEquals(10, first.getNumberOfElements());
        assertEquals(2, second.getNumberOfElements());
        assertTrue(first.stream().allMatch(s -> "match".equals(s.getNotes())));
        assertTrue(second.stream().noneMatch(s -> first.getContent().contains(s)));
        assertEquals(14, reads.findCollection(dates).size());
        assertEquals(14, reads.findCollection(new StayDateFilter(LocalDate.of(2030,2,1), LocalDate.of(2030,2,28), StayDateMatchMode.OVERLAPS)).size());
        assertEquals(0, reads.findCollection(new StayDateFilter(LocalDate.of(2030,3,1), LocalDate.of(2030,3,31), StayDateMatchMode.OVERLAPS)).size());
    }

    private Stay save(String name, String start, String end) {
        return stays.save(Stay.builder().owner(owner).createdBy(creator).notes(name)
                .startAt(LocalDateTime.parse(start)).endAt(LocalDateTime.parse(end)).agreedAmount(BigDecimal.TEN).build());
    }
}
