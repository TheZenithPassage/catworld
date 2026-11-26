package com.allegaeon.catworld.controller;

import com.allegaeon.catworld.dto.CatRequestDTO;
import com.allegaeon.catworld.dto.CatResponseDTO;
import com.allegaeon.catworld.dto.relationship.*;
import com.allegaeon.catworld.dto.lookup.*;
import com.allegaeon.catworld.dto.overview.*;
import com.allegaeon.catworld.service.DemoActivityService;
import com.allegaeon.catworld.service.ICatService;
import jakarta.validation.groups.Default;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.MediaType;
import org.springframework.http.HttpHeaders;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@RequiredArgsConstructor
@RestController
@RequestMapping("/api/cats")
public class CatController {

    private final ICatService catService;
    private final Optional<DemoActivityService> demoActivity;

    @GetMapping
    public ResponseEntity<List<CatResponseDTO>> getAllCats() {
        return ResponseEntity.ok(catService.getAllCats());
    }

    @GetMapping("/overview")
    public ResponseEntity<OverviewPage<CatOverviewItem>> getCatOverview(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(required = false) String q) {
        return ResponseEntity.ok(catService.getCatOverview(page, q));
    }

    @GetMapping("/{id}")
    public ResponseEntity<CatResponseDTO> getCat(@PathVariable UUID id) {
        return ResponseEntity.ok(catService.getCat(id));
    }

    @GetMapping("/search")
    public ResponseEntity<LookupPage<CatLookupItem>> searchCats(
            @RequestParam String q, @RequestParam(defaultValue = "0") int page) {
        return ResponseEntity.ok(catService.searchCats(q, page));
    }

    @GetMapping("/{id}/detail")
    public ResponseEntity<CatDetailResponse> getCatDetail(@PathVariable UUID id) {
        return ResponseEntity.ok(catService.getCatDetail(id));
    }

    @GetMapping("/{id}/stays")
    public ResponseEntity<RelationshipPage<StayRelationshipItem>> getCatStays(
            @PathVariable UUID id, @RequestParam(defaultValue = "0") int page) {
        return ResponseEntity.ok(catService.getCatStays(id, page));
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<CatResponseDTO> createCat(
            @Validated({Default.class, CatRequestDTO.Create.class}) @RequestPart("cat") CatRequestDTO catRequestDTO,
            @RequestPart(value = "photo", required = false) MultipartFile photo,
            @RequestPart(value = "informationalPhotos", required = false) List<MultipartFile> informationalPhotos) {
        demoActivity.ifPresent(activity -> activity.reservePhotoUpload(photo, informationalPhotos));
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(catService.createCat(catRequestDTO, photo, informationalPhotos));
    }

    @PutMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<CatResponseDTO> updateCat(@PathVariable UUID id,
            @Validated({Default.class, CatRequestDTO.Update.class}) @RequestPart("cat") CatRequestDTO catRequestDTO,
            @RequestPart(value = "photo", required = false) MultipartFile photo,
            @RequestPart(value = "informationalPhotos", required = false) List<MultipartFile> informationalPhotos,
            @RequestParam(defaultValue = "false") boolean removePhoto) {
        demoActivity.ifPresent(activity -> activity.reservePhotoUpload(photo, informationalPhotos));
        return ResponseEntity.ok(catService.updateCat(id, catRequestDTO, photo, removePhoto, informationalPhotos));
    }

    @PostMapping(value = "/photo-preview", consumes = MediaType.MULTIPART_FORM_DATA_VALUE,
            produces = MediaType.IMAGE_JPEG_VALUE)
    public ResponseEntity<byte[]> previewPhoto(@RequestPart("photo") MultipartFile photo) {
        demoActivity.ifPresent(activity -> activity.reservePhotoUpload(photo, List.of()));
        return ResponseEntity.ok().header(HttpHeaders.CACHE_CONTROL, "no-store").body(catService.previewPhoto(photo));
    }

    @GetMapping(value = "/{id}/photo", produces = MediaType.IMAGE_JPEG_VALUE)
    public ResponseEntity<byte[]> getPhoto(@PathVariable UUID id,
            @RequestHeader(value = HttpHeaders.IF_NONE_MATCH, required = false) String ifNoneMatch) {
        var photo = catService.getPhoto(id);
        var headers = new HttpHeaders();
        headers.setETag(photo.etag());
        if (photo.frame() != null) {
            headers.set("X-Cat-Photo-Frame", "%d,%d,%d".formatted(
                    photo.frame().frameX(), photo.frame().frameY(), photo.frame().frameZoom()));
            headers.add(HttpHeaders.ACCESS_CONTROL_EXPOSE_HEADERS, "X-Cat-Photo-Frame");
        }
        headers.setCacheControl("private, no-cache");
        if (matches(ifNoneMatch, photo.etag())) return new ResponseEntity<>(null, headers, HttpStatus.NOT_MODIFIED);
        return new ResponseEntity<>(photo.bytes(), headers, HttpStatus.OK);
    }

    private boolean matches(String value, String etag) {
        if (value == null) return false;
        String strong = etag.substring(1, etag.length() - 1);
        for (String candidate : value.split(",")) {
            candidate = candidate.trim();
            if (candidate.equals("*")) return true;
            if (candidate.startsWith("W/")) candidate = candidate.substring(2).trim();
            if (candidate.equals(etag) || candidate.equals(strong)) return true;
        }
        return false;
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteCat(@PathVariable UUID id) {
        catService.deleteCat(id);
    }

}
