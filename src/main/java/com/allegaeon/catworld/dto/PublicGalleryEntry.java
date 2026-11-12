package com.allegaeon.catworld.dto;

import com.allegaeon.catworld.model.GalleryCatKind;

import java.util.UUID;

public record PublicGalleryEntry(
        UUID id, String name, String description, GalleryCatKind kind, int width, int height
) {}
