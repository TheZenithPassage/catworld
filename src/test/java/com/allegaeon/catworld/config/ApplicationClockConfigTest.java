package com.allegaeon.catworld.config;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.assertEquals;

class ApplicationClockConfigTest {

    private final ApplicationContextRunner context = new ApplicationContextRunner()
            .withUserConfiguration(ApplicationClockConfig.class);

    @Test
    void defaultsToBuenosAiresWhenUtcIsAlreadyOnTheNextDay() {
        context.run(application -> {
            Clock clock = application.getBean(Clock.class);
            assertEquals(LocalDateTime.parse("2026-08-31T22:30:00"),
                    LocalDateTime.ofInstant(Instant.parse("2026-09-01T01:30:00Z"), clock.getZone()));
        });
    }

    @Test
    void usesTheConfiguredBusinessTimeZone() {
        context.withPropertyValues("BUSINESS_TIME_ZONE=Europe/Madrid").run(application -> {
            Clock clock = application.getBean(Clock.class);
            assertEquals(LocalDateTime.parse("2026-09-01T03:30:00"),
                    LocalDateTime.ofInstant(Instant.parse("2026-09-01T01:30:00Z"), clock.getZone()));
        });
    }
}
