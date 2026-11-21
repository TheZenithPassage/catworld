package com.allegaeon.catworld.service;

import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.util.Locale;
import java.util.Objects;
import java.util.UUID;
import java.util.regex.Pattern;

final class CatalogOptionName {
    private static final Pattern WHITESPACE = Pattern.compile("\\s+", Pattern.UNICODE_CHARACTER_CLASS);

    private CatalogOptionName() {}

    static String cleanName(String supplied) {
        if (supplied == null) return null;
        String cleaned = WHITESPACE.matcher(supplied).replaceAll(" ").trim();
        return cleaned.isEmpty() ? null : cleaned;
    }

    static byte[] key(String name) {
        // Use a binary key so database collation cannot merge distinct spellings.
        return name.toLowerCase(Locale.ROOT).getBytes(StandardCharsets.UTF_8);
    }

    static boolean sameName(String left, String right) {
        String a = cleanName(left);
        String b = cleanName(right);
        return a == null || b == null ? Objects.equals(a, b)
                : a.toLowerCase(Locale.ROOT).equals(b.toLowerCase(Locale.ROOT));
    }

    static byte[] binaryId(UUID id) {
        return ByteBuffer.allocate(16)
                .putLong(id.getMostSignificantBits()).putLong(id.getLeastSignificantBits()).array();
    }
}
