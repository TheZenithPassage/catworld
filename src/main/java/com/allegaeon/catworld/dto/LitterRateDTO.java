package com.allegaeon.catworld.dto;

import com.fasterxml.jackson.annotation.JsonFormat;

import java.math.BigDecimal;

public record LitterRateDTO(@JsonFormat(shape = JsonFormat.Shape.STRING) BigDecimal litterRatePerKg) {}
