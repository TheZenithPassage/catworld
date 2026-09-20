package com.allegaeon.catworld.service;

import com.allegaeon.catworld.exception.BadRequestException;
import com.allegaeon.catworld.exception.ConflictException;
import com.allegaeon.catworld.model.NightlyReferenceRate;
import com.allegaeon.catworld.model.NightlyReferenceRateKey;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.function.Function;

import static com.allegaeon.catworld.model.NightlyReferenceRateKey.ONE_CAT;
import static com.allegaeon.catworld.model.NightlyReferenceRateKey.ONE_CAT_15_TO_29;
import static com.allegaeon.catworld.model.NightlyReferenceRateKey.ONE_CAT_30_PLUS;
import static com.allegaeon.catworld.model.NightlyReferenceRateKey.ONE_CAT_7_TO_14;
import static com.allegaeon.catworld.model.NightlyReferenceRateKey.THREE_PLUS_CATS;
import static com.allegaeon.catworld.model.NightlyReferenceRateKey.TWO_CATS;

@Component
public class NightlyReferenceRateResolver {

    public BigDecimal resolve(
            int catCount,
            long numberOfNights,
            Function<NightlyReferenceRateKey, Optional<NightlyReferenceRate>> rateLookup) {
        for (NightlyReferenceRateKey key : candidates(catCount, numberOfNights)) {
            NightlyReferenceRate rate = rateLookup.apply(key)
                    .orElseThrow(() -> new ConflictException(
                            "Nightly reference-rate configuration is incomplete"));
            if (rate.getNightlyRate() != null) {
                return rate.getNightlyRate();
            }
        }
        return null;
    }

    private List<NightlyReferenceRateKey> candidates(int catCount, long nights) {
        if (catCount == 1) {
            if (nights >= 30) {
                return List.of(ONE_CAT_30_PLUS, ONE_CAT_15_TO_29, ONE_CAT_7_TO_14, ONE_CAT);
            }
            if (nights >= 15) {
                return List.of(ONE_CAT_15_TO_29, ONE_CAT_7_TO_14, ONE_CAT);
            }
            if (nights >= 7) {
                return List.of(ONE_CAT_7_TO_14, ONE_CAT);
            }
            return List.of(ONE_CAT);
        }
        if (catCount == 2) {
            return List.of(TWO_CATS);
        }
        if (catCount >= 3) {
            return List.of(THREE_PLUS_CATS);
        }
        throw new BadRequestException("A stay must contain at least one cat");
    }
}
