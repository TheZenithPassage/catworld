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
import com.allegaeon.catworld.dto.overview.OverviewPage;

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
    public OverviewPage<SensitiveEconomicActivityResponseDTO> getActivity(
            SensitiveEconomicActivityFilter filter, int page) {
        authorizationPolicy.authorizeRead(
                currentUserAccountService.getCurrentUserAccount()
        );
        SensitiveEconomicActivityFilter effectiveFilter = filter == null
                ? new SensitiveEconomicActivityFilter(
                        null, null, null, null, null, null, null
                )
                : filter;
        validateRange(effectiveFilter);
        if (page < 0) throw new BadRequestException("Page must not be negative");

        var result = readRepository.findActivity(effectiveFilter, page);
        return new OverviewPage<>(result.items().stream().map(mapper::map).toList(),
                page, result.totalElements());
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
