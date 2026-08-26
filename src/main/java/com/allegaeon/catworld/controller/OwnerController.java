package com.allegaeon.catworld.controller;

import com.allegaeon.catworld.dto.OwnerRequestDTO;
import com.allegaeon.catworld.dto.OwnerResponseDTO;
import com.allegaeon.catworld.dto.relationship.*;
import com.allegaeon.catworld.dto.lookup.*;
import com.allegaeon.catworld.service.IOwnerService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RequiredArgsConstructor
@RestController
@RequestMapping("/api/owners")
public class OwnerController {

    private final IOwnerService ownerService;

    @GetMapping
    public ResponseEntity<List<OwnerResponseDTO>> getAllOwners() {
        return ResponseEntity.ok(ownerService.getAllOwners());
    }

    @GetMapping("/{id}")
    public ResponseEntity<OwnerResponseDTO> getOwner(@PathVariable UUID id) {
        return ResponseEntity.ok(ownerService.getOwner(id));
    }

    @GetMapping("/search")
    public ResponseEntity<LookupPage<OwnerLookupItem>> searchOwners(
            @RequestParam String q, @RequestParam(defaultValue = "0") int page) {
        return ResponseEntity.ok(ownerService.searchOwners(q, page));
    }

    @GetMapping("/{id}/lookup")
    public ResponseEntity<OwnerLookupItem> getOwnerLookup(@PathVariable UUID id) {
        return ResponseEntity.ok(ownerService.getOwnerLookup(id));
    }

    @GetMapping("/{id}/detail")
    public ResponseEntity<OwnerDetailResponse> getOwnerDetail(@PathVariable UUID id) {
        return ResponseEntity.ok(ownerService.getOwnerDetail(id));
    }

    @GetMapping("/{id}/cats")
    public ResponseEntity<RelationshipPage<CatRelationshipItem>> getOwnerCats(
            @PathVariable UUID id, @RequestParam(defaultValue = "0") int page) {
        return ResponseEntity.ok(ownerService.getOwnerCats(id, page));
    }

    @GetMapping("/{id}/stays")
    public ResponseEntity<RelationshipPage<StayRelationshipItem>> getOwnerStays(
            @PathVariable UUID id, @RequestParam(defaultValue = "0") int page) {
        return ResponseEntity.ok(ownerService.getOwnerStays(id, page));
    }

    @PostMapping
    public ResponseEntity<OwnerResponseDTO> createOwner(@Valid @RequestBody OwnerRequestDTO ownerRequestDTO) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ownerService.createOwner(ownerRequestDTO));
    }

    @PutMapping("/{id}")
    public ResponseEntity<OwnerResponseDTO> updateOwner(@PathVariable UUID id, @Valid @RequestBody OwnerRequestDTO ownerRequestDTO) {
        return ResponseEntity.ok(ownerService.updateOwner(id, ownerRequestDTO));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteOwner(@PathVariable UUID id) {
        ownerService.deleteOwner(id);
    }

}
