package com.allegaeon.catworld.dto;
import com.fasterxml.jackson.annotation.JsonFormat; import lombok.*; import java.math.BigDecimal;
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor public class TransferRateResponseDTO { @JsonFormat(shape=JsonFormat.Shape.STRING) private BigDecimal transferRate; }
