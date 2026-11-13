package com.allegaeon.catworld.dto.care;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public record CareHistoryDTO(
        UUID stayId,
        LocalDateTime startAt,
        LocalDateTime endAt,
        UUID actorId,
        List<CareRecordDTO> records
) {}
