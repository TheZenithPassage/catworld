package com.allegaeon.catworld.dto.overview;

import java.util.List;

public record OverviewPage<T>(List<T> items, int page, int pageSize, long totalElements) {
    public static final int PAGE_SIZE = 10;

    public OverviewPage {
        items = List.copyOf(items);
        if (pageSize != PAGE_SIZE) throw new IllegalArgumentException("Overview page size must be 10");
    }

    public OverviewPage(List<T> items, int page, long totalElements) {
        this(List.copyOf(items), page, PAGE_SIZE, totalElements);
    }
}
