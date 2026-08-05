package com.allegaeon.catworld.exception;

public class StalePricingConfirmationException extends ConflictException {
    public StalePricingConfirmationException() {
        super("Pricing confirmation is stale");
    }
}
