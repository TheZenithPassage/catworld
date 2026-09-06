package com.allegaeon.catworld.service;

import com.allegaeon.catworld.dto.sensitiveactivity.SensitiveEconomicActivityFilter;
import com.allegaeon.catworld.dto.sensitiveactivity.SensitiveEconomicActivityResponseDTO;

import java.util.List;
import com.allegaeon.catworld.dto.overview.OverviewPage;

public interface ISensitiveEconomicActivityService {

    OverviewPage<SensitiveEconomicActivityResponseDTO> getActivity(
            SensitiveEconomicActivityFilter filter, int page);

    default List<SensitiveEconomicActivityResponseDTO> getActivity(SensitiveEconomicActivityFilter filter) {
        return getActivity(filter, 0).items();
    }
}
