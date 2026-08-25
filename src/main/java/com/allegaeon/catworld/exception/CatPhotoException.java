package com.allegaeon.catworld.exception;

import lombok.Getter;

@Getter
public class CatPhotoException extends RuntimeException {
    private final CatPhotoErrorCode code;

    public CatPhotoException(CatPhotoErrorCode code) {
        super(code.name());
        this.code = code;
    }
}
