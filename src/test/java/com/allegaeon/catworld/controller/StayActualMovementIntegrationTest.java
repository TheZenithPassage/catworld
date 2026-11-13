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
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(properties = "spring.datasource.url=jdbc:h2:mem:actual_movements;MODE=MySQL")
@ActiveProfiles("test")
@AutoConfigureMockMvc
@Import(OperationsAgendaIntegrationTest.FixedBusinessClock.class)
@Transactional
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
        stay = Stay.builder().startAt(LocalDateTime.parse("2030-06-01T22:00"))
                .endAt(LocalDateTime.parse("2030-06-03T10:00")).owner(owner).createdBy(admin).build();
        entityManager.persist(stay);
        entityManager.persist(StayCat.builder().stay(stay).cat(cat).build());
        entityManager.flush();
        entityManager.clear();
        movementsUrl = "/api/stays/" + stay.getId() + "/actual-movements";
    }

    @Test
    void recordsServerTimeAndDoesNotRescheduleAgendaOrOverwriteOnRetry() throws Exception {
        write("ARRIVAL", 0, null, "movement-staff", UserRole.STAFF)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.arrival.occurredAt").value("2030-06-02T02:00:00Z"))
                .andExpect(jsonPath("$.arrival.revision").value(1))
                .andExpect(jsonPath("$.arrival.recordedBy").value("movement-staff"))
                .andExpect(jsonPath("$.departure").doesNotExist());
        write("ARRIVAL", 0, "2030-06-02T01:20:00Z", "movement-staff", UserRole.STAFF)
                .andExpect(status().isConflict());

        mvc.perform(get("/api/operations/agenda").with(user("movement-staff").roles("STAFF")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.movements[0].scheduledAt").value("2030-06-01T22:00:00"))
                .andExpect(jsonPath("$.movements[0].actualAt").value("2030-06-02T02:00:00Z"))
                .andExpect(jsonPath("$.upcomingDays[1].movements[0].actualAt").doesNotHaveJsonPath())
                .andExpect(jsonPath("$.boardingStays[0].stayId").value(stay.getId().toString()));
        mvc.perform(get("/api/stays/{id}/detail", stay.getId()).with(user("movement-staff").roles("STAFF")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CHECKED_IN"))
                .andExpect(jsonPath("$.startAt").value("2030-06-01T22:00:00"))
                .andExpect(jsonPath("$.endAt").value("2030-06-03T10:00:00"));
    }

    @Test
    void authorAndAdminCanCorrectWithCurrentRevisionAndOriginalAttributionSurvives() throws Exception {
        mvc.perform(get(movementsUrl)).andExpect(status().isUnauthorized());
        mvc.perform(get(movementsUrl).with(user("unrelated-role").roles("OTHER")))
                .andExpect(status().isForbidden());
        write("ARRIVAL", 0, "2030-06-02T01:20:00Z", "movement-staff", UserRole.STAFF)
                .andExpect(status().isOk());
        write("ARRIVAL", 1, "2030-06-02T01:25:00Z", "another-staff", UserRole.STAFF)
                .andExpect(status().isForbidden());
        write("ARRIVAL", 1, "2030-06-02T01:25:00Z", "movement-staff", UserRole.STAFF)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.arrival.revision").value(2));
        write("ARRIVAL", 1, "2030-06-02T01:45:00Z", "movement-admin", UserRole.ADMIN)
                .andExpect(status().isConflict());
        write("ARRIVAL", 2, "2030-06-02T01:30:00Z", "movement-admin", UserRole.ADMIN)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.arrival.revision").value(3))
                .andExpect(jsonPath("$.arrival.recordedBy").value("movement-staff"))
                .andExpect(jsonPath("$.arrival.correctedBy").value("movement-admin"));
        mvc.perform(get(movementsUrl).with(user("another-staff").roles("STAFF")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.arrival.canEdit").value(false))
                .andExpect(jsonPath("$.arrival.occurredAt").value("2030-06-02T01:30:00Z"));
    }

    @Test
    void departureCanBeRecordedAloneOnCompletedStayAndMustBeAtOrAfterArrival() throws Exception {
        Stay completed = entityManager.find(Stay.class, stay.getId());
        completed.setEndAt(LocalDateTime.parse("2030-06-01T22:45"));
        entityManager.flush();
        entityManager.clear();

        write("DEPARTURE", 0, "2030-06-02T02:00:00.000001Z", "movement-staff", UserRole.STAFF)
                .andExpect(status().isBadRequest());
        write("DEPARTURE", 0, "2030-06-02T01:45:00Z", "movement-staff", UserRole.STAFF)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.arrival").doesNotExist());
        write("ARRIVAL", 0, "2030-06-02T01:50:00Z", "movement-admin", UserRole.ADMIN)
                .andExpect(status().isBadRequest());
        write("ARRIVAL", 0, "2030-06-02T01:45:00Z", "movement-admin", UserRole.ADMIN)
                .andExpect(status().isOk());
        write("DEPARTURE", 1, "2030-06-02T01:40:00Z", "movement-staff", UserRole.STAFF)
                .andExpect(status().isBadRequest());
        mvc.perform(get(movementsUrl).with(user("movement-staff").roles("STAFF")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.departure.occurredAt").value("2030-06-02T01:45:00Z"))
                .andExpect(jsonPath("$.departure.revision").value(1));
        mvc.perform(get("/api/stays/{id}/detail", stay.getId()).with(user("movement-staff").roles("STAFF")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CHECKED_OUT"));
    }

    @Test
    void cancellationFreezesBothDirectionsAndKeepsHistoricalReads() throws Exception {
        write("ARRIVAL", 0, null, "movement-admin", UserRole.ADMIN).andExpect(status().isOk());
        mvc.perform(patch("/api/stays/{id}/cancel", stay.getId()).with(user("movement-admin").roles("ADMIN")))
                .andExpect(status().isNoContent());
        write("ARRIVAL", 1, "2030-06-02T01:55:00Z", "movement-admin", UserRole.ADMIN)
                .andExpect(status().isConflict());
        write("DEPARTURE", 0, null, "movement-admin", UserRole.ADMIN).andExpect(status().isConflict());
        mvc.perform(get(movementsUrl).with(user("movement-admin").roles("ADMIN")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.cancelled").value(true))
                .andExpect(jsonPath("$.arrival.canEdit").value(false))
                .andExpect(jsonPath("$.arrival.revision").value(1))
                .andExpect(jsonPath("$.departure").doesNotExist());
    }

    @Test
    void accountDeletionDoesNotEraseAttributionOrGiveNewAccountEditingRights() throws Exception {
        write("ARRIVAL", 0, null, "movement-staff", UserRole.STAFF).andExpect(status().isOk());
        mvc.perform(delete("/api/users/{name}", findUser("movement-staff").getId())
                        .with(user("movement-admin").roles("ADMIN")))
                .andExpect(status().isNoContent());
        saveUser("movement-staff", UserRole.STAFF);
        entityManager.flush();
        entityManager.clear();

        mvc.perform(get(movementsUrl).with(user("movement-staff").roles("STAFF")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.arrival.recordedBy").value("movement-staff"))
                .andExpect(jsonPath("$.arrival.canEdit").value(false));
        write("ARRIVAL", 1, "2030-06-02T01:45:00Z", "movement-staff", UserRole.STAFF)
                .andExpect(status().isForbidden());
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

    private UserAccount saveUser(String username, UserRole role) {
        var user = UserAccount.builder().username(username).passwordHash("unused").role(role).build();
        entityManager.persist(user);
        return user;
    }

    private UserAccount findUser(String username) {
        return entityManager.createQuery("select u from UserAccount u where u.username = :username", UserAccount.class)
                .setParameter("username", username).getSingleResult();
    }
}
