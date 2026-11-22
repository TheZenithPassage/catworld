package com.allegaeon.catworld.exception;

import lombok.Getter;

@Getter
public class StayBookingConflictException extends ConflictException {
    private final String catName;

    public StayBookingConflictException(String catName) {
        super("There's already a booking for " + catName + " in the selected dates");
        this.catName = catName;
    }
}
