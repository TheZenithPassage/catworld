package com.allegaeon.catworld.controller;

import com.allegaeon.catworld.model.Cat;
import com.allegaeon.catworld.model.Owner;
import com.allegaeon.catworld.model.Sex;
import com.allegaeon.catworld.model.Stay;
import com.allegaeon.catworld.model.StayCat;
import com.allegaeon.catworld.model.StayPayment;
import com.allegaeon.catworld.model.UserAccount;
import com.allegaeon.catworld.model.UserRole;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.UUID;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class MonthlyPaymentsControllerTest {

    @Autowired MockMvc mvc;
    @Autowired EntityManager entities;
    @Autowired Clock clock;

    @Test
    void activePaymentsUseTheirActualMonthAndTotalIncludesOtherPages() throws Exception {
        LocalDate paidOn = LocalDate.of(2026, 10, 31);
        UserAccount actor = UserAccount.builder().username("monthly-test").passwordHash("unused")
                .role(UserRole.ADMIN).enabled(true).build();
        entities.persist(actor);
        Owner owner = Owner.builder().fullName("Example Owner").primaryPhone("555-0100").createdBy(actor).build();
        entities.persist(owner);
        Stay stay = Stay.builder().owner(owner).createdBy(actor).agreedAmount(new BigDecimal("500"))
                .startAt(paidOn.plusMonths(2).atTime(10, 0)).endAt(paidOn.plusMonths(2).plusDays(2).atTime(10, 0))
                .cancelledAt(paidOn.plusMonths(1).atStartOfDay()).build();
        entities.persist(stay);
        for (String name : new String[]{"Mora", "Luna"}) {
            Cat cat = Cat.builder().name(name).birthDate(paidOn.minusYears(4)).sex(Sex.FEMALE)
                    .owner(owner).createdBy(actor).build();
            entities.persist(cat);
            entities.persist(StayCat.builder().stay(stay).cat(cat).build());
        }
        for (int i = 0; i < 10; i++) {
            payment(stay, actor, paidOn.minusDays(1), "10", false);
        }
        payment(stay, actor, paidOn, "30", false);
        payment(stay, actor, paidOn, "15", true);
        payment(stay, actor, paidOn.plusDays(1), "20", false);
        entities.flush();

        mvc.perform(get("/api/payments/received").param("month", "2026-10")
                        .with(user("admin").roles("ADMIN")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalAmount").value("130"))
                .andExpect(jsonPath("$.payments.totalElements").value(11))
                .andExpect(jsonPath("$.payments.items[0].paymentDate").value("2026-10-31"))
                .andExpect(jsonPath("$.payments.items[0].amount").value("30"))
                .andExpect(jsonPath("$.payments.items[0].note").value("Deposit"))
                .andExpect(jsonPath("$.payments.items[0].ownerName").value("Example Owner"))
                .andExpect(jsonPath("$.payments.items[0].cats[0]").value("Luna"))
                .andExpect(jsonPath("$.payments.items[0].cats[1]").value("Mora"))
                .andExpect(jsonPath("$.payments.items[0].stayId").value(stay.getId().toString()));

        mvc.perform(get("/api/payments/received").param("month", "2026-10").param("page", "1")
                        .with(user("admin").roles("ADMIN")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalAmount").value("130"))
                .andExpect(jsonPath("$.payments.items.length()").value(1));

        mvc.perform(get("/api/payments/received").param("month", "2026-10").param("page", "2")
                        .with(user("admin").roles("ADMIN")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.payments.page").value(1))
                .andExpect(jsonPath("$.payments.items.length()").value(1));
    }

    @Test
    void monthlyOverviewIsRestrictedToAdministratorsAndRejectsInvalidMonths() throws Exception {
        mvc.perform(get("/api/payments/received").param("month", "2026-10")
                        .with(user("staff").roles("STAFF")))
                .andExpect(status().isForbidden());
        mvc.perform(get("/api/payments/received").param("month", "2026-10"))
                .andExpect(status().isUnauthorized());
        mvc.perform(get("/api/payments/received").param("month", "2026-13")
                        .with(user("admin").roles("ADMIN")))
                .andExpect(status().isBadRequest());
    }


    @Test
    void collectionsUseArrivalMonthAndDistinguishPendingPriceFromKnownBalances() throws Exception {
        LocalDate november = LocalDate.of(2026, 11, 1);
        UserAccount actor = UserAccount.builder().username("collection-test").passwordHash("unused")
                .role(UserRole.ADMIN).enabled(true).build();
        entities.persist(actor);
        Owner owner = Owner.builder().fullName("Example Owner").primaryPhone("555-0100").createdBy(actor).build();
        entities.persist(owner);

        Stay withBalance = collectionStay(owner, actor, november, "100", false, false);
        payment(withBalance, actor, november.minusDays(3), "30", false);
        payment(withBalance, actor, november.minusDays(2), "15", true);
        Stay pending = collectionStay(owner, actor, november.plusDays(1), null, true, false);
        payment(pending, actor, november.minusDays(1), "20", false);
        Stay paid = collectionStay(owner, actor, november.plusDays(2), "80", false, false);
        payment(paid, actor, november, "80", false);
        collectionStay(owner, actor, november.plusDays(3), "200", false, true);
        collectionStay(owner, actor, november.minusDays(1), "100", false, false);
        collectionStay(owner, actor, november.plusDays(4), null, false, false);
        entities.flush();

        mvc.perform(get("/api/payments/outstanding").param("month", "2026-11")
                        .with(user("admin").roles("ADMIN")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.knownTotal").value("70"))
                .andExpect(jsonPath("$.pendingPriceCount").value(1))
                .andExpect(jsonPath("$.stays.totalElements").value(2))
                .andExpect(jsonPath("$.stays.items[0].stayId").value(withBalance.getId().toString()))
                .andExpect(jsonPath("$.stays.items[0].paidAmount").value("30"))
                .andExpect(jsonPath("$.stays.items[0].remainingAmount").value("70"))
                .andExpect(jsonPath("$.stays.items[1].stayId").value(pending.getId().toString()))
                .andExpect(jsonPath("$.stays.items[1].paidAmount").value("20"))
                .andExpect(jsonPath("$.stays.items[1].remainingAmount").value(org.hamcrest.Matchers.nullValue()))
                .andExpect(jsonPath("$.stays.items[1].notes").value("Confirm arrival transfer"));

        mvc.perform(get("/api/payments/outstanding").param("month", "2026-11")
                        .with(user("staff").roles("STAFF")))
                .andExpect(status().isForbidden());
    }

    @Test
    void allOutstandingStaysIncludeOlderPendingPricesAndIdentifyArrivalsAlreadyStarted() throws Exception {
        LocalDate today = LocalDate.now(clock);
        UserAccount actor = UserAccount.builder().username("all-outstanding-test").passwordHash("unused")
                .role(UserRole.ADMIN).enabled(true).build();
        entities.persist(actor);
        Owner owner = Owner.builder().fullName("Example Owner").primaryPhone("555-0100").createdBy(actor).build();
        entities.persist(owner);

        Stay olderPending = collectionStay(owner, actor, today.minusMonths(2), null, true, false);
        payment(olderPending, actor, today.minusMonths(3), "20", false);
        Stay futureBalance = collectionStay(owner, actor, today.plusMonths(2), "100", false, false);
        payment(futureBalance, actor, today, "30", false);
        payment(futureBalance, actor, today, "15", true);
        collectionStay(owner, actor, today, "100", false, true);
        collectionStay(owner, actor, today, "0", false, false);
        collectionStay(owner, actor, today, null, false, false);
        entities.flush();

        mvc.perform(get("/api/payments/outstanding").param("scope", "all").with(user("admin").roles("ADMIN")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.knownTotal").value("70"))
                .andExpect(jsonPath("$.pendingPriceCount").value(1))
                .andExpect(jsonPath("$.stays.totalElements").value(2))
                .andExpect(jsonPath("$.stays.items[0].stayId").value(olderPending.getId().toString()))
                .andExpect(jsonPath("$.stays.items[0].paidAmount").value("20"))
                .andExpect(jsonPath("$.stays.items[0].started").value(true))
                .andExpect(jsonPath("$.stays.items[1].stayId").value(futureBalance.getId().toString()))
                .andExpect(jsonPath("$.stays.items[1].started").value(false));

        mvc.perform(get("/api/payments/outstanding").param("scope", "all").with(user("staff").roles("STAFF")))
                .andExpect(status().isForbidden());
    }

    @Test
    void pendingPriceFilterPaginatesOnlyMatchingStaysAndKeepsTheWholeScopeSummary() throws Exception {
        LocalDate arrival = LocalDate.of(2026, 11, 1);
        UserAccount actor = UserAccount.builder().username("pending-filter-test").passwordHash("unused")
                .role(UserRole.ADMIN).enabled(true).build();
        entities.persist(actor);
        Owner owner = Owner.builder().fullName("Example Owner").primaryPhone("555-0100").createdBy(actor).build();
        entities.persist(owner);
        collectionStay(owner, actor, arrival, "100", false, false);
        for (int day = 1; day <= 12; day++) {
            collectionStay(owner, actor, arrival.plusDays(day), null, true, false);
        }
        collectionStay(owner, actor, arrival.minusMonths(1), null, true, false);
        entities.flush();

        mvc.perform(get("/api/payments/outstanding").param("month", "2026-11")
                        .param("pricePendingOnly", "true").param("page", "4").with(user("admin").roles("ADMIN")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.knownTotal").value("100"))
                .andExpect(jsonPath("$.pendingPriceCount").value(12))
                .andExpect(jsonPath("$.stays.totalElements").value(12))
                .andExpect(jsonPath("$.stays.page").value(1))
                .andExpect(jsonPath("$.stays.items.length()").value(2))
                .andExpect(jsonPath("$.stays.items[*].agreedAmount",
                        org.hamcrest.Matchers.everyItem(org.hamcrest.Matchers.nullValue())));
        mvc.perform(get("/api/payments/outstanding").param("scope", "all")
                        .param("pricePendingOnly", "true").with(user("admin").roles("ADMIN")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.knownTotal").value("100"))
                .andExpect(jsonPath("$.pendingPriceCount").value(13))
                .andExpect(jsonPath("$.stays.totalElements").value(13));
    }

    @Test
    void entityFiltersPreserveWholeStayAmountsAndAdministratorReadsStaffDepositsAcrossMonths() throws Exception {
        LocalDate paymentMonth = LocalDate.now(clock).withDayOfMonth(1);
        LocalDate arrival = paymentMonth.plusMonths(1);
        UserAccount actor = UserAccount.builder().username("payments-filter-staff").passwordHash("unused")
                .role(UserRole.STAFF).enabled(true).build();
        entities.persist(actor);
        Owner owner = Owner.builder().fullName("Example Owner").primaryPhone("555-0100").createdBy(actor).build();
        entities.persist(owner);
        Owner otherOwner = Owner.builder().fullName("Other Owner").primaryPhone("555-0200").createdBy(actor).build();
        entities.persist(otherOwner);
        Cat firstCat = cat(owner, actor, "Luna");
        Cat secondCat = cat(owner, actor, "Mora");
        Cat otherCat = cat(otherOwner, actor, "Milo");
        Stay booked = collectionStay(owner, actor, arrival, "100", false, false);
        entities.persist(StayCat.builder().stay(booked).cat(firstCat).build());
        entities.persist(StayCat.builder().stay(booked).cat(secondCat).build());
        payment(booked, actor, paymentMonth, "20", false);
        payment(booked, actor, paymentMonth, "5", true);
        Stay pending = collectionStay(owner, actor, arrival.plusMonths(1), null, true, false);
        entities.persist(StayCat.builder().stay(pending).cat(firstCat).build());
        payment(pending, actor, paymentMonth, "10", false);
        Stay cancelled = collectionStay(owner, actor, arrival.plusDays(4), "100", false, true);
        entities.persist(StayCat.builder().stay(cancelled).cat(firstCat).build());
        payment(cancelled, actor, paymentMonth, "7", false);
        Stay otherStay = collectionStay(otherOwner, actor, arrival, "300", false, false);
        entities.persist(StayCat.builder().stay(otherStay).cat(otherCat).build());
        payment(otherStay, actor, paymentMonth, "200", false);
        entities.flush();

        mvc.perform(post("/api/stays/{id}/payments", booked.getId())
                        .with(user(actor.getUsername()).roles("STAFF"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"amount":"30","paymentDate":"%s","note":"Deposit"}
                                """.formatted(paymentMonth.minusMonths(1))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.totalPaid").value("50"));

        mvc.perform(get("/api/payments/received").param("scope", "all")
                        .param("ownerId", owner.getId().toString()).with(user("admin").roles("ADMIN")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalAmount").value("67"))
                .andExpect(jsonPath("$.payments.totalElements").value(4));
        mvc.perform(get("/api/payments/received").param("month", YearMonth.from(paymentMonth).toString())
                        .param("ownerId", owner.getId().toString()).with(user("admin").roles("ADMIN")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalAmount").value("37"))
                .andExpect(jsonPath("$.payments.totalElements").value(3));
        mvc.perform(get("/api/payments/received").param("scope", "all").param("month", "ignored")
                        .param("catId", secondCat.getId().toString()).with(user("admin").roles("ADMIN")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalAmount").value("50"))
                .andExpect(jsonPath("$.payments.totalElements").value(2))
                .andExpect(jsonPath("$.payments.items[0].cats.length()").value(2));

        mvc.perform(get("/api/payments/outstanding").param("scope", "all")
                        .param("ownerId", owner.getId().toString()).param("pricePendingOnly", "true")
                        .param("page", "9").with(user("admin").roles("ADMIN")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.knownTotal").value("50"))
                .andExpect(jsonPath("$.pendingPriceCount").value(1))
                .andExpect(jsonPath("$.stays.totalElements").value(1))
                .andExpect(jsonPath("$.stays.page").value(0))
                .andExpect(jsonPath("$.stays.items[0].stayId").value(pending.getId().toString()));
        mvc.perform(get("/api/payments/outstanding").param("month", YearMonth.from(arrival).toString())
                        .param("ownerId", owner.getId().toString()).with(user("admin").roles("ADMIN")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.knownTotal").value("50"))
                .andExpect(jsonPath("$.pendingPriceCount").value(0))
                .andExpect(jsonPath("$.stays.totalElements").value(1))
                .andExpect(jsonPath("$.stays.items[0].stayId").value(booked.getId().toString()));
        mvc.perform(get("/api/payments/outstanding").param("scope", "all")
                        .param("catId", secondCat.getId().toString()).with(user("admin").roles("ADMIN")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.knownTotal").value("50"))
                .andExpect(jsonPath("$.pendingPriceCount").value(0))
                .andExpect(jsonPath("$.stays.totalElements").value(1));
    }

    @Test
    void paymentScopesRejectConflictingEntityFiltersAndStaffAccess() throws Exception {
        for (String view : new String[]{"received", "outstanding"}) {
            mvc.perform(get("/api/payments/" + view).param("scope", "all")
                            .param("ownerId", UUID.randomUUID().toString())
                            .param("catId", UUID.randomUUID().toString()).with(user("admin").roles("ADMIN")))
                    .andExpect(status().isBadRequest());
            mvc.perform(get("/api/payments/" + view).param("scope", "unknown")
                            .param("month", "2026-11").with(user("admin").roles("ADMIN")))
                    .andExpect(status().isBadRequest());
            mvc.perform(get("/api/payments/" + view).param("scope", "all")
                            .with(user("staff").roles("STAFF")))
                    .andExpect(status().isForbidden());
        }
    }

    private Cat cat(Owner owner, UserAccount actor, String name) {
        Cat cat = Cat.builder().name(name).birthDate(LocalDate.of(2020, 1, 1)).sex(Sex.FEMALE)
                .owner(owner).createdBy(actor).build();
        entities.persist(cat);
        return cat;
    }

    private Stay collectionStay(Owner owner, UserAccount actor, LocalDate arrival, String amount, boolean pending,
                                boolean cancelled) {
        Stay stay = Stay.builder().owner(owner).createdBy(actor).pricePending(pending)
                .agreedAmount(amount == null ? null : new BigDecimal(amount))
                .startAt(arrival.atTime(10, 0)).endAt(arrival.plusDays(3).atTime(10, 0))
                .cancelledAt(cancelled ? arrival.atStartOfDay() : null).notes("Confirm arrival transfer").build();
        entities.persist(stay);
        return stay;
    }

    private void payment(Stay stay, UserAccount actor, LocalDate date, String amount, boolean annulled) {
        entities.persist(StayPayment.builder().stay(stay).registeredBy(actor).paymentDate(date)
                .amount(new BigDecimal(amount)).note("Deposit").annulled(annulled).build());
    }
}
