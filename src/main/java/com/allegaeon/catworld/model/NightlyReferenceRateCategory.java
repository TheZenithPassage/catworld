package com.allegaeon.catworld.model;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

import java.util.Arrays;
import java.util.Optional;

@Getter
@RequiredArgsConstructor
public enum NightlyReferenceRateCategory {
    ONE_CAT(1),
    TWO_CATS(2),
    THREE_PLUS_CATS(3);

    private final int minimumCatCount;

    public static Optional<NightlyReferenceRateCategory> fromMinimumCatCount(
            int minimumCatCount) {
        return Arrays.stream(values())
                .filter(category -> category.minimumCatCount == minimumCatCount)
                .findFirst();
    }

    public static Optional<NightlyReferenceRateCategory> fromActualCatCount(int actualCatCount) {
        if (actualCatCount == 1) {
            return Optional.of(ONE_CAT);
        }
        if (actualCatCount == 2) {
            return Optional.of(TWO_CATS);
        }
        if (actualCatCount >= 3) {
            return Optional.of(THREE_PLUS_CATS);
        }
        return Optional.empty();
    }
}
