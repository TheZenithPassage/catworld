package com.allegaeon.catworld.controller;

import com.allegaeon.catworld.dto.CatIntakeDtos.*;
import com.allegaeon.catworld.service.CatIntakeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/cat-intake")
public class CatIntakeAdminController {
    private final CatIntakeService intake;

    @PostMapping("/invitations")
    @ResponseStatus(HttpStatus.CREATED)
    public IssuedInvite issue(@Valid @RequestBody InviteRequest request) {
        return intake.issue(request);
    }

    @GetMapping("/invitations/active")
    public ResponseEntity<ActiveInvite> active(@RequestParam UUID ownerId) {
        return intake.active(ownerId).map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.noContent().build());
    }

    @DeleteMapping("/invitations/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void revoke(@PathVariable UUID id) {
        intake.revoke(id);
    }

    @GetMapping("/review")
    public List<ReviewRow> pending() {
        return intake.pending();
    }

    @GetMapping("/review/{id}")
    public ReviewDetail review(@PathVariable UUID id) {
        return intake.review(id);
    }

    @GetMapping(value = "/review/{id}/photos/{photoId}", produces = MediaType.IMAGE_JPEG_VALUE)
    public ResponseEntity<byte[]> photo(@PathVariable UUID id, @PathVariable UUID photoId) {
        return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(intake.reviewPhoto(id, photoId));
    }

    @PostMapping("/review/{id}/approve")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void approve(@PathVariable UUID id, @RequestBody Approval approval) {
        intake.approve(id, approval);
    }
}
