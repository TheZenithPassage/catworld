package com.allegaeon.catworld.controller;

import com.allegaeon.catworld.dto.GalleryPublicationRequest;
import com.allegaeon.catworld.dto.GalleryPublicationSummary;
import com.allegaeon.catworld.service.GalleryPublicationService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.RequiredArgsConstructor;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/gallery-publications")
public class GalleryPublicationController {
    private final GalleryPublicationService gallery;

    @GetMapping
    public List<GalleryPublicationSummary> list() {
        return gallery.draftsAndPublications();
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    public GalleryPublicationSummary create(
            @Valid @RequestPart("publication") GalleryPublicationRequest request,
            @RequestPart("photo") MultipartFile photo) {
        return gallery.create(request, photo);
    }

    @PutMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public GalleryPublicationSummary update(
            @PathVariable UUID id,
            @Valid @RequestPart("publication") GalleryPublicationRequest request,
            @RequestPart(value = "photo", required = false) MultipartFile photo) {
        return gallery.update(id, request, photo);
    }

    @PostMapping("/{id}/publish")
    public GalleryPublicationSummary publish(@PathVariable UUID id, @Valid @RequestBody PublishRequest request) {
        return gallery.publish(id, request.version(), request.guestPermissionConfirmed());
    }

    @PostMapping("/{id}/hide")
    public GalleryPublicationSummary hide(@PathVariable UUID id) {
        return gallery.hide(id);
    }

    @GetMapping(value = "/{id}/photo", produces = MediaType.IMAGE_JPEG_VALUE)
    public ResponseEntity<byte[]> preview(@PathVariable UUID id) {
        return ResponseEntity.ok().cacheControl(CacheControl.noStore())
                .contentType(MediaType.IMAGE_JPEG).body(gallery.previewPhoto(id));
    }

    public record PublishRequest(@NotNull Long version, boolean guestPermissionConfirmed) {}
}
