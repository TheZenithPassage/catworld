package com.allegaeon.catworld.dto;

import com.allegaeon.catworld.model.UserRole;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserAccountResponseDTO {

    private UUID id;
    private String username;
    private UserRole role;
    private boolean enabled;
}
