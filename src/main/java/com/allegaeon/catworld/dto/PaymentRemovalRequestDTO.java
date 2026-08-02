package com.allegaeon.catworld.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PaymentRemovalRequestDTO {

    @NotBlank(message = "A non-blank reason is required to remove a payment")
    private String reason;
}
