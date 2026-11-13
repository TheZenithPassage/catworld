package com.allegaeon.catworld.controller;

import com.allegaeon.catworld.model.Cat;
import com.allegaeon.catworld.model.Owner;
import com.allegaeon.catworld.model.Sex;
import com.allegaeon.catworld.model.Stay;
import com.allegaeon.catworld.model.StayCat;
import com.allegaeon.catworld.model.UserAccount;
import com.allegaeon.catworld.model.UserRole;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.context.annotation.Primary;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;

import static org.hamcrest.Matchers.contains;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(properties = "spring.datasource.url=jdbc:h2:mem:operations_agenda;MODE=MySQL")
@ActiveProfiles("test")
@AutoConfigureMockMvc
@Import(OperationsAgendaIntegrationTest.FixedBusinessClock.class)
@Transactional
class OperationsAgendaIntegrationTest {

    private static final String AGENDA = "/api/operations/agenda";

    @Autowired
    private MockMvc mvc;
    @Autowired
    private EntityManager entityManager;

    private UserAccount creator;
    private Owner owner;

    @BeforeEach
    void createOwner() {
        creator = UserAccount.builder().username("agenda-fixture").passwordHash("unused")
                .role(UserRole.STAFF).enabled(true).build();
        entityManager.persist(creator);
        owner = Owner.builder().fullName("Dueña de prueba").primaryPhone("5550100")
                .createdBy(creator).build();
        entityManager.persist(owner);
    }

    @Test
    void usesBusinessTodayAndKeepsEachMovementAndItsCatsTogether() throws Exception {
        var midnightDeparture = saveStay("2030-05-31T18:00", "2030-06-01T00:00", "Oliva");
        var endingNow = saveStay("2030-05-31T18:00", "2030-06-01T23:00", "Zafiro");
        endingNow.setDepartureTransferRequired(true);
        var startingNow = saveStay("2030-06-01T23:00", "2030-06-03T08:00", "Nube", "Alba");
        startingNow.setArrivalTransferRequired(true);
        startingNow.setTransferWaived(true);
        var laterToday = saveStay("2030-06-01T23:30", "2030-06-01T23:59:59.999999", "Lima");
        var tomorrow = saveStay("2030-06-02T00:00", "2030-06-03T10:00", "Menta");
        var lastUpcoming = saveStay("2030-06-08T23:59:59.999999", "2030-06-09T00:00", "Pimienta");
        var spanning = saveStay("2030-05-30T10:00", "2030-06-10T10:00", "Azul");
        var cancelled = saveStay("2030-06-01T20:00", "2030-06-02T08:00", "Canela");
        cancelled.setCancelledAt(LocalDateTime.parse("2030-05-31T20:00"));
        flushAndClear();

        mvc.perform(get(AGENDA).with(user("staff").roles("STAFF")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.date").value("2030-06-01"))
                .andExpect(jsonPath("$.businessDate").value("2030-06-01"))
                .andExpect(jsonPath("$.movements[*].stay.stayId", contains(
                        id(midnightDeparture), id(startingNow), id(endingNow), id(laterToday), id(laterToday))))
                .andExpect(jsonPath("$.movements[0].type").value("DEPARTURE"))
                .andExpect(jsonPath("$.movements[1].type").value("ARRIVAL"))
                .andExpect(jsonPath("$.movements[1].scheduledAt").value("2030-06-01T23:00:00"))
                .andExpect(jsonPath("$.movements[1].transferRequired").value(true))
                .andExpect(jsonPath("$.movements[1].stay.cats[*].name", contains("Alba", "Nube")))
                .andExpect(jsonPath("$.movements[1].stay.ownerName").value("Dueña de prueba"))
                .andExpect(jsonPath("$.movements[1].stay.primaryPhone").doesNotExist())
                .andExpect(jsonPath("$.movements[1].stay.agreedAmount").doesNotExist())
                .andExpect(jsonPath("$.movements[2].transferRequired").value(true))
                .andExpect(jsonPath("$.movements[4].scheduledAt").value("2030-06-01T23:59:59.999999"))
                .andExpect(jsonPath("$.boardingStays[*].stayId", contains(id(startingNow), id(spanning))))
                .andExpect(jsonPath("$.upcomingDays.length()").value(7))
                .andExpect(jsonPath("$.upcomingDays[0].date").value("2030-06-02"))
                .andExpect(jsonPath("$.upcomingDays[0].movements[*].stay.stayId", contains(id(tomorrow))))
                .andExpect(jsonPath("$.upcomingDays[1].movements[0].stay.stayId").value(id(startingNow)))
                .andExpect(jsonPath("$.upcomingDays[1].movements[0].transferRequired").value(false))
                .andExpect(jsonPath("$.upcomingDays[6].date").value("2030-06-08"))
                .andExpect(jsonPath("$.upcomingDays[6].movements[*].stay.stayId", contains(id(lastUpcoming))));
    }

    @Test
    void anotherDateShowsOnlyStaysOverlappingTheHalfOpenDay() throws Exception {
        var justEnded = saveStay("2030-06-01T17:00", "2030-06-02T00:00", "Oliva");
        var fullDay = saveStay("2030-06-02T00:00", "2030-06-03T00:00", "Nube");
        var nextDay = saveStay("2030-06-03T00:00", "2030-06-05T08:00", "Alba");
        var historical = saveStay("2030-06-02T13:00", "2030-06-03T12:00");
        flushAndClear();

        mvc.perform(get(AGENDA).param("date", "2030-06-02").with(user("admin").roles("ADMIN")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.date").value("2030-06-02"))
                .andExpect(jsonPath("$.businessDate").value("2030-06-01"))
                .andExpect(jsonPath("$.boardingStays[*].stayId", contains(id(fullDay))))
                .andExpect(jsonPath("$.movements[*].stay.stayId", contains(id(fullDay), id(justEnded), id(historical))))
                .andExpect(jsonPath("$.upcomingDays[0].movements[*].stay.stayId",
                        contains(id(nextDay), id(fullDay), id(historical))));
    }

    @Test
    void enforcesOperationalRolesAndRejectsInvalidDates() throws Exception {
        mvc.perform(get(AGENDA)).andExpect(status().isUnauthorized());
        mvc.perform(get(AGENDA).with(user("other").roles("OTHER"))).andExpect(status().isForbidden());
        for (String date : new String[]{"2030-02-30", "2030-06-01+00:00", "+999999999-12-31"}) {
            mvc.perform(get(AGENDA).param("date", date).with(user("staff").roles("STAFF")))
                    .andExpect(status().isBadRequest());
        }
    }

    private Stay saveStay(String startAt, String endAt, String... names) {
        var stay = Stay.builder().startAt(LocalDateTime.parse(startAt)).endAt(LocalDateTime.parse(endAt))
                .owner(owner).createdBy(creator).build();
        entityManager.persist(stay);
        for (String name : names) {
            var cat = Cat.builder().name(name).birthDate(LocalDate.of(2024, 1, 1))
                    .sex(Sex.FEMALE).owner(owner).createdBy(creator).build();
            entityManager.persist(cat);
            entityManager.persist(StayCat.builder().stay(stay).cat(cat).build());
        }
        return stay;
    }

    private void flushAndClear() {
        entityManager.flush();
        entityManager.clear();
    }

    private static String id(Stay stay) {
        return stay.getId().toString();
    }

    @TestConfiguration
    static class FixedBusinessClock {
        @Bean
        @Primary
        Clock fixedClock() {
            return Clock.fixed(Instant.parse("2030-06-02T02:00:00Z"),
                    ZoneId.of("America/Argentina/Buenos_Aires"));
        }
    }
}
