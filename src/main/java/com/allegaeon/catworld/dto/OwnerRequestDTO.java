package com.allegaeon.catworld.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OwnerRequestDTO {

    @NotBlank(message = "Full name is required")
    @Size(max = 100, message = "Full name must not exceed 100 characters")
    private String fullName;

    @Size(max = 100, message = "Address must not exceed 100 characters")
    private String address;

    @NotBlank(message = "Primary phone is required")
    @Size(max = 20, message = "Primary phone must not exceed 20 characters")
    private String primaryPhone;

    @Size(max = 20, message = "Secondary phone must not exceed 20 characters")
    private String secondaryPhone;

    @Size(max = 100, message = "Secondary phone name must not exceed 100 characters")
    private String secondaryPhoneName;

    @Size(max = 100, message = "Instagram must not exceed 100 characters")
    private String instagram;

    @Size(max = 100, message = "Facebook must not exceed 100 characters")
    private String facebook;

}
