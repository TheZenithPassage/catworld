package com.allegaeon.catworld.service;

public record NormalizedCatPhoto(byte[] bytes, int width, int height, String sha256) {
}
