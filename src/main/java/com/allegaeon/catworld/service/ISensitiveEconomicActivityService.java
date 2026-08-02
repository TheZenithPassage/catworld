package com.allegaeon.catworld.service;

import com.allegaeon.catworld.dto.sensitiveactivity.SensitiveEconomicActivityFilter;
import com.allegaeon.catworld.dto.sensitiveactivity.SensitiveEconomicActivityResponseDTO;

import java.util.List;

public interface ISensitiveEconomicActivityService {

    List<SensitiveEconomicActivityResponseDTO> getActivity(
            SensitiveEconomicActivityFilter filter);
}
