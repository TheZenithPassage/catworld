package com.allegaeon.catworld.exception;

public class StaleCatEditException extends ConflictException {
    public StaleCatEditException() {
        super("The cat has changed since this edit was opened");
    }
}
