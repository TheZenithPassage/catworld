package com.allegaeon.catworld.repository;

import com.allegaeon.catworld.security.CurrentUserAccountService;
import com.allegaeon.catworld.service.ISensitiveEconomicActivityService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

import static org.mockito.Mockito.when;

@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:sensitive_activity_query;DB_CLOSE_DELAY=-1;MODE=MySQL",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.datasource.username=sa",
        "spring.datasource.password=",
        "spring.jpa.database-platform=org.hibernate.dialect.H2Dialect",
        "spring.jpa.hibernate.ddl-auto=none",
        "spring.flyway.enabled=false",
        "catworld.security.username=query-admin",
        "catworld.security.password=query-password",
        "catworld.security.cors-allowed-origins=http://localhost:4200"
})
@ActiveProfiles("persistence")
@ContextConfiguration(
        initializers = NightlyReferenceRateMigrationTest.LatestSchemaInitializer.class
)
class SensitiveEconomicActivityQueryPersistenceTest {

    @Autowired JdbcTemplate jdbc;
    @Autowired ISensitiveEconomicActivityService service;
    @MockitoBean CurrentUserAccountService currentUserAccountService;

    @BeforeEach
    void resetData() {
        jdbc.update("delete from stay_payment_removals");
        jdbc.update("delete from stay_payment_annulments");
        jdbc.update("delete from stay_payment_edits");
        jdbc.update("delete from stay_payments");
        jdbc.update("delete from stay_agreed_amount_corrections");
        jdbc.update("delete from stay_pricing_decisions");
        jdbc.update("delete from sensitive_stay_context_cats");
        jdbc.update("delete from sensitive_stay_contexts");
        jdbc.update("delete from nightly_reference_rate_changes");
        jdbc.update("delete from stay_cat");
        jdbc.update("delete from stays");
        jdbc.update("delete from cats");
        jdbc.update("delete from vets");
        jdbc.update("delete from owners");
        jdbc.update("delete from user_accounts");
    }

    @Test
    void databaseUnionOwnsEligibilityFiltersAndGlobalOrdering() {
        SensitiveEconomicActivityQueryContract.Fixture fixture =
                SensitiveEconomicActivityQueryContract.seed(jdbc);
        when(currentUserAccountService.getCurrentUserAccount())
                .thenReturn(fixture.actor());

        SensitiveEconomicActivityQueryContract.assertContract(
                jdbc, service, fixture);
    }
}
