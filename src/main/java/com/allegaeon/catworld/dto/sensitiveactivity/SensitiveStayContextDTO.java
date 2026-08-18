package com.allegaeon.catworld.dto.sensitiveactivity;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public record SensitiveStayContextDTO(
        UUID stayId,
        LocalDateTime startAt,
        LocalDateTime endAt,
        LocalDateTime cancelledAt,
        SensitiveOwnerContextDTO owner,
        List<SensitiveCatContextDTO> cats) {
}
