package com.allegaeon.catworld.controller;

import com.allegaeon.catworld.dto.OwnerRequestDTO;
import com.allegaeon.catworld.dto.OwnerResponseDTO;
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
