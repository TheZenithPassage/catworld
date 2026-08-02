package com.allegaeon.catworld.service;

import com.allegaeon.catworld.dto.sensitiveactivity.SensitiveEconomicActivityFilter;
import com.allegaeon.catworld.dto.sensitiveactivity.SensitiveEconomicActivityResponseDTO;
import com.allegaeon.catworld.exception.BadRequestException;
import com.allegaeon.catworld.mapper.SensitiveEconomicActivityMapper;
import com.allegaeon.catworld.repository.SensitiveEconomicActivityReadRepository;
import com.allegaeon.catworld.security.CurrentUserAccountService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class SensitiveEconomicActivityService
        implements ISensitiveEconomicActivityService {

    private final SensitiveEconomicActivityReadRepository readRepository;
    private final SensitiveEconomicActivityMapper mapper;
    private final CurrentUserAccountService currentUserAccountService;
    private final SensitiveEconomicActivityAuthorizationPolicy authorizationPolicy;

    @Override
    @Transactional(readOnly = true)
    public List<SensitiveEconomicActivityResponseDTO> getActivity(
            SensitiveEconomicActivityFilter filter) {
        authorizationPolicy.authorizeRead(
                currentUserAccountService.getCurrentUserAccount()
        );
        SensitiveEconomicActivityFilter effectiveFilter = filter == null
                ? new SensitiveEconomicActivityFilter(
                        null, null, null, null, null, null, null
                )
                : filter;
        validateRange(effectiveFilter);

        return readRepository.findActivity(effectiveFilter).stream()
                .map(mapper::map)
                .toList();
    }

    private void validateRange(SensitiveEconomicActivityFilter filter) {
        if (filter.occurredFrom() != null
                && filter.occurredTo() != null
                && !filter.occurredFrom().isBefore(filter.occurredTo())) {
            throw new BadRequestException(
                    "occurredFrom must be earlier than occurredTo"
            );
        }
    }

}
