package com.allegaeon.catworld.exception;

import lombok.Getter;

import java.util.Map;

@Getter
public class CatCatalogTextConfirmationException extends RuntimeException {
    private final Map<String, String> fields;

    public CatCatalogTextConfirmationException(Map<String, String> fields) {
        this.fields = Map.copyOf(fields);
    }
}
