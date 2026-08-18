package com.allegaeon.catworld.validation;

import java.math.BigDecimal;
import java.math.RoundingMode;

public final class WholeMonetaryAmount {

    private static final long MAX_INTEGER_DIGITS = 19L;

    private WholeMonetaryAmount() {
    }

    public static boolean isSupported(BigDecimal amount) {
        if (amount == null) {
            return false;
        }

        BigDecimal normalized = amount.stripTrailingZeros();
        long scale = normalized.scale();
        long fractionalDigits = Math.max(scale, 0L);
        long integerDigits = Math.max(
                (long) normalized.precision() - scale,
                0L
        );
        return fractionalDigits == 0L
                && integerDigits <= MAX_INTEGER_DIGITS;
    }

    public static BigDecimal canonicalize(BigDecimal amount) {
        return amount.setScale(0, RoundingMode.UNNECESSARY);
    }
}
