package com.allegaeon.catworld.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.time.LocalDateTime;

@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StayUpdateDTO {

    @NotNull(message = "startAt is required")
    private LocalDateTime startAt;

    @NotNull(message = "endAt is required")
    private LocalDateTime endAt;

    @Size(max = 500, message = "Notes must not exceed 500 characters")
    private String notes;

}
