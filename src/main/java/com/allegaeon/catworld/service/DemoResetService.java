package com.allegaeon.catworld.service;

import com.allegaeon.catworld.dto.DemoStatusResponseDTO;
import com.allegaeon.catworld.repository.DemoResetRepository;
import com.allegaeon.catworld.repository.UserAccountRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;

import static com.allegaeon.catworld.dto.DemoStatusResponseDTO.ResetState.*;

@Service
@ConditionalOnProperty(name = "catworld.demo.enabled", havingValue = "true")
@RequiredArgsConstructor
public class DemoResetService {
    private static final ZoneId QUOTA_ZONE = ZoneId.of("Europe/Madrid");
    private static final Duration COOLDOWN_DURATION = Duration.ofMinutes(2);
    private static final int DAILY_IP_LIMIT = 3;
    private static final int DAILY_GLOBAL_LIMIT = 6;

    private final DemoResetRepository resets;
    private final DemoActivityService activity;
    private final UserAccountRepository accounts;
    private final Clock clock;

    @Transactional(readOnly = true)
    public DemoStatusResponseDTO getStatus(String clientIp) {
        return getStatus(resets.readState(false), clientIp, clock.instant());
    }

    @Transactional
    public DemoStatusResponseDTO requestReset(String clientIp) {
        var state = resets.readState(true);
        Instant now = clock.instant();
        var status = getStatus(state, clientIp, now);
        if (status.resetState() == AVAILABLE) {
            LocalDate quotaDay = now.atZone(QUOTA_ZONE).toLocalDate();
            resets.accept(clientIp, LocalDateTime.ofInstant(now, ZoneOffset.UTC),
                    quotaDay, quotaDay.equals(state.quotaDay()));
            return new DemoStatusResponseDTO(status.hasAdditionalAccounts(), status.nextScheduledCheckAt(), QUEUED, null);
        }
        return status;
    }

    private DemoStatusResponseDTO getStatus(DemoResetRepository.ResetState state, String clientIp, Instant now) {
        boolean hasAdditionalAccounts = accounts.existsByUsernameNot(activity.sharedUsername());
        Instant nextScheduledCheck = now.truncatedTo(ChronoUnit.HOURS).plus(1, ChronoUnit.HOURS);
        if (state.queued()) {
            return new DemoStatusResponseDTO(hasAdditionalAccounts, nextScheduledCheck, QUEUED, null);
        }
        if (!activity.needsReset()) {
            return new DemoStatusResponseDTO(hasAdditionalAccounts, nextScheduledCheck, CLEAN, null);
        }
        LocalDate quotaDay = now.atZone(QUOTA_ZONE).toLocalDate();
        if (quotaDay.equals(state.quotaDay())
                && (state.acceptedCount() >= DAILY_GLOBAL_LIMIT || resets.acceptedFromIp(clientIp) >= DAILY_IP_LIMIT)) {
            Instant midnight = quotaDay.plusDays(1).atStartOfDay(QUOTA_ZONE).toInstant();
            return new DemoStatusResponseDTO(hasAdditionalAccounts, nextScheduledCheck, LIMIT_REACHED, midnight);
        }
        if (state.acceptedAt() != null) {
            Instant cooldownEnd = state.acceptedAt().toInstant(ZoneOffset.UTC).plus(COOLDOWN_DURATION);
            if (now.isBefore(cooldownEnd)) {
                return new DemoStatusResponseDTO(hasAdditionalAccounts, nextScheduledCheck, COOLDOWN, cooldownEnd);
            }
        }
        return new DemoStatusResponseDTO(hasAdditionalAccounts, nextScheduledCheck, AVAILABLE, null);
    }
}
