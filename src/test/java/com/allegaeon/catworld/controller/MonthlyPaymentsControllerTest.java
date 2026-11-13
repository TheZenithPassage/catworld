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
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class MonthlyPaymentsControllerTest {

    @Autowired MockMvc mvc;
    @Autowired EntityManager entities;

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
