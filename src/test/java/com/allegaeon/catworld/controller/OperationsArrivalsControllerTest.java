package com.allegaeon.catworld.controller;

import com.allegaeon.catworld.model.Cat;
import com.allegaeon.catworld.model.CatIntakeInvitation;
import com.allegaeon.catworld.model.CatIntakeReview;
import com.allegaeon.catworld.model.LitterPreference;
import com.allegaeon.catworld.model.Owner;
import com.allegaeon.catworld.model.Sex;
import com.allegaeon.catworld.model.Stay;
import com.allegaeon.catworld.model.StayCat;
import com.allegaeon.catworld.model.StayStatus;
import com.allegaeon.catworld.model.UserAccount;
import com.allegaeon.catworld.model.UserRole;
import com.allegaeon.catworld.repository.CatIntakeInvitationRepository;
import com.allegaeon.catworld.repository.CatIntakeReviewRepository;
import com.allegaeon.catworld.repository.CatRepository;
import com.allegaeon.catworld.repository.OwnerRepository;
import com.allegaeon.catworld.repository.StayRepository;
import com.allegaeon.catworld.repository.UserAccountRepository;
import com.jayway.jsonpath.JsonPath;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.springframework.transaction.annotation.Transactional;

import java.net.URI;
import java.time.Clock;
import java.time.Instant;
import java.time.InstantSource;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;
import java.util.UUID;
import java.util.stream.Stream;
import java.util.concurrent.atomic.AtomicReference;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.not;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.httpBasic;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(properties = "spring.datasource.url=jdbc:h2:mem:catworld_arrivals;MODE=MySQL")
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class OperationsArrivalsControllerTest {
    private static final String ARRIVALS = "/api/operations/arrivals";
    private static final String DEPARTURES = "/api/operations/departures";
    private static final String INVITATIONS = "/api/cat-intake/invitations";
    private static final Instant NOW = Instant.parse("2026-11-13T01:00:00Z");
    private static final LocalDateTime BUSINESS_NOW = LocalDateTime.parse("2026-11-12T22:00:00");

    @Autowired MockMvc mvc;
    @Autowired StayRepository stays;
    @Autowired CatRepository cats;
    @Autowired OwnerRepository owners;
    @Autowired UserAccountRepository users;
    @Autowired PasswordEncoder passwordEncoder;
    @Autowired CatIntakeInvitationRepository invitations;
    @Autowired CatIntakeReviewRepository reviews;
    @Autowired AtomicReference<Instant> clockTime;

    private UserAccount admin;
    private Owner owner;

    @TestConfiguration
    static class FixedBusinessClock {
        @Bean
        AtomicReference<Instant> arrivalsClockTime() {
            return new AtomicReference<>(NOW);
        }

        @Bean
        @Primary
        Clock arrivalsTestClock(AtomicReference<Instant> arrivalsClockTime) {
            InstantSource source = arrivalsClockTime::get;
            return source.withZone(ZoneId.of("America/Argentina/Buenos_Aires"));
        }
    }

    @BeforeEach
    void setUp() {
        clockTime.set(NOW);
        admin = users.findByUsername("test-admin").orElseThrow();
        owner = owner("Ana Example");
        users.save(UserAccount.builder().username("arrivals-staff")
                .passwordHash(passwordEncoder.encode("arrivals-staff-password"))
                .role(UserRole.STAFF).enabled(true).build());
    }

    @Test
    void defaultsToAllOfBusinessTodayThroughTheLastMomentOfDaySeven() throws Exception {
        Cat cat = cat("Milo");
        Stay last = stay("2026-11-19T23:59:59.999999", "2026-11-21T08:00", null, cat);
        stay("2026-11-20T00:00", "2026-11-21T08:00", null, cat);
        Stay overdue = stay("2026-11-11T23:59", "2026-11-15T08:00", null, cat);
        Stay started = stay("2026-11-12T00:00", "2026-11-12T08:00", null, cat);
        Stay startingNow = stay("2026-11-12T22:00", "2026-11-15T08:00", null, cat);
        stay("2026-11-14T10:00", "2026-11-15T08:00", BUSINESS_NOW, cat);
        Stay first = stay("2026-11-12T22:15", "2026-11-13T08:00", null, cat);
        first.setArrivalTransferRequired(true);

        mvc.perform(get(ARRIVALS).with(httpBasic("arrivals-staff", "arrivals-staff-password")))
                .andExpect(status().isOk())
                .andExpect(header().string("X-Arrivals-Refresh-After-Ms", "7200000"))
                .andExpect(jsonPath("$", hasSize(5)))
                .andExpect(jsonPath("$[0].id").value(overdue.getId().toString()))
                .andExpect(jsonPath("$[0].status").value("RESERVED"))
                .andExpect(jsonPath("$[0].overdue").value(true))
                .andExpect(jsonPath("$[0].canRecord").value(false))
                .andExpect(jsonPath("$[0].owner.id").value(owner.getId().toString()))
                .andExpect(jsonPath("$[0].owner.fullName").value("Ana Example"))
                .andExpect(jsonPath("$[0].owner.primaryPhone").doesNotExist())
                .andExpect(jsonPath("$[1].id").value(started.getId().toString()))
                .andExpect(jsonPath("$[1].overdue").value(false))
                .andExpect(jsonPath("$[1].canRecord").value(true))
                .andExpect(jsonPath("$[2].id").value(startingNow.getId().toString()))
                .andExpect(jsonPath("$[3].id").value(first.getId().toString()))
                .andExpect(jsonPath("$[3].startAt").value("2026-11-12T22:15:00"))
                .andExpect(jsonPath("$[3].transferRequired").value(true))
                .andExpect(jsonPath("$[4].id").value(last.getId().toString()))
                .andExpect(jsonPath("$[4].canRecord").value(false));
    }

    @Test
    void unresolvedArrivalRemainsAtItsScheduledTimeAndAfterBusinessMidnight() throws Exception {
        Cat cat = cat("Milo");
        Stay next = stay("2026-11-12T22:00:01.500", "2026-11-14T08:00", null, cat);
        Stay tomorrow = stay("2026-11-13T00:00", "2026-11-14T08:00", null, cat);
        var request = get(ARRIVALS).param("daysAhead", "0").param("includeStartedToday", "false")
                .with(httpBasic("arrivals-staff", "arrivals-staff-password"));

        mvc.perform(request)
                .andExpect(status().isOk())
                .andExpect(header().string("X-Arrivals-Refresh-After-Ms", "7200000"))
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].id").value(next.getId().toString()));

        clockTime.set(NOW.plusMillis(1500));
        mvc.perform(request).andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].canRecord").value(true));

        clockTime.set(NOW.plusSeconds(7200));
        mvc.perform(request).andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[0].id").value(next.getId().toString()))
                .andExpect(jsonPath("$[0].overdue").value(true))
                .andExpect(jsonPath("$[0].canRecord").value(false))
                .andExpect(jsonPath("$[1].id").value(tomorrow.getId().toString()))
                .andExpect(jsonPath("$[1].canRecord").value(true));
    }

    @Test
    void departuresIncludeOverdueAndProjectedStaysThroughDaySevenWithNoPreparationData() throws Exception {
        Cat milo = cat("Milo");
        Cat cora = cat("Cora");
        Stay overdue = stay("2026-11-10T10:00", "2026-11-11T08:00", null, milo);
        Stay last = stay("2026-11-18T10:00", "2026-11-19T23:59:59.999999", null, milo, cora);
        last.setDepartureTransferRequired(true);
        Stay earlier = stay("2026-11-12T11:00", "2026-11-19T23:59:59.999999", null, cora);
        earlier.setArrivalTransferRequired(true);
        stay("2026-11-18T10:00", "2026-11-20T00:00", null, milo);
        stay("2026-11-12T10:00", "2026-11-13T08:00", BUSINESS_NOW, milo);
        review(owner, milo.getId());
        List<String> tiedIds = Stream.of(last, earlier).map(stay -> stay.getId().toString()).sorted().toList();
        String multiCatRow = "$[%d]".formatted(1 + tiedIds.indexOf(last.getId().toString()));
        String singleCatRow = "$[%d]".formatted(1 + tiedIds.indexOf(earlier.getId().toString()));

        mvc.perform(get(DEPARTURES)).andExpect(status().isUnauthorized());
        mvc.perform(get(DEPARTURES).with(httpBasic("test-admin", "test-password")))
                .andExpect(status().isOk())
                .andExpect(header().string("Cache-Control", containsString("no-store")))
                .andExpect(header().string("X-Arrivals-Refresh-After-Ms", "7200000"))
                .andExpect(jsonPath("$", hasSize(3)))
                .andExpect(jsonPath("$[0].id").value(overdue.getId().toString()))
                .andExpect(jsonPath("$[0].status").value("RESERVED"))
                .andExpect(jsonPath("$[0].overdue").value(true))
                .andExpect(jsonPath("$[0].canRecord").value(false))
                .andExpect(jsonPath("$[0].cats[0].pendingReviews").doesNotHaveJsonPath())
                .andExpect(jsonPath("$[0].cats[0].vaccineWarnings").doesNotHaveJsonPath())
                .andExpect(jsonPath("$[0].cats[0].foodBrand").doesNotHaveJsonPath())
                .andExpect(jsonPath("$[0].cats[0].litterChoice").doesNotHaveJsonPath())
                .andExpect(jsonPath("$[1].id").value(tiedIds.get(0)))
                .andExpect(jsonPath("$[2].id").value(tiedIds.get(1)))
                .andExpect(jsonPath(multiCatRow + ".transferRequired").value(true))
                .andExpect(jsonPath(singleCatRow + ".transferRequired").value(false))
                .andExpect(jsonPath(multiCatRow + ".cats", hasSize(2)))
                .andExpect(jsonPath(multiCatRow + ".cats[0].name").value("Cora"))
                .andExpect(jsonPath(multiCatRow + ".cats[1].name").value("Milo"));

        mvc.perform(get(DEPARTURES).param("daysAhead", "0").with(httpBasic("arrivals-staff", "arrivals-staff-password")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].id").value(overdue.getId().toString()));
        mvc.perform(get(DEPARTURES).param("daysAhead", "-1").with(httpBasic("test-admin", "test-password")))
                .andExpect(status().isBadRequest());
    }

    @Test
    void confirmedArrivalEnablesDepartureUntilCheckout() throws Exception {
        Stay stay = stay("2026-11-12T10:00", "2026-11-12T22:30", null, cat("Milo"));
        var staff = httpBasic("arrivals-staff", "arrivals-staff-password");
        String movements = "/api/stays/" + stay.getId() + "/actual-movements/";

        mvc.perform(get(ARRIVALS).with(staff)).andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(stay.getId().toString()));
        mvc.perform(get(DEPARTURES).with(staff)).andExpect(status().isOk())
                .andExpect(jsonPath("$[0].status").value("RESERVED"))
                .andExpect(jsonPath("$[0].canRecord").value(false));

        mvc.perform(put(movements + "ARRIVAL").with(staff).contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"expectedRevision":0,"occurredAt":null}
                                """))
                .andExpect(status().isOk());
        mvc.perform(get(ARRIVALS).with(staff)).andExpect(status().isOk()).andExpect(jsonPath("$").isEmpty());
        mvc.perform(get(DEPARTURES).with(staff)).andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(stay.getId().toString()))
                .andExpect(jsonPath("$[0].status").value("CHECKED_IN"))
                .andExpect(jsonPath("$[0].canRecord").value(true));

        mvc.perform(put(movements + "DEPARTURE").with(staff).contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"expectedRevision":1,"occurredAt":null}
                                """))
                .andExpect(status().isOk());
        mvc.perform(get(ARRIVALS).with(staff)).andExpect(status().isOk()).andExpect(jsonPath("$").isEmpty());
        mvc.perform(get(DEPARTURES).with(staff)).andExpect(status().isOk()).andExpect(jsonPath("$").isEmpty());
    }

    @Test
    void acceptsLongerRangesAndRejectsInvalidValues() throws Exception {
        Cat cat = cat("Milo");
        Stay dayEight = stay("2026-11-20T23:59:59.999999", "2026-11-21T08:00", null, cat);
        stay("2026-11-21T00:00", "2026-11-21T08:00", null, cat);
        var staff = httpBasic("arrivals-staff", "arrivals-staff-password");

        mvc.perform(get(ARRIVALS).param("daysAhead", "8").with(staff))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].id").value(dayEight.getId().toString()));
        mvc.perform(get(ARRIVALS).param("daysAhead", "100000000000000000000").with(staff))
                .andExpect(status().isOk()).andExpect(jsonPath("$", hasSize(2)));
        for (String invalid : new String[]{"-1", "1.5", "tomorrow"}) {
            mvc.perform(get(ARRIVALS).param("daysAhead", invalid).with(staff))
                    .andExpect(status().isBadRequest());
        }
    }

    @Test
    void reportsPerCatCoverageThroughLocalDepartureAndUsesCurrentCareFields() throws Exception {
        Cat cora = cat("Cora");
        cora.setLastTripleFelineDate(LocalDate.parse("2025-11-15"));
        cora.setFoodBrand("  ");
        Cat milo = cat("Milo");
        milo.setLastRabiesDate(LocalDate.parse("2026-10-01"));
        milo.setLastTripleFelineDate(LocalDate.parse("2025-11-16"));
        milo.setFoodBrand("Example Food");
        milo.setLitterBrand("Example Litter");
        Cat rita = cat("Rita");
        rita.setLitterPreference(LitterPreference.SHARED);
        Cat tina = cat("Tina");
        tina.setLitterPreference(LitterPreference.OWN);
        stay("2026-11-14T10:00", "2026-11-15T23:45", null, milo, cora, rita, tina);

        mvc.perform(get(ARRIVALS).with(httpBasic("arrivals-staff", "arrivals-staff-password")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].endAt").value("2026-11-15T23:45:00"))
                .andExpect(jsonPath("$[0].cats", hasSize(4)))
                .andExpect(jsonPath("$[0].cats[0].id").value(cora.getId().toString()))
                .andExpect(jsonPath("$[0].cats[0].vaccineWarnings[0].vaccineType").value("RABIES"))
                .andExpect(jsonPath("$[0].cats[0].vaccineWarnings[0].reason").value("MISSING"))
                .andExpect(jsonPath("$[0].cats[0].vaccineWarnings[1].vaccineType").value("TRIPLE_FELINE"))
                .andExpect(jsonPath("$[0].cats[0].vaccineWarnings[1].reason").value("EXPIRES_DURING_STAY"))
                .andExpect(jsonPath("$[0].cats[0].vaccineWarnings[1].expiresOn").value("2026-11-15"))
                .andExpect(jsonPath("$[0].cats[0].foodBrand").doesNotExist())
                .andExpect(jsonPath("$[0].cats[0].litterBrand").doesNotExist())
                .andExpect(jsonPath("$[0].cats[0].litterChoice").doesNotExist())
                .andExpect(jsonPath("$[0].cats[1].id").value(milo.getId().toString()))
                .andExpect(jsonPath("$[0].cats[1].vaccineWarnings").isEmpty())
                .andExpect(jsonPath("$[0].cats[1].foodBrand").value("Example Food"))
                .andExpect(jsonPath("$[0].cats[1].litterBrand").value("Example Litter"))
                .andExpect(jsonPath("$[0].cats[1].litterChoice").value("OWN"))
                .andExpect(jsonPath("$[0].cats[2].litterChoice").value("SHARED"))
                .andExpect(jsonPath("$[0].cats[3].litterChoice").value("OWN"));
    }

    @Test
    void exposesOnlyPendingReviewsForTheBookedCatAndItsCurrentOwnerToAdmin() throws Exception {
        Cat milo = cat("Milo");
        Cat cora = cat("Cora");
        stay("2026-11-14T10:00", "2026-11-15T08:00", null, milo);
        CatIntakeReview pending = review(owner, milo.getId());
        review(owner("Former Owner"), milo.getId());
        review(owner, null);
        review(owner, cora.getId());
        review(owner, milo.getId()).approve(milo.getId(), NOW);

        mvc.perform(get(ARRIVALS)).andExpect(status().isUnauthorized());
        mvc.perform(get(ARRIVALS).with(httpBasic("test-admin", "test-password")))
                .andExpect(status().isOk())
                .andExpect(header().string("Cache-Control", containsString("no-store")))
                .andExpect(jsonPath("$[0].cats[0].pendingReviews", hasSize(1)))
                .andExpect(jsonPath("$[0].cats[0].pendingReviews[0].id").value(pending.getId().toString()))
                .andExpect(jsonPath("$[0].cats[0].pendingReviews[0].submittedAt").value(NOW.toString()))
                .andExpect(jsonPath("$[0].cats[0].pendingReviews[0].proposedFields").doesNotExist());

        String staffResponse = mvc.perform(get(ARRIVALS).with(httpBasic("arrivals-staff", "arrivals-staff-password"))
                        .param("includeReviews", "true"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].cats[0].vaccineWarnings", hasSize(2)))
                .andExpect(jsonPath("$[0].cats[0].pendingReviews").doesNotHaveJsonPath())
                .andReturn().getResponse().getContentAsString();
        assertThat(staffResponse).doesNotContain(pending.getId().toString(), "Private proposed brand");
    }

    @Test
    void onlyAdminCanIssueForTheDisplayedStayAndItsTutor() throws Exception {
        Cat cat = cat("Milo");
        cat.setLastRabiesDate(LocalDate.parse("2025-11-16"));
        Stay overdue = stay("2026-11-11T09:00", "2026-11-14T08:00", null, cat);
        Stay later = stay("2026-11-24T09:00", "2026-11-26T08:00", null, cat);
        Stay cancelled = stay("2026-11-11T09:00", "2026-11-14T08:00", BUSINESS_NOW, cat);
        Stay checkedIn = stay("2026-11-11T09:00", "2026-11-14T08:00", null, cat);
        checkedIn.setMovementStatus(StayStatus.CHECKED_IN);
        Owner other = owner("Another tutor");
        var adminCredentials = httpBasic("test-admin", "test-password");
        var staffCredentials = httpBasic("arrivals-staff", "arrivals-staff-password");

        mvc.perform(post(INVITATIONS).with(staffCredentials).contentType(MediaType.APPLICATION_JSON)
                .content(invitationFor(owner, overdue))).andExpect(status().isForbidden());
        mvc.perform(post(INVITATIONS).with(adminCredentials).contentType(MediaType.APPLICATION_JSON)
                .content(invitationFor(other, later))).andExpect(status().isNotFound());
        for (Stay resolved : new Stay[]{cancelled, checkedIn}) {
            mvc.perform(post(INVITATIONS).with(adminCredentials).contentType(MediaType.APPLICATION_JSON)
                    .content(invitationFor(owner, resolved))).andExpect(status().isNotFound());
        }
        mvc.perform(householdRequestFor(overdue)).andExpect(status().isOk())
                .andExpect(jsonPath("$.cats[0].requestedFields", not(hasItem("lastRabiesDate"))));
        mvc.perform(householdRequestFor(later)).andExpect(status().isOk())
                .andExpect(jsonPath("$.cats[0].requestedFields", hasItem("lastRabiesDate")));
    }

    private MockHttpServletRequestBuilder householdRequestFor(Stay stay) throws Exception {
        var response = mvc.perform(post(INVITATIONS).with(httpBasic("test-admin", "test-password"))
                        .contentType(MediaType.APPLICATION_JSON).content(invitationFor(owner, stay)))
                .andExpect(status().isCreated()).andReturn().getResponse();
        String link = JsonPath.read(response.getContentAsString(), "$.url");
        String token = URI.create(link).getFragment().substring("token=".length());
        return get("/api/intake/request").header(HttpHeaders.AUTHORIZATION, "Bearer " + token);
    }

    private String invitationFor(Owner tutor, Stay stay) {
        return """
                {"ownerId":"%s","stayId":"%s","allowNewCats":true}
                """.formatted(tutor.getId(), stay.getId());
    }

    private Owner owner(String name) {
        return owners.save(Owner.builder().fullName(name).primaryPhone("5550100").createdBy(admin).build());
    }

    private Cat cat(String name) {
        return cats.save(Cat.builder().owner(owner).createdBy(admin).name(name)
                .birthDate(LocalDate.of(2020, 1, 1)).sex(Sex.MALE).build());
    }

    private Stay stay(String start, String end, LocalDateTime cancelledAt, Cat... bookedCats) {
        Stay stay = Stay.builder().owner(owner).createdBy(admin)
                .startAt(LocalDateTime.parse(start)).endAt(LocalDateTime.parse(end))
                .cancelledAt(cancelledAt).build();
        for (Cat cat : bookedCats) {
            stay.getStayCats().add(StayCat.builder().stay(stay).cat(cat).build());
        }
        return stays.saveAndFlush(stay);
    }

    private CatIntakeReview review(Owner submitter, UUID catId) {
        String tokenHash = UUID.randomUUID().toString().replace("-", "").repeat(2);
        var invitation = new CatIntakeInvitation(submitter, tokenHash, true, "{}", NOW.plusSeconds(3600));
        invitation.close(NOW, "{}");
        return reviews.save(new CatIntakeReview(invitations.save(invitation), catId, "Milo", "{}",
                "{\"foodBrand\":\"Private proposed brand\"}", NOW));
    }
}
