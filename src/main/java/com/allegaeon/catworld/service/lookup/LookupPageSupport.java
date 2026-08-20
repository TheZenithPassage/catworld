package com.allegaeon.catworld.service.lookup;

import com.allegaeon.catworld.dto.lookup.LookupPageResponseDTO;
import com.allegaeon.catworld.exception.BadRequestException;
import java.util.Objects;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Slice;

public final class LookupPageSupport {
    public static final int MINIMUM_QUERY_LENGTH = 3;
    public static final int PAGE_SIZE = 5;
    public static final int MAXIMUM_CANDIDATES = PAGE_SIZE + 1;

    private LookupPageSupport() {
    }

    /**
     * Validates the submitted values and creates the zero-based request used by a
     * Spring Data {@link Slice}. Slice queries fetch at most one look-ahead row in
     * addition to the requested five results.
     */
    public static PageRequest pageRequest(String rawQuery, int page) {
        validate(rawQuery, page);
        return PageRequest.of(page, PAGE_SIZE);
    }

    /**
     * Validates the submitted query exactly as received. In particular, the query
     * is not trimmed before applying the minimum-length rule.
     */
    public static void validate(String rawQuery, int page) {
        if (rawQuery == null || rawQuery.length() < MINIMUM_QUERY_LENGTH) {
            throw new BadRequestException(
                    "Search query must contain at least " + MINIMUM_QUERY_LENGTH + " characters");
        }
        if (page < 0) {
            throw new BadRequestException("Page must not be negative");
        }
    }

    public static <T> LookupPageResponseDTO<T> toResponse(Slice<T> slice) {
        Objects.requireNonNull(slice, "slice must not be null");
        if (slice.getSize() != PAGE_SIZE || slice.getNumberOfElements() > PAGE_SIZE) {
            throw new IllegalArgumentException("Lookup slice must use the shared page size");
        }
        return new LookupPageResponseDTO<>(slice.getContent(), slice.getNumber(), slice.hasNext());
    }
}
