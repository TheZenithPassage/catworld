package com.allegaeon.catworld.config;

import com.allegaeon.catworld.service.CatIntakeService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.access.intercept.AuthorizationFilter;
import org.springframework.security.web.servlet.util.matcher.PathPatternRequestMatcher;
import org.springframework.security.web.util.matcher.OrRequestMatcher;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

@Configuration
public class CatIntakeSecurityConfig {
    @Bean
    @Order(1)
    SecurityFilterChain catIntakeLinkSecurity(HttpSecurity http, CatIntakeService intake) throws Exception {
        var paths = PathPatternRequestMatcher.withDefaults();
        String formPath = "/api/intake/request";
        String submissionPath = "/api/intake/submissions";
        var read = paths.matcher(HttpMethod.GET, formPath);
        var submit = paths.matcher(HttpMethod.POST, submissionPath);
        var options = new OrRequestMatcher(paths.matcher(HttpMethod.OPTIONS, formPath),
                paths.matcher(HttpMethod.OPTIONS, submissionPath));
        var recipientCors = new CorsConfiguration();
        recipientCors.setAllowedOrigins(List.of(intake.recipientOrigin()));
        recipientCors.setAllowedMethods(List.of(HttpMethod.GET.name(), HttpMethod.POST.name()));
        recipientCors.setAllowedHeaders(List.of(HttpHeaders.AUTHORIZATION, HttpHeaders.CONTENT_TYPE));
        recipientCors.setAllowCredentials(false);
        return http.securityMatcher(new OrRequestMatcher(read, submit,
                        request -> CorsUtils.isPreFlightRequest(request) && options.matches(request)))
                .csrf(AbstractHttpConfigurer::disable)
                .cors(cors -> cors.configurationSource(request -> recipientCors))
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth.anyRequest().permitAll())
                .addFilterBefore(new OncePerRequestFilter() {
                    @Override
                    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                                    FilterChain chain) throws ServletException, IOException {
                        response.setHeader(HttpHeaders.CACHE_CONTROL, "no-store");
                        if (submit.matches(request) && !intake.hasOpenLink(request.getHeader(HttpHeaders.AUTHORIZATION))) {
                            response.setStatus(HttpServletResponse.SC_NOT_FOUND);
                            return;
                        }
                        chain.doFilter(request, response);
                    }
                }, AuthorizationFilter.class)
                .build();
    }
}
