package com.allegaeon.catworld.service;

import com.allegaeon.catworld.exception.ConflictException;
import com.allegaeon.catworld.model.NightlyReferenceRate;
import com.allegaeon.catworld.model.NightlyReferenceRateKey;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.EnumMap;
import java.util.Map;
import java.util.Optional;
import java.util.function.Function;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;

class NightlyReferenceRateResolverTest {

    private final NightlyReferenceRateResolver resolver = new NightlyReferenceRateResolver();

    @Test
    void resolvesExactOneCatBoundaries() {
        Map<NightlyReferenceRateKey, BigDecimal> amounts = Map.of(
                NightlyReferenceRateKey.ONE_CAT, new BigDecimal("20"),
                NightlyReferenceRateKey.ONE_CAT_7_TO_14, new BigDecimal("19"),
                NightlyReferenceRateKey.ONE_CAT_15_TO_29, new BigDecimal("18"),
                NightlyReferenceRateKey.ONE_CAT_30_PLUS, new BigDecimal("17")
        );

        assertRate("20", resolver.resolve(1, 0, lookup(amounts)));
        assertRate("20", resolver.resolve(1, 6, lookup(amounts)));
        assertRate("19", resolver.resolve(1, 7, lookup(amounts)));
        assertRate("19", resolver.resolve(1, 14, lookup(amounts)));
        assertRate("18", resolver.resolve(1, 15, lookup(amounts)));
        assertRate("18", resolver.resolve(1, 29, lookup(amounts)));
        assertRate("17", resolver.resolve(1, 30, lookup(amounts)));
    }

    @Test
    void fallsBackThroughNullOneCatTiers() {
        Map<NightlyReferenceRateKey, BigDecimal> amounts =
                new EnumMap<>(NightlyReferenceRateKey.class);
        amounts.put(NightlyReferenceRateKey.ONE_CAT, new BigDecimal("20"));
        amounts.put(NightlyReferenceRateKey.ONE_CAT_7_TO_14, null);
        amounts.put(NightlyReferenceRateKey.ONE_CAT_15_TO_29, new BigDecimal("18"));
        amounts.put(NightlyReferenceRateKey.ONE_CAT_30_PLUS, null);

        assertRate("18", resolver.resolve(1, 40, lookup(amounts)));
    }

    @Test
    void returnsNullWhenCompleteOneCatChainIsConfiguredButNull() {
        Map<NightlyReferenceRateKey, BigDecimal> amounts =
                new EnumMap<>(NightlyReferenceRateKey.class);
        amounts.put(NightlyReferenceRateKey.ONE_CAT, null);
        amounts.put(NightlyReferenceRateKey.ONE_CAT_7_TO_14, null);
        amounts.put(NightlyReferenceRateKey.ONE_CAT_15_TO_29, null);
        amounts.put(NightlyReferenceRateKey.ONE_CAT_30_PLUS, null);

        assertNull(resolver.resolve(1, 40, lookup(amounts)));
    }

    @Test
    void multiCatRatesIgnoreDurationAndNeverCrossFallback() {
        Map<NightlyReferenceRateKey, BigDecimal> amounts =
                new EnumMap<>(NightlyReferenceRateKey.class);
        amounts.put(NightlyReferenceRateKey.ONE_CAT, new BigDecimal("20"));
        amounts.put(NightlyReferenceRateKey.TWO_CATS, null);
        amounts.put(NightlyReferenceRateKey.THREE_PLUS_CATS, new BigDecimal("50"));

        assertNull(resolver.resolve(2, 90, lookup(amounts)));
        assertRate("50", resolver.resolve(3, 1, lookup(amounts)));
        assertRate("50", resolver.resolve(8, 120, lookup(amounts)));
    }

    @Test
    void missingPhysicalCandidateIsAConflict() {
        assertThrows(
                ConflictException.class,
                () -> resolver.resolve(1, 30, key -> Optional.empty()));
    }

    private Function<NightlyReferenceRateKey, Optional<NightlyReferenceRate>> lookup(
            Map<NightlyReferenceRateKey, BigDecimal> amounts) {
        return key -> amounts.containsKey(key)
                ? Optional.of(NightlyReferenceRate.builder()
                        .key(key)
                        .nightlyRate(amounts.get(key))
                        .build())
                : Optional.empty();
    }

    private void assertRate(String expected, BigDecimal actual) {
        assertEquals(0, new BigDecimal(expected).compareTo(actual));
    }
}
