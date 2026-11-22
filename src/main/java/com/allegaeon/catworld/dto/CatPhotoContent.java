package com.allegaeon.catworld.dto;

import com.allegaeon.catworld.model.CatPhotoFrame;

public record CatPhotoContent(byte[] bytes, String etag, CatPhotoFrame frame) {
    public CatPhotoContent(byte[] bytes, String etag) {
        this(bytes, etag, null);
    }
}
