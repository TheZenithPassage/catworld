package com.allegaeon.catworld.dto;

import com.allegaeon.catworld.model.GalleryCatKind;

import java.time.Instant;
import java.util.UUID;

public record GalleryPublicationSummary(
        UUID id, String name, String description, GalleryCatKind kind, Instant publishedAt, long version
) {}
