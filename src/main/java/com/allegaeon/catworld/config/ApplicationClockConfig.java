package com.allegaeon.catworld.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.Clock;
import java.time.ZoneId;

@Configuration
public class ApplicationClockConfig {

    @Bean
    Clock applicationClock(@Value("${BUSINESS_TIME_ZONE:America/Argentina/Buenos_Aires}") String zone) {
        return Clock.system(ZoneId.of(zone));
    }
}
