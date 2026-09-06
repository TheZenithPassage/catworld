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
import static org.junit.jupiter.api.Assertions.*;

@DataJpaTest(properties = {"spring.jpa.hibernate.ddl-auto=create-drop", "spring.flyway.enabled=false"})
@Import({JpaAuditingConfig.class, StayLookupReadRepository.class})
class ActivityLookupPersistenceTest {
    @Autowired UserAccountRepository users;
    @Autowired OwnerRepository owners;
    @Autowired CatRepository cats;
    @Autowired StayRepository stays;
    @Autowired StayCatRepository links;
    @Autowired StayLookupReadRepository lookup;

    @Test
    void usernameLookupIncludesDisabledAccountsWithStablePagesAndLiteralMatching() {
        for (int i = 0; i < 7; i++) users.save(UserAccount.builder().username("lookup" + i)
                .passwordHash("hash").role(UserRole.STAFF).enabled(i != 0).build());
        var first = users.searchLookup("LOOKUP", PageRequest.of(0, 5, Sort.by("username", "id")));
        assertEquals(7, first.getTotalElements());
        assertEquals(List.of("lookup0", "lookup1", "lookup2", "lookup3", "lookup4"), first.map(UserAccount::getUsername).getContent());
        assertFalse(first.getContent().getFirst().isEnabled());
        assertEquals(List.of("lookup5", "lookup6"), users.searchLookup("lookup", PageRequest.of(1, 5, Sort.by("username", "id"))).map(UserAccount::getUsername).getContent());
        var literal = users.save(UserAccount.builder().username("literal_%!").passwordHash("hash").role(UserRole.STAFF).enabled(false).build());
        assertEquals(List.of(literal.getId()), users.searchLookup("!_!%!!", PageRequest.of(0, 5, Sort.by("username", "id"))).map(UserAccount::getId).getContent());
    }

    @Test
    void stayLookupOverlapsInclusiveCalendarDatesAndPagesWholeStaysAcrossLifecycleStates() {
        var actor = users.save(UserAccount.builder().username("stay-lookup").passwordHash("hash").role(UserRole.ADMIN).enabled(true).build());
        var owner = owners.save(Owner.builder().fullName("Owner").primaryPhone("1").createdBy(actor).build());
        var cat = cats.save(Cat.builder().name("Miso").birthDate(LocalDate.of(2020,1,1)).sex(Sex.FEMALE).owner(owner).createdBy(actor).build());
        var otherCat = cats.save(Cat.builder().name("Ada").birthDate(LocalDate.of(2020,1,1)).sex(Sex.FEMALE).owner(owner).createdBy(actor).build());
        LocalDate first = LocalDate.of(2026,8,10);
        java.util.ArrayList<Stay> created = new java.util.ArrayList<>();
        for (int i=0; i<7; i++) {
            var stay = stays.save(Stay.builder().owner(owner).createdBy(actor).startAt(first.plusDays(i).atTime(23,59))
                    .endAt(first.plusDays(i+1).atStartOfDay()).cancelledAt(i==0 ? first.atStartOfDay() : null).build());
            links.save(StayCat.builder().stay(stay).cat(cat).build()); links.save(StayCat.builder().stay(stay).cat(otherCat).build()); created.add(stay);
        }
        stays.flush();
        assertEquals(7, lookup.find(owner.getId(),null,null,null,0).getTotalElements());
        assertEquals(created.subList(0,5).stream().map(Stay::getId).toList(), lookup.find(null,cat.getId(),null,null,0).map(Stay::getId).getContent());
        assertEquals(2, lookup.find(owner.getId(),null,null,null,1).getNumberOfElements());
        assertEquals(7, lookup.find(null,null,first.plusDays(1),null,0).getTotalElements());
        assertEquals(1, lookup.find(null,null,null,first,0).getTotalElements());
        assertEquals(2, lookup.find(null,null,first.plusDays(1),first.plusDays(1),0).getTotalElements());
        assertEquals(2, lookup.find(owner.getId(),null,first.plusDays(1),first.plusDays(1),0).getTotalElements());
        assertEquals(2, lookup.find(null,cat.getId(),first.plusDays(1),first.plusDays(1),0).getTotalElements());
        assertEquals(0, lookup.find(null,null,first.plusDays(8),null,0).getTotalElements());
        assertEquals(7, lookup.find(owner.getId(),null,null,null,9).getTotalElements());
        assertTrue(lookup.find(owner.getId(),null,null,null,9).isEmpty());
    }
}
