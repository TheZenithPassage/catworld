package com.allegaeon.catworld.service;

import com.allegaeon.catworld.dto.NightlyReferenceRateResponseDTO;
import com.allegaeon.catworld.exception.BadRequestException;
import com.allegaeon.catworld.exception.ConflictException;
import com.allegaeon.catworld.mapper.NightlyReferenceRateMapper;
import com.allegaeon.catworld.model.NightlyReferenceRate;
import com.allegaeon.catworld.model.NightlyReferenceRateCategory;
import com.allegaeon.catworld.model.NightlyReferenceRateChange;
import com.allegaeon.catworld.model.UserAccount;
import com.allegaeon.catworld.repository.NightlyReferenceRateChangeRepository;
import com.allegaeon.catworld.repository.NightlyReferenceRateRepository;
import com.allegaeon.catworld.security.CurrentUserAccountService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.Instant;
import java.util.Comparator;
import java.util.List;

@RequiredArgsConstructor
@Service
public class NightlyReferenceRateService implements INightlyReferenceRateService {

    private static final int MAX_INTEGER_DIGITS = 19;

    private final NightlyReferenceRateRepository nightlyReferenceRateRepository;
    private final NightlyReferenceRateChangeRepository nightlyReferenceRateChangeRepository;
    private final NightlyReferenceRateMapper nightlyReferenceRateMapper;
    private final CurrentUserAccountService currentUserAccountService;
    private final NightlyReferenceRateAuthorizationPolicy authorizationPolicy;
    private final Clock clock;

    @Override
    @Transactional(readOnly = true)
    public List<NightlyReferenceRateResponseDTO> getCurrentRates() {
        authorizationPolicy.authorizeRead(currentUserAccountService.getCurrentUserAccount());

        List<NightlyReferenceRate> rates = nightlyReferenceRateRepository.findAll();
        if (rates.size() != NightlyReferenceRateCategory.values().length) {
            throw new ConflictException("Nightly reference-rate configuration is incomplete");
        }

        return rates.stream()
                .sorted(Comparator.comparingInt(
                        rate -> rate.getCategory().getMinimumCatCount()
                ))
                .map(nightlyReferenceRateMapper::toResponseDTO)
                .toList();
    }

    @Override
    @Transactional
    public NightlyReferenceRateResponseDTO configureRate(
            int minimumCatCount,
            BigDecimal nightlyRate) {
        UserAccount currentUser = currentUserAccountService.getCurrentUserAccount();
        authorizationPolicy.authorizeMutation(currentUser);
        validateNightlyRate(nightlyRate);

        NightlyReferenceRate currentRate = getCurrentRateForUpdate(
                resolveCategoryFromMinimumCatCount(minimumCatCount)
        );
        if (sameNumericValue(currentRate.getNightlyRate(), nightlyRate)) {
            return nightlyReferenceRateMapper.toResponseDTO(currentRate);
        }

        applyChange(currentRate, nightlyRate, currentUser);
        return nightlyReferenceRateMapper.toResponseDTO(currentRate);
    }

    @Override
    @Transactional
    public void clearRate(int minimumCatCount) {
        UserAccount currentUser = currentUserAccountService.getCurrentUserAccount();
        authorizationPolicy.authorizeMutation(currentUser);

        NightlyReferenceRate currentRate = getCurrentRateForUpdate(
                resolveCategoryFromMinimumCatCount(minimumCatCount)
        );
        if (currentRate.getNightlyRate() == null) {
            return;
        }

        applyChange(currentRate, null, currentUser);
    }

    private void applyChange(
            NightlyReferenceRate currentRate,
            BigDecimal newNightlyRate,
            UserAccount currentUser) {
        BigDecimal previousNightlyRate = currentRate.getNightlyRate();
        currentRate.setNightlyRate(newNightlyRate);
        nightlyReferenceRateRepository.saveAndFlush(currentRate);

        nightlyReferenceRateChangeRepository.saveAndFlush(
                NightlyReferenceRateChange.builder()
                        .category(currentRate.getCategory())
                        .previousNightlyRate(previousNightlyRate)
                        .newNightlyRate(newNightlyRate)
                        .changedBy(currentUser)
                        .changedAt(Instant.now(clock))
                        .build()
        );
    }

    private NightlyReferenceRate getCurrentRateForUpdate(NightlyReferenceRateCategory category) {
        return nightlyReferenceRateRepository.findByCategoryForUpdate(category)
                .orElseThrow(() -> new ConflictException(
                        "Nightly reference-rate category with minimum cat-count threshold "
                                + category.getMinimumCatCount()
                                + " is unavailable"
                ));
    }

    private NightlyReferenceRateCategory resolveCategoryFromMinimumCatCount(
            int minimumCatCount) {
        return NightlyReferenceRateCategory.fromMinimumCatCount(minimumCatCount)
                .orElseThrow(() -> new BadRequestException(
                        "Nightly reference-rate minimum cat-count threshold must be 1, 2, or 3"
                ));
    }

    private void validateNightlyRate(BigDecimal nightlyRate) {
        if (nightlyRate == null || nightlyRate.signum() <= 0) {
            throw new BadRequestException(
                    "Nightly rate must be a positive whole number with at most 19 digits"
            );
        }

        BigDecimal normalized = nightlyRate.stripTrailingZeros();
        int fractionalDigits = Math.max(normalized.scale(), 0);
        int integerDigits = Math.max(normalized.precision() - normalized.scale(), 0);
        if (integerDigits > MAX_INTEGER_DIGITS || fractionalDigits > 0) {
            throw new BadRequestException(
                    "Nightly rate must be a positive whole number with at most 19 digits"
            );
        }
    }

    private boolean sameNumericValue(BigDecimal first, BigDecimal second) {
        return first == null ? second == null : second != null && first.compareTo(second) == 0;
    }
}
