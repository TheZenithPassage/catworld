package com.allegaeon.catworld.dto.lookup;

import java.util.List;

public record LookupPage<T>(List<T> items, int page, int pageSize, long totalElements) {
}
