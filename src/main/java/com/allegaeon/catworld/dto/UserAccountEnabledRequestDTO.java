package com.allegaeon.catworld.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserAccountEnabledRequestDTO {

    @NotNull(message = "Enabled is required")
    private Boolean enabled;
}
