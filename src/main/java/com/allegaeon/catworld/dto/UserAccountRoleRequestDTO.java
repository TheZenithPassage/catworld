package com.allegaeon.catworld.dto;

import com.allegaeon.catworld.model.UserRole;
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
public class UserAccountRoleRequestDTO {

    @NotNull(message = "Role is required")
    private UserRole role;
}
