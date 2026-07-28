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
}
