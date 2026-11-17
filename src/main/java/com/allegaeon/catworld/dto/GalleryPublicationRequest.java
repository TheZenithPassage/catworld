package com.allegaeon.catworld.dto;

import com.allegaeon.catworld.model.GalleryCatKind;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record GalleryPublicationRequest(
        @NotBlank @Size(max = 100) String name,
        @Size(max = 320) String description,
        @NotNull GalleryCatKind kind
) {}
