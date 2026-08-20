package com.allegaeon.catworld.validation;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

public class TrimmedSizeValidator implements ConstraintValidator<TrimmedSize, CharSequence> {

    private int min;
    private int max;

    @Override
    public void initialize(TrimmedSize constraintAnnotation) {
        min = constraintAnnotation.min();
        max = constraintAnnotation.max();

        if (min < 0 || max < min) {
            throw new IllegalArgumentException("TrimmedSize requires 0 <= min <= max");
        }
    }

    @Override
    public boolean isValid(CharSequence value, ConstraintValidatorContext context) {
        if (value == null) {
            return true;
        }

        String trimmedValue = value.toString().trim();
        if (trimmedValue.isEmpty()) {
            return true;
        }

        int length = trimmedValue.length();
        return length >= min && length <= max;
    }
}
