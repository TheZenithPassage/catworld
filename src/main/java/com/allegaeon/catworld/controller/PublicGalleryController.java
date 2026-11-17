package com.allegaeon.catworld.controller;

import com.allegaeon.catworld.dto.PublicGalleryEntry;
import com.allegaeon.catworld.service.GalleryPublicationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.CacheControl;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/public-gallery")
public class PublicGalleryController {
    private final GalleryPublicationService gallery;

    @GetMapping
    public ResponseEntity<List<PublicGalleryEntry>> catalogue() {
        return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(gallery.publishedEntries());
    }

    @GetMapping(value = "/{id}/photo", produces = MediaType.IMAGE_JPEG_VALUE)
    public ResponseEntity<byte[]> photo(@PathVariable UUID id) {
        return gallery.publishedPhoto(id)
                .map(bytes -> ResponseEntity.ok().cacheControl(CacheControl.noStore())
                        .contentType(MediaType.IMAGE_JPEG).body(bytes))
                .orElseGet(() -> ResponseEntity.notFound().cacheControl(CacheControl.noStore()).build());
    }
}
