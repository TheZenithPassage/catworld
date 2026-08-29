package com.allegaeon.catworld.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VetRequestDTO {

    @NotBlank(message = "Name is required")
    @Size(max = 100, message = "Name must not exceed 100 characters")
    private String name;

    @Size(max = 100, message = "Address must not exceed 100 characters")
    private String address;

    @Size(max = 20, message = "Phone number must not exceed 20 characters")
    private String phoneNumber;

    private String registrationNumber;

    @Size(max = 100, message = "Registration number must not exceed 100 characters")
    public String getRegistrationNumber() {
        if (registrationNumber == null) return null;
        String normalized = registrationNumber.trim();
        return normalized.isEmpty() ? null : normalized;
    }

}
