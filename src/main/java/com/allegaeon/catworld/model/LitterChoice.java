package com.allegaeon.catworld.model;

public enum LitterChoice {
    OWN(0), HALF(1), ONE(2);

    private final int halfKilosPerDay;

    LitterChoice(int halfKilosPerDay) {
        this.halfKilosPerDay = halfKilosPerDay;
    }

    public int halfKilosPerDay() {
        return halfKilosPerDay;
    }
}
