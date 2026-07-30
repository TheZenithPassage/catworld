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
public class PaymentAnnulmentRequestDTO {

    @NotBlank(message = "A non-blank reason is required to annul a payment")
    private String reason;
}
