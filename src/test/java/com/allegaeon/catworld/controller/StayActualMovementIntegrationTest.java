package com.allegaeon.catworld.controller;

import com.allegaeon.catworld.model.Cat;
import com.allegaeon.catworld.model.NightlyReferenceRate;
import com.allegaeon.catworld.model.NightlyReferenceRateKey;
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
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.databind.ObjectMapper;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
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
    @Autowired JdbcTemplate jdbc;
    @Autowired ObjectMapper json;
    @Autowired MutableBusinessClock clock;

    private Stay stay;
    private UUID catId;
    private String movementsUrl;

    @BeforeEach
    void saveFixtures() {
        clock.current = Instant.parse("2030-06-02T02:00:00Z");
        entityManager.persist(NightlyReferenceRate.builder()
                .key(NightlyReferenceRateKey.ONE_CAT).nightlyRate(BigDecimal.valueOf(100)).build());
        var admin = saveUser("movement-admin", UserRole.ADMIN);
        saveUser("movement-staff", UserRole.STAFF);
        saveUser("another-staff", UserRole.STAFF);
        var owner = Owner.builder().fullName("Movement Owner").primaryPhone("5550100").createdBy(admin).build();
        entityManager.persist(owner);
        var cat = Cat.builder().name("Menta").birthDate(LocalDate.of(2024, 1, 1))
                .sex(Sex.FEMALE).owner(owner).createdBy(admin)
                .lastRabiesDate(LocalDate.of(2030, 1, 1)).lastTripleFelineDate(LocalDate.of(2030, 1, 1)).build();
        entityManager.persist(cat);
        catId = cat.getId();
        stay = Stay.builder().startAt(LocalDateTime.parse("2030-06-01T20:00"))
                .endAt(LocalDateTime.parse("2030-06-01T22:45")).owner(owner).createdBy(admin).pricePending(true).build();
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
    void recordsOverdueArrivalWithinTheBookingAndAllowsItsCorrection() throws Exception {
        var currentStay = entityManager.find(Stay.class, stay.getId());
        currentStay.setEndAt(LocalDateTime.parse("2030-06-02T09:00"));
        entityManager.flush();
        entityManager.clear();
        clock.current = Instant.parse("2030-06-03T14:00:00Z");

        mvc.perform(get(movementsUrl).with(user("movement-staff").roles("STAFF")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.serverNow").value("2030-06-03T14:00:00Z"))
                .andExpect(jsonPath("$.status").value("RESERVED"))
                .andExpect(jsonPath("$.canRecordArrival").value(true))
                .andExpect(jsonPath("$.arrivalAllowsNow").value(false))
                .andExpect(jsonPath("$.canRecordDeparture").value(false));
        write("DEPARTURE", 0, "2030-06-02T12:00:00Z", "movement-staff", UserRole.STAFF)
                .andExpect(status().isConflict());
        write("ARRIVAL", 0, null, "movement-staff", UserRole.STAFF).andExpect(status().isBadRequest());
        write("ARRIVAL", 0, "2030-06-02T12:00:00.000000001Z", "movement-staff", UserRole.STAFF)
                .andExpect(status().isBadRequest());
        write("ARRIVAL", 0, "2030-06-02T11:00:00Z", "movement-staff", UserRole.STAFF)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.arrival.occurredAt").value("2030-06-02T11:00:00Z"))
                .andExpect(jsonPath("$.startAt").value("2030-06-01T20:00:00"))
                .andExpect(jsonPath("$.endAt").value("2030-06-02T09:00:00"))
                .andExpect(jsonPath("$.arrivalResetUntil").value("2030-06-03T14:15:00Z"));
        write("ARRIVAL", 1, "2030-06-02T12:00:00Z", "movement-staff", UserRole.STAFF)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.arrival.occurredAt").value("2030-06-02T12:00:00Z"))
                .andExpect(jsonPath("$.arrivalResetUntil").value("2030-06-03T14:15:00Z"));
    }

    @Test
    void acceptsTheOriginalDayAfterBothDatesPassAndRejectsOtherOutOfRangeDays() throws Exception {
        clock.current = Instant.parse("2030-06-03T14:00:00Z");
        write("ARRIVAL", 0, "2030-06-01T02:59:59Z", "movement-staff", UserRole.STAFF)
                .andExpect(status().isBadRequest());
        write("ARRIVAL", 0, "2030-06-02T03:00:00Z", "movement-staff", UserRole.STAFF)
                .andExpect(status().isBadRequest());
        write("ARRIVAL", 0, "2030-06-02T02:50:00Z", "movement-staff", UserRole.STAFF)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.arrival.occurredAt").value("2030-06-02T02:50:00Z"));
    }

    @Test
    void rejectsFutureArrivalAndServerTimeOnADifferentDayWithinTheBooking() throws Exception {
        var currentStay = entityManager.find(Stay.class, stay.getId());
        currentStay.setEndAt(LocalDateTime.parse("2030-06-05T09:00"));
        entityManager.flush();
        entityManager.clear();
        clock.current = Instant.parse("2030-06-03T14:00:00Z");

        write("ARRIVAL", 0, "2030-06-03T14:00:01Z", "movement-staff", UserRole.STAFF)
                .andExpect(status().isBadRequest());
        write("ARRIVAL", 0, null, "movement-staff", UserRole.STAFF).andExpect(status().isBadRequest());
        write("ARRIVAL", 0, "2030-06-03T14:00:00Z", "movement-staff", UserRole.STAFF)
                .andExpect(status().isOk());
    }

    @Test
    void preservesOriginalAuthorDuringCorrectionAndArchivesOnAdminReset() throws Exception {
        write("ARRIVAL", 0, "2030-06-02T01:20:00Z", "movement-staff", UserRole.STAFF)
                .andExpect(status().isOk());
        write("ARRIVAL", 1, "2030-06-02T01:25:00Z", "another-staff", UserRole.STAFF)
                .andExpect(status().isForbidden());
        reset(1, "another-staff", UserRole.STAFF).andExpect(status().isForbidden());
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
        assertEquals("movement-staff:movement-admin:movement-admin:1", jdbc.queryForObject("""
                select concat(recorded_by, ':', corrected_by, ':', reset_by, ':', version)
                from stay_arrival_resets
                """, String.class));
        write("ARRIVAL", 0, null, "movement-staff", UserRole.STAFF).andExpect(status().isConflict());
        write("ARRIVAL", 3, null, "another-staff", UserRole.STAFF)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.arrival.recordedBy").value("another-staff"));
    }

    @Test
    void rejectingUndoThatWouldRestoreAnOverlapPreservesTheArrivalAndAudit() throws Exception {
        write("ARRIVAL", 0, "2030-06-02T01:00:00Z", "movement-staff", UserRole.STAFF)
                .andExpect(status().isOk());
        bookPendingStay("2030-06-01T21:00", "2030-06-01T22:00");

        reset(1, "movement-staff", UserRole.STAFF)
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("STAY_DATES_OVERLAP"))
                .andExpect(jsonPath("$.catName").value("Menta"));
        mvc.perform(get(movementsUrl).with(user("movement-staff").roles("STAFF")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CHECKED_IN"))
                .andExpect(jsonPath("$.revision").value(1))
                .andExpect(jsonPath("$.arrival.occurredAt").value("2030-06-02T01:00:00Z"));
        assertEquals(0, jdbc.queryForObject("select count(*) from stay_arrival_resets", Integer.class));
    }

    @Test
    void editingUsesTheActualArrivalAndRejectsAnOverlapWithTheProposedDeparture() throws Exception {
        write("ARRIVAL", 0, "2030-06-02T01:00:00Z", "movement-staff", UserRole.STAFF)
                .andExpect(status().isOk());
        bookPendingStay("2030-06-01T21:00", "2030-06-01T22:00");
        bookPendingStay("2030-06-01T23:15", "2030-06-01T23:45");

        edit("2030-06-01T20:00", "2030-06-01T23:15")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.endAt").value("2030-06-01T23:15:00"));
        edit("2030-06-01T20:00", "2030-06-01T23:30")
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("STAY_DATES_OVERLAP"))
                .andExpect(jsonPath("$.catName").value("Menta"));
    }

    @Test
    void aStayEndingAtItsActualArrivalDoesNotBlockAnotherBooking() throws Exception {
        write("ARRIVAL", 0, "2030-06-02T01:00:00Z", "movement-staff", UserRole.STAFF)
                .andExpect(status().isOk());
        edit("2030-06-01T20:00", "2030-06-01T22:00").andExpect(status().isOk());
        entityManager.flush();
        entityManager.clear();

        bookPendingStay("2030-06-01T21:00", "2030-06-01T23:00");
    }

    @Test
    void letsStaffSaveNotesWithoutChangingTheScheduleAfterALateSameDayArrival() throws Exception {
        write("ARRIVAL", 0, null, "movement-staff", UserRole.STAFF).andExpect(status().isOk());
        String dates = """
                {"startAt":"2030-06-01T20:00","endAt":"2030-06-01T22:45"}
                """;
        var staff = user("movement-staff").roles("STAFF");
        mvc.perform(post("/api/stays/{id}/pricing-preview", stay.getId()).with(staff)
                        .contentType(MediaType.APPLICATION_JSON).content(dates))
                .andExpect(status().isOk());
        var update = json.createObjectNode().put("startAt", "2030-06-01T20:00")
                .put("endAt", "2030-06-01T22:45").put("notes", "Arrived late")
                .put("overrideVaccineConflicts", false);
        mvc.perform(put("/api/stays/{id}", stay.getId()).with(staff)
                        .contentType(MediaType.APPLICATION_JSON).content(update.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.notes").value("Arrived late"));
    }

    @Test
    void rejectsAProposedDepartureBeforeTheActualArrivalInPreviewAndSave() throws Exception {
        write("ARRIVAL", 0, "2030-06-02T01:00:00Z", "movement-staff", UserRole.STAFF)
                .andExpect(status().isOk());
        mvc.perform(post("/api/stays/{id}/pricing-preview", stay.getId())
                        .with(user("movement-admin").roles("ADMIN"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"startAt":"2030-06-01T20:00","endAt":"2030-06-01T21:30"}
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("STAY_END_BEFORE_ACTUAL_ARRIVAL"));
        edit("2030-06-01T20:00", "2030-06-01T21:30")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("STAY_END_BEFORE_ACTUAL_ARRIVAL"));
        detail("CHECKED_IN", true, false);
    }

    @Test
    void staffCanUndoTheirOwnArrivalWithTheCurrentRevision() throws Exception {
        write("ARRIVAL", 0, null, "movement-staff", UserRole.STAFF)
                .andExpect(status().isOk()).andExpect(jsonPath("$.canResetArrival").value(true));
        mvc.perform(get(movementsUrl).with(user("another-staff").roles("STAFF")))
                .andExpect(status().isOk()).andExpect(jsonPath("$.canResetArrival").value(false));
        reset(1, "movement-staff", UserRole.STAFF)
                .andExpect(status().isOk()).andExpect(jsonPath("$.status").value("RESERVED"))
                .andExpect(jsonPath("$.revision").value(2));
        detail("RESERVED", true, true);
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

    @Test
    void datesAreEditableAfterThePlannedEndAndInvalidateAnOlderConfirmation() throws Exception {
        edit("2030-06-01T20:00", "2030-06-01T22:30")
                .andExpect(status().isOk()).andExpect(jsonPath("$.status").value("RESERVED"));
        write("ARRIVAL", 0, null, "movement-staff", UserRole.STAFF).andExpect(status().isConflict());
        write("ARRIVAL", 1, null, "movement-staff", UserRole.STAFF).andExpect(status().isOk());
        edit("2030-05-31T20:00", "2030-06-01T23:30").andExpect(status().isConflict());
        edit("2030-06-01T20:00", "2030-06-01T23:30")
                .andExpect(status().isOk()).andExpect(jsonPath("$.status").value("CHECKED_IN"));
        write("DEPARTURE", 2, null, "movement-staff", UserRole.STAFF).andExpect(status().isConflict());
        write("DEPARTURE", 3, null, "movement-staff", UserRole.STAFF).andExpect(status().isOk());
    }

    @Test
    void extendsAnOverdueCheckedInStayByOneDayBeforeConfirmingCheckout() throws Exception {
        detail("RESERVED", true, true);
        write("ARRIVAL", 0, null, "movement-staff", UserRole.STAFF)
                .andExpect(status().isOk()).andExpect(jsonPath("$.status").value("CHECKED_IN"));
        clock.current = Instant.parse("2030-06-02T14:00:00Z");
        detail("CHECKED_IN", true, false);
        write("DEPARTURE", 1, null, "movement-staff", UserRole.STAFF).andExpect(status().isBadRequest());

        var dates = json.createObjectNode().put("startAt", "2030-06-01T20:00").put("endAt", "2030-06-02T11:30");
        var preview = mvc.perform(post("/api/stays/{id}/pricing-preview", stay.getId())
                        .with(user("movement-admin").roles("ADMIN"))
                        .contentType(MediaType.APPLICATION_JSON).content(dates.toString()))
                .andExpect(status().isOk()).andExpect(jsonPath("$.numberOfNights").value(1))
                .andReturn().getResponse().getContentAsString();
        dates.set("confirmation", json.readTree(preview).get("confirmation"));
        dates.put("overrideVaccineConflicts", false);
        mvc.perform(put("/api/stays/{id}", stay.getId()).with(user("movement-admin").roles("ADMIN"))
                        .contentType(MediaType.APPLICATION_JSON).content(dates.toString()))
                .andExpect(status().isOk()).andExpect(jsonPath("$.status").value("CHECKED_IN"));
        write("DEPARTURE", 2, null, "movement-staff", UserRole.STAFF)
                .andExpect(status().isOk()).andExpect(jsonPath("$.status").value("CHECKED_OUT"))
                .andExpect(jsonPath("$.endAt").value("2030-06-02T11:30:00"))
                .andExpect(jsonPath("$.departure.occurredAt").value("2030-06-02T14:00:00Z"));
    }

    @Test
    void correctionKeepsTheStaffUndoDeadlineFromRegistration() throws Exception {
        write("ARRIVAL", 0, "2030-06-02T00:30:00Z", "movement-staff", UserRole.STAFF)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.arrivalResetUntil").value("2030-06-02T02:15:00Z"));
        clock.current = Instant.parse("2030-06-02T02:14:59Z");
        write("ARRIVAL", 1, "2030-06-02T00:35:00Z", "movement-staff", UserRole.STAFF)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.arrivalResetUntil").value("2030-06-02T02:15:00Z"));
        clock.current = Instant.parse("2030-06-02T02:15:00Z");
        reset(2, "movement-staff", UserRole.STAFF).andExpect(status().isForbidden());
        reset(2, "movement-admin", UserRole.ADMIN).andExpect(status().isOk());
    }

    @Test
    void earlyDepartureFreesTheCatWithoutChangingTheOriginalAgreementOrDeposit() throws Exception {
        var original = entityManager.find(Stay.class, stay.getId());
        original.setEndAt(LocalDateTime.parse("2030-06-05T10:00"));
        original.setPricePending(false);
        original.setAgreedAmount(BigDecimal.valueOf(500));
        entityManager.flush();
        mvc.perform(post("/api/stays/{id}/payments", stay.getId()).with(user("movement-admin").roles("ADMIN"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"amount":100,"paymentDate":"2030-06-01","note":"Deposit"}
                                """))
                .andExpect(status().isCreated());
        write("ARRIVAL", 0, null, "movement-staff", UserRole.STAFF).andExpect(status().isOk());

        var booking = json.createObjectNode().put("startAt", "2030-06-02T12:00").put("endAt", "2030-06-04T10:00");
        booking.putArray("catIds").add(catId.toString());
        var preview = mvc.perform(post("/api/stays/pricing-preview").with(user("movement-admin").roles("ADMIN"))
                        .contentType(MediaType.APPLICATION_JSON).content(booking.toString()))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        booking.set("confirmation", json.readTree(preview).get("confirmation"));
        booking.putObject("pricingDecision").put("pricePending", true);
        booking.put("overrideVaccineConflicts", false);
        mvc.perform(post("/api/stays").with(user("movement-admin").roles("ADMIN"))
                        .contentType(MediaType.APPLICATION_JSON).content(booking.toString()))
                .andExpect(status().isConflict()).andExpect(jsonPath("$.code").value("STAY_DATES_OVERLAP"));

        write("DEPARTURE", 1, null, "movement-staff", UserRole.STAFF)
                .andExpect(status().isOk()).andExpect(jsonPath("$.endAt").value("2030-06-05T10:00:00"));
        mvc.perform(post("/api/stays").with(user("movement-admin").roles("ADMIN"))
                        .contentType(MediaType.APPLICATION_JSON).content(booking.toString()))
                .andExpect(status().isCreated());
        mvc.perform(get("/api/stays/{id}", stay.getId()).with(user("movement-admin").roles("ADMIN")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.endAt").value("2030-06-05T10:00:00"))
                .andExpect(jsonPath("$.agreedAmount").value("500"))
                .andExpect(jsonPath("$.payments[0].amount").value("100"));
    }

    @Test
    void createsAWhollyPastStayAsHistoricalWithoutSyntheticMovements() throws Exception {
        var booking = json.createObjectNode().put("startAt", "2030-05-28T10:00").put("endAt", "2030-05-30T10:00");
        booking.putArray("catIds").add(catId.toString());
        var preview = mvc.perform(post("/api/stays/pricing-preview").with(user("movement-admin").roles("ADMIN"))
                        .contentType(MediaType.APPLICATION_JSON).content(booking.toString()))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        booking.set("confirmation", json.readTree(preview).get("confirmation"));
        booking.putObject("pricingDecision").put("pricePending", true);
        booking.put("overrideVaccineConflicts", false);
        var created = mvc.perform(post("/api/stays").with(user("movement-admin").roles("ADMIN"))
                        .contentType(MediaType.APPLICATION_JSON).content(booking.toString()))
                .andExpect(status().isCreated()).andExpect(jsonPath("$.status").value("CHECKED_OUT"))
                .andReturn().getResponse().getContentAsString();
        mvc.perform(get("/api/stays/{id}/detail", json.readTree(created).get("stayId").asString())
                        .with(user("movement-admin").roles("ADMIN")))
                .andExpect(status().isOk()).andExpect(jsonPath("$.status").value("CHECKED_OUT"))
                .andExpect(jsonPath("$.actualMovements.arrival").doesNotExist())
                .andExpect(jsonPath("$.actualMovements.departure").doesNotExist());
    }

    private void bookPendingStay(String startAt, String endAt) throws Exception {
        var booking = json.createObjectNode().put("startAt", startAt).put("endAt", endAt);
        booking.putArray("catIds").add(catId.toString());
        var admin = user("movement-admin").roles("ADMIN");
        var preview = mvc.perform(post("/api/stays/pricing-preview").with(admin)
                        .contentType(MediaType.APPLICATION_JSON).content(booking.toString()))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        booking.set("confirmation", json.readTree(preview).get("confirmation"));
        booking.putObject("pricingDecision").put("pricePending", true);
        booking.put("overrideVaccineConflicts", false);
        mvc.perform(post("/api/stays").with(admin)
                        .contentType(MediaType.APPLICATION_JSON).content(booking.toString()))
                .andExpect(status().isCreated());
        entityManager.flush();
        entityManager.clear();
    }

    private ResultActions edit(String startAt, String endAt) throws Exception {
        return mvc.perform(put("/api/stays/{id}", stay.getId()).with(user("movement-admin").roles("ADMIN"))
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                        {"startAt":"%s","endAt":"%s","overrideVaccineConflicts":false}
                        """.formatted(startAt, endAt)));
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
        MutableBusinessClock stayMovementTestClock() {
            return new MutableBusinessClock();
        }
    }

    static class MutableBusinessClock extends Clock {
        private Instant current = Instant.parse("2030-06-02T02:00:00Z");

        @Override
        public ZoneId getZone() {
            return ZoneId.of("America/Argentina/Buenos_Aires");
        }

        @Override
        public Clock withZone(ZoneId zone) {
            return Clock.fixed(current, zone);
        }

        @Override
        public Instant instant() {
            return current;
        }
    }
}
