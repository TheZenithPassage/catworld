package com.allegaeon.catworld.controller;

import com.allegaeon.catworld.model.Cat;
import com.allegaeon.catworld.model.Owner;
import com.allegaeon.catworld.model.Sex;
import com.allegaeon.catworld.model.Stay;
import com.allegaeon.catworld.model.StayCat;
import com.allegaeon.catworld.model.StayStatus;
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
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(properties = "spring.datasource.url=jdbc:h2:mem:confirmed_movements;MODE=MySQL")
@ActiveProfiles("test")
@AutoConfigureMockMvc
@Import(StayActualMovementIntegrationTest.FixedBusinessClock.class)
@Transactional(isolation = Isolation.READ_COMMITTED)
class StayActualMovementIntegrationTest {

    @Autowired MockMvc mvc;
    @Autowired EntityManager entityManager;

    private Stay stay;
    private String movementsUrl;

    @BeforeEach
    void saveFixtures() {
        var admin = saveUser("movement-admin", UserRole.ADMIN);
        saveUser("movement-staff", UserRole.STAFF);
        saveUser("another-staff", UserRole.STAFF);
        var owner = Owner.builder().fullName("Movement Owner").primaryPhone("5550100").createdBy(admin).build();
        entityManager.persist(owner);
        var cat = Cat.builder().name("Menta").birthDate(LocalDate.of(2024, 1, 1))
                .sex(Sex.FEMALE).owner(owner).createdBy(admin).build();
        entityManager.persist(cat);
        stay = Stay.builder().startAt(LocalDateTime.parse("2030-06-01T20:00"))
                .endAt(LocalDateTime.parse("2030-06-01T22:45")).owner(owner).createdBy(admin).build();
        entityManager.persist(stay);
        entityManager.persist(StayCat.builder().stay(stay).cat(cat).build());
        entityManager.flush();
        entityManager.clear();
        movementsUrl = "/api/stays/" + stay.getId() + "/actual-movements";
    }

    @Test
    void confirmationDrivesStateEvenAfterScheduledCheckoutAndIsFinal() throws Exception {
        detail("RESERVED", true, true);
        write("DEPARTURE", 0, null, "movement-staff", UserRole.STAFF)
                .andExpect(status().isConflict());
        write("ARRIVAL", 0, "2030-06-02T02:00:00.000001Z", "movement-staff", UserRole.STAFF)
                .andExpect(status().isBadRequest());
        write("ARRIVAL", 0, "2030-06-01T02:00:00Z", "movement-staff", UserRole.STAFF)
                .andExpect(status().isBadRequest());
        write("ARRIVAL", 0, null, "movement-staff", UserRole.STAFF)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CHECKED_IN"))
                .andExpect(jsonPath("$.arrival.occurredAt").value("2030-06-02T02:00:00Z"))
                .andExpect(jsonPath("$.arrival.recordedBy").value("movement-staff"));
        detail("CHECKED_IN", true, false);
        mvc.perform(patch("/api/stays/{id}/cancel", stay.getId()).with(user("movement-admin").roles("ADMIN")))
                .andExpect(status().isConflict());
        write("ARRIVAL", 0, "2030-06-02T01:30:00Z", "movement-staff", UserRole.STAFF)
                .andExpect(status().isConflict());
        write("DEPARTURE", 1, "2030-06-02T01:59:59Z", "movement-staff", UserRole.STAFF)
                .andExpect(status().isBadRequest());
        write("DEPARTURE", 1, null, "movement-staff", UserRole.STAFF)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CHECKED_OUT"))
                .andExpect(jsonPath("$.arrival.canEdit").value(false))
                .andExpect(jsonPath("$.departure.canEdit").value(false));
        detail("CHECKED_OUT", false, false);
        write("ARRIVAL", 2, null, "movement-admin", UserRole.ADMIN)
                .andExpect(status().isConflict());
        write("DEPARTURE", 2, null, "movement-admin", UserRole.ADMIN)
                .andExpect(status().isConflict());
        reset(2, "movement-admin", UserRole.ADMIN).andExpect(status().isConflict());
    }

    @Test
    void preservesOriginalAuthorDuringCorrectionAndArchivesOnAdminReset() throws Exception {
        write("ARRIVAL", 0, "2030-06-02T01:20:00Z", "movement-staff", UserRole.STAFF)
                .andExpect(status().isOk());
        write("ARRIVAL", 1, "2030-06-02T01:25:00Z", "another-staff", UserRole.STAFF)
                .andExpect(status().isForbidden());
        reset(1, "movement-staff", UserRole.STAFF).andExpect(status().isForbidden());
        write("ARRIVAL", 1, "2030-06-02T01:30:00Z", "movement-admin", UserRole.ADMIN)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.arrival.revision").value(2))
                .andExpect(jsonPath("$.arrival.recordedBy").value("movement-staff"))
                .andExpect(jsonPath("$.arrival.correctedBy").value("movement-admin"));
        reset(1, "movement-admin", UserRole.ADMIN).andExpect(status().isConflict());
        reset(2, "movement-admin", UserRole.ADMIN)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.revision").value(3))
                .andExpect(jsonPath("$.status").value("RESERVED"))
                .andExpect(jsonPath("$.arrival").doesNotExist());
        write("ARRIVAL", 0, null, "movement-staff", UserRole.STAFF).andExpect(status().isConflict());
        write("ARRIVAL", 3, null, "another-staff", UserRole.STAFF)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.arrival.recordedBy").value("another-staff"));
    }

    @Test
    void acceptsAnExplicitForgottenDepartureOnItsScheduledDayWithoutInventingLegacyArrival() throws Exception {
        Stay currentStay = entityManager.find(Stay.class, stay.getId());
        currentStay.setStartAt(LocalDateTime.parse("2030-05-30T09:00"));
        currentStay.setEndAt(LocalDateTime.parse("2030-05-31T09:00"));
        currentStay.setMovementStatus(StayStatus.CHECKED_IN);
        entityManager.flush();
        entityManager.clear();

        write("DEPARTURE", 0, null, "movement-staff", UserRole.STAFF)
                .andExpect(status().isBadRequest());
        write("DEPARTURE", 0, "2030-05-31T15:00:00Z", "movement-staff", UserRole.STAFF)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CHECKED_OUT"))
                .andExpect(jsonPath("$.arrival").doesNotExist())
                .andExpect(jsonPath("$.departure.occurredAt").value("2030-05-31T15:00:00Z"));
    }

    private void detail(String expectedState, boolean canEdit, boolean canCancel) throws Exception {
        mvc.perform(get("/api/stays/{id}/detail", stay.getId()).with(user("movement-staff").roles("STAFF")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value(expectedState))
                .andExpect(jsonPath("$.canEdit").value(canEdit))
                .andExpect(jsonPath("$.canCancel").value(canCancel))
                .andExpect(jsonPath("$.actualMovements.status").value(expectedState))
                .andExpect(jsonPath("$.startAt").value("2030-06-01T20:00:00"))
                .andExpect(jsonPath("$.endAt").value("2030-06-01T22:45:00"));
    }

    private ResultActions write(String type, int revision, String time, String username, UserRole role)
            throws Exception {
        String occurredAt = time == null ? "null" : "\"" + time + "\"";
        return mvc.perform(put(movementsUrl + "/" + type).with(user(username).roles(role.name()))
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                        {"expectedRevision":%s,"occurredAt":%s}
                        """.formatted(revision, occurredAt)));
    }

    private ResultActions reset(int revision, String username, UserRole role) throws Exception {
        return mvc.perform(post(movementsUrl + "/ARRIVAL/reset").with(user(username).roles(role.name()))
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                        {"expectedRevision":%s}
                        """.formatted(revision)));
    }

    private UserAccount saveUser(String username, UserRole role) {
        var user = UserAccount.builder().username(username).passwordHash("unused").role(role).build();
        entityManager.persist(user);
        return user;
    }

    @TestConfiguration
    static class FixedBusinessClock {
        @Bean
        @Primary
        Clock stayMovementTestClock() {
            return Clock.fixed(Instant.parse("2030-06-02T02:00:00Z"), ZoneId.of("America/Argentina/Buenos_Aires"));
        }
    }
}
