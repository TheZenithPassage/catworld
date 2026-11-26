package com.allegaeon.catworld.service;

import com.allegaeon.catworld.dto.StayLitterBreakdown;
import com.allegaeon.catworld.dto.StayLitterBreakdown.CatLitter;
import com.allegaeon.catworld.exception.BadRequestException;
import com.allegaeon.catworld.model.Cat;
import com.allegaeon.catworld.model.LitterChoice;
import com.allegaeon.catworld.model.LitterPreference;
import com.allegaeon.catworld.model.Stay;
import com.allegaeon.catworld.validation.WholeMonetaryAmount;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;
import java.util.function.Function;
import java.util.function.Supplier;
import java.util.stream.Collectors;

public final class StayLitterPricing {
    private static final BigDecimal HALF_KILO = new BigDecimal("0.5");

    private StayLitterPricing() {}

    static StayLitterBreakdown forCreation(List<Cat> cats, Map<UUID, LitterChoice> overrides,
            long nights, Supplier<BigDecimal> currentRate) {
        Map<UUID, LitterChoice> defaults = cats.stream().collect(Collectors.toMap(Cat::getId,
                cat -> Objects.requireNonNullElse(choiceFromPreference(cat.getLitterPreference()), LitterChoice.OWN)));
        validateOverrides(defaults, overrides);
        defaults.putAll(overrides == null ? Map.of() : overrides);
        return breakdown(defaults, nights, usesLitter(defaults) ? currentRate.get() : null);
    }

    public static StayLitterBreakdown retained(Stay stay, long nights) {
        return breakdown(retainedChoices(stay), nights, stay.getRetainedLitterRatePerKg());
    }

    static StayLitterBreakdown forEdit(Stay stay, Map<UUID, LitterChoice> overrides,
            long nights, Supplier<BigDecimal> currentRate) {
        Map<UUID, LitterChoice> choices = retainedChoices(stay);
        boolean usedLitter = usesLitter(choices);
        validateOverrides(choices, overrides);
        choices.putAll(overrides == null ? Map.of() : overrides);
        BigDecimal rate = stay.getRetainedLitterRatePerKg();
        if (rate == null && !usedLitter && usesLitter(choices)) {
            rate = currentRate.get();
        }
        return breakdown(choices, nights, rate);
    }

    static StayLitterBreakdown forPendingConfirmation(Stay stay, Map<UUID, LitterChoice> overrides,
            long nights, Function<Cat, LitterPreference> approvedPreference, Supplier<BigDecimal> currentRate) {
        Map<UUID, LitterChoice> choices = retainedChoices(stay);
        validateOverrides(choices, overrides);
        choices.putAll(overrides == null ? Map.of() : overrides);
        stay.getStayCats().stream()
                .map(stayCat -> stayCat.getCat())
                .filter(cat -> choices.get(cat.getId()) == null)
                .sorted(Comparator.comparing(Cat::getId))
                .forEach(cat -> choices.put(cat.getId(), choiceFromPreference(approvedPreference.apply(cat))));
        BigDecimal rate = stay.getRetainedLitterRatePerKg();
        if (rate == null && usesLitter(choices)) {
            rate = currentRate.get();
        }
        return breakdown(choices, nights, rate);
    }

    static boolean choicesChanged(StayLitterBreakdown previous, StayLitterBreakdown proposed) {
        return !choices(previous).equals(choices(proposed));
    }

    static boolean confirmationMatches(StayLitterBreakdown submitted, StayLitterBreakdown expected) {
        if (submitted == null) {
            return expected.ratePerKg() == null && BigDecimal.ZERO.equals(expected.subtotal());
        }
        if (submitted.cats() == null || submitted.cats().size() != expected.cats().size()
                || !sameNumber(submitted.ratePerKg(), expected.ratePerKg())
                || !sameNumber(submitted.subtotal(), expected.subtotal())
                || submitted.rateUnavailable() != expected.rateUnavailable()) {
            return false;
        }
        for (int index = 0; index < expected.cats().size(); index++) {
            CatLitter supplied = submitted.cats().get(index);
            CatLitter actual = expected.cats().get(index);
            if (supplied == null || !actual.catId().equals(supplied.catId()) || actual.choice() != supplied.choice()
                    || !sameNumber(supplied.kgPerDay(), actual.kgPerDay())
                    || !sameNumber(supplied.totalKg(), actual.totalKg())
                    || !sameNumber(supplied.suggestedAmount(), actual.suggestedAmount())) {
                return false;
            }
        }
        return true;
    }

    static void retain(Stay stay, StayLitterBreakdown litter) {
        retain(stay, choices(litter), litter.ratePerKg());
    }

    static void retain(Stay stay, Map<UUID, LitterChoice> choices, BigDecimal rate) {
        stay.setRetainedLitterRatePerKg(rate);
        stay.getStayCats().forEach(cat -> cat.setLitterChoice(
                choices == null ? null : choices.get(cat.getCat().getId())));
    }

    static int dailyHalfKilos(StayLitterBreakdown litter) {
        return litter.cats().stream().mapToInt(cat -> halfKilosPerDay(cat.choice())).sum();
    }

    static String auditChoices(StayLitterBreakdown litter) {
        if (litter.cats().isEmpty()) {
            return null;
        }
        return litter.cats().stream()
                .map(cat -> cat.catId() + "=" + (cat.choice() == null ? "UNCONFIRMED" : cat.choice()))
                .collect(Collectors.joining(","));
    }

    public static BigDecimal subtotal(BigDecimal rate, long nights, int dailyHalfKilos) {
        if (dailyHalfKilos == 0) {
            return BigDecimal.ZERO;
        }
        return rate == null ? null : totalKg(nights, dailyHalfKilos).multiply(rate).setScale(0, RoundingMode.HALF_UP);
    }

    public static BigDecimal combine(BigDecimal accommodation, BigDecimal transfer, BigDecimal litter) {
        if (accommodation == null || transfer == null || litter == null) {
            return null;
        }
        BigDecimal result = accommodation.add(transfer).add(litter);
        return WholeMonetaryAmount.isSupported(result) ? WholeMonetaryAmount.canonicalize(result) : null;
    }

    private static StayLitterBreakdown breakdown(Map<UUID, LitterChoice> choices, long nights, BigDecimal rate) {
        List<CatLitter> cats = choices.entrySet().stream().sorted(Map.Entry.comparingByKey())
                .map(entry -> catLitter(entry.getKey(), entry.getValue(), nights, rate)).toList();
        int dailyHalfKilos = choices.values().stream().mapToInt(StayLitterPricing::halfKilosPerDay).sum();
        BigDecimal subtotal = choices.containsValue(null) ? null : subtotal(rate, nights, dailyHalfKilos);
        return new StayLitterBreakdown(rate, subtotal, dailyHalfKilos > 0 && rate == null, cats);
    }

    private static CatLitter catLitter(UUID catId, LitterChoice choice, long nights, BigDecimal rate) {
        if (choice == null) {
            return new CatLitter(catId, null, null, null, null);
        }
        int halfKilos = choice.halfKilosPerDay();
        BigDecimal perDay = HALF_KILO.multiply(BigDecimal.valueOf(halfKilos)).stripTrailingZeros();
        BigDecimal total = totalKg(nights, halfKilos);
        BigDecimal amount = halfKilos == 0 ? BigDecimal.ZERO : rate == null ? null : total.multiply(rate);
        return new CatLitter(catId, choice, perDay, total, amount);
    }

    private static BigDecimal totalKg(long nights, int halfKilos) {
        BigDecimal kilograms = BigDecimal.valueOf(halfKilos).multiply(HALF_KILO).multiply(BigDecimal.valueOf(Math.max(1, nights)));
        return kilograms.remainder(BigDecimal.ONE).signum() == 0 ? kilograms.setScale(0) : kilograms;
    }

    private static Map<UUID, LitterChoice> retainedChoices(Stay stay) {
        Map<UUID, LitterChoice> choices = new HashMap<>();
        stay.getStayCats().forEach(cat -> choices.put(cat.getCat().getId(), cat.getLitterChoice()));
        return choices;
    }

    private static Map<UUID, LitterChoice> choices(StayLitterBreakdown litter) {
        Map<UUID, LitterChoice> choices = new HashMap<>();
        litter.cats().forEach(cat -> choices.put(cat.catId(), cat.choice()));
        return choices;
    }

    private static boolean usesLitter(Map<UUID, LitterChoice> choices) {
        return choices.values().stream().anyMatch(choice -> halfKilosPerDay(choice) > 0);
    }

    private static int halfKilosPerDay(LitterChoice choice) {
        return choice == null ? 0 : choice.halfKilosPerDay();
    }

    private static LitterChoice choiceFromPreference(LitterPreference preference) {
        return switch (preference) {
            case OWN -> LitterChoice.OWN;
            case SHARED -> LitterChoice.HALF;
            case null -> null;
        };
    }

    private static void validateOverrides(Map<UUID, LitterChoice> scope, Map<UUID, LitterChoice> overrides) {
        if (overrides != null && (!scope.keySet().containsAll(overrides.keySet())
                || overrides.values().stream().anyMatch(choice -> choice == null))) {
            throw new BadRequestException("Litter choices must reference cats in the stay and specify a valid quantity");
        }
    }

    private static boolean sameNumber(BigDecimal left, BigDecimal right) {
        return left == null ? right == null : right != null && left.compareTo(right) == 0;
    }
}
