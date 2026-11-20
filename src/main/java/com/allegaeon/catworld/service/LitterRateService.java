package com.allegaeon.catworld.service;

import com.allegaeon.catworld.dto.LitterRateDTO;
import com.allegaeon.catworld.exception.BadRequestException;
import com.allegaeon.catworld.model.LitterRate;
import com.allegaeon.catworld.repository.LitterRateRepository;
import com.allegaeon.catworld.security.CurrentUserAccountService;
import com.allegaeon.catworld.validation.WholeMonetaryAmount;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

@Service
@RequiredArgsConstructor
public class LitterRateService {
    private final LitterRateRepository repository;
    private final CurrentUserAccountService users;
    private final NightlyReferenceRateAuthorizationPolicy policy;

    @Transactional(readOnly = true)
    public LitterRateDTO get() {
        policy.authorizeRead(users.getCurrentUserAccount());
        return new LitterRateDTO(currentRate());
    }

    @Transactional
    public LitterRateDTO configure(BigDecimal value) {
        policy.authorizeMutation(users.getCurrentUserAccount());
        if (!WholeMonetaryAmount.isSupported(value) || value.signum() <= 0) {
            throw new BadRequestException("Litter rate must be a positive whole number with at most 19 digits");
        }
        BigDecimal rate = WholeMonetaryAmount.canonicalize(value);
        repository.findCurrentForUpdate().setLitterRatePerKg(rate);
        return new LitterRateDTO(rate);
    }

    @Transactional
    public void clear() {
        policy.authorizeMutation(users.getCurrentUserAccount());
        repository.findCurrentForUpdate().setLitterRatePerKg(null);
    }

    BigDecimal currentRate() {
        return repository.findById(LitterRate.CURRENT_ID).map(LitterRate::getLitterRatePerKg).orElse(null);
    }

    BigDecimal currentRateForUpdate() {
        return repository.findCurrentForUpdate().getLitterRatePerKg();
    }
}
