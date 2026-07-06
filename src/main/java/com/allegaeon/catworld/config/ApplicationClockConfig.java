package com.allegaeon.catworld.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.Clock;

@Configuration
public class ApplicationClockConfig {

    @Bean
    Clock applicationClock() {
        return Clock.systemUTC();
    }
}
