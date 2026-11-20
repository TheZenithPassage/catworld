package com.allegaeon.catworld.exception;

public class CatIntakeCatalogChangedException extends RuntimeException {
    private final String field;

    public CatIntakeCatalogChangedException(String field) {
        this.field = field;
    }

    public String getField() {
        return field;
    }
}
