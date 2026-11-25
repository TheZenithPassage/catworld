package com.allegaeon.catworld.exception;

public class StayEndBeforeActualArrivalException extends BadRequestException {
    public StayEndBeforeActualArrivalException() {
        super("The scheduled departure cannot be before the actual arrival");
    }
}
