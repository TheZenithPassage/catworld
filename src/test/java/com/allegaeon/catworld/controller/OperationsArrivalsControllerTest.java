package com.allegaeon.catworld.controller;

import com.allegaeon.catworld.model.Cat;
import com.allegaeon.catworld.model.CatIntakeInvitation;
import com.allegaeon.catworld.model.CatIntakeReview;
import com.allegaeon.catworld.model.Owner;
import com.allegaeon.catworld.model.Sex;
import com.allegaeon.catworld.model.Stay;
import com.allegaeon.catworld.model.StayCat;
import com.allegaeon.catworld.model.UserAccount;
import com.allegaeon.catworld.model.UserRole;
import com.allegaeon.catworld.repository.CatIntakeInvitationRepository;
import com.allegaeon.catworld.repository.CatIntakeReviewRepository;
import com.allegaeon.catworld.repository.CatRepository;
import com.allegaeon.catworld.repository.OwnerRepository;
import com.allegaeon.catworld.repository.StayRepository;
import com.allegaeon.catworld.repository.UserAccountRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.hasSize;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.httpBasic;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(properties = "spring.datasource.url=jdbc:h2:mem:catworld_arrivals;MODE=MySQL")
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class OperationsArrivalsControllerTest {
    private static final String ARRIVALS = "/api/operations/arrivals";
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

    private UserAccount admin;
    private Owner owner;

    @TestConfiguration
    static class FixedBusinessClock {
        @Bean
        @Primary
        Clock arrivalsTestClock() {
            return Clock.fixed(NOW, ZoneId.of("America/Argentina/Buenos_Aires"));
        }
    }

    @BeforeEach
    void setUp() {
        admin = users.findByUsername("test-admin").orElseThrow();
        owner = owner("Ana Example");
        users.save(UserAccount.builder().username("arrivals-staff")
                .passwordHash(passwordEncoder.encode("arrivals-staff-password"))
                .role(UserRole.STAFF).enabled(true).build());
    }

    @Test
    void listsOnlyReservationsAfterBusinessNowThroughTheLastMomentOfDaySeven() throws Exception {
        Cat cat = cat("Milo");
        Stay last = stay("2026-11-19T23:59:59.999999", "2026-11-21T08:00", null, cat);
        stay("2026-11-20T00:00", "2026-11-21T08:00", null, cat);
        stay("2026-11-12T21:59", "2026-11-15T08:00", null, cat);
        stay("2026-11-12T22:00", "2026-11-15T08:00", null, cat);
        stay("2026-11-14T10:00", "2026-11-15T08:00", BUSINESS_NOW, cat);
        Stay first = stay("2026-11-12T22:15", "2026-11-13T08:00", null, cat);

        mvc.perform(get(ARRIVALS).with(httpBasic("arrivals-staff", "arrivals-staff-password")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[0].id").value(first.getId().toString()))
                .andExpect(jsonPath("$[0].owner.id").value(owner.getId().toString()))
                .andExpect(jsonPath("$[0].owner.fullName").value("Ana Example"))
                .andExpect(jsonPath("$[0].owner.primaryPhone").doesNotExist())
                .andExpect(jsonPath("$[0].startAt").value("2026-11-12T22:15:00"))
                .andExpect(jsonPath("$[1].id").value(last.getId().toString()));
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
        stay("2026-11-14T10:00", "2026-11-15T23:45", null, milo, cora);

        mvc.perform(get(ARRIVALS).with(httpBasic("arrivals-staff", "arrivals-staff-password")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].endAt").value("2026-11-15T23:45:00"))
                .andExpect(jsonPath("$[0].cats", hasSize(2)))
                .andExpect(jsonPath("$[0].cats[0].id").value(cora.getId().toString()))
                .andExpect(jsonPath("$[0].cats[0].vaccineWarnings[0].vaccineType").value("RABIES"))
                .andExpect(jsonPath("$[0].cats[0].vaccineWarnings[0].reason").value("MISSING"))
                .andExpect(jsonPath("$[0].cats[0].vaccineWarnings[1].vaccineType").value("TRIPLE_FELINE"))
                .andExpect(jsonPath("$[0].cats[0].vaccineWarnings[1].reason").value("EXPIRED"))
                .andExpect(jsonPath("$[0].cats[0].foodBrand").doesNotExist())
                .andExpect(jsonPath("$[0].cats[0].litterBrand").doesNotExist())
                .andExpect(jsonPath("$[0].cats[1].id").value(milo.getId().toString()))
                .andExpect(jsonPath("$[0].cats[1].vaccineWarnings").isEmpty())
                .andExpect(jsonPath("$[0].cats[1].foodBrand").value("Example Food"))
                .andExpect(jsonPath("$[0].cats[1].litterBrand").value("Example Litter"));
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
        invitation.consume(NOW);
        return reviews.save(new CatIntakeReview(invitations.save(invitation), catId, "Milo", "{}",
                "{\"foodBrand\":\"Private proposed brand\"}", NOW));
    }
}
