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
    THREE_CATS(3);

    private final int catCount;

    public static Optional<NightlyReferenceRateCategory> fromCatCount(int catCount) {
        return Arrays.stream(values())
                .filter(category -> category.catCount == catCount)
                .findFirst();
    }
}
