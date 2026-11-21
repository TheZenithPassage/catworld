package com.allegaeon.catworld.controller;

import com.allegaeon.catworld.dto.CatInformationalPhotoSummary;
import com.allegaeon.catworld.service.CatInformationalPhotoService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/cats/{catId}/informational-photos")
public class CatInformationalPhotoController {
    private final CatInformationalPhotoService photos;

    @GetMapping
    public List<CatInformationalPhotoSummary> list(@PathVariable UUID catId) {
        return photos.list(catId);
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    public CatInformationalPhotoSummary add(@PathVariable UUID catId, @RequestPart("photo") MultipartFile photo) {
        return photos.add(catId, photo);
    }

    @GetMapping(value = "/{photoId}", produces = MediaType.IMAGE_JPEG_VALUE)
    public ResponseEntity<byte[]> content(@PathVariable UUID catId, @PathVariable UUID photoId) {
        return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(photos.content(catId, photoId));
    }

    @DeleteMapping("/{photoId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable UUID catId, @PathVariable UUID photoId) {
        photos.delete(catId, photoId);
    }
}
