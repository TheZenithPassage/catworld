package com.allegaeon.catworld.dto;
import com.allegaeon.catworld.validation.WholeMonetaryAmount;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.validation.constraints.*;
import lombok.*;
import java.math.BigDecimal;
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class TransferRateRequestDTO { @NotNull @DecimalMin("1") private BigDecimal transferRate;
 @AssertTrue @JsonIgnore public boolean isTransferRateSupported(){ return transferRate == null || WholeMonetaryAmount.isSupported(transferRate); } }
