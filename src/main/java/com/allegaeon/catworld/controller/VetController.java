package com.allegaeon.catworld.controller;

import com.allegaeon.catworld.dto.VetRequestDTO;
import com.allegaeon.catworld.dto.VetResponseDTO;
import com.allegaeon.catworld.dto.lookup.LookupPageResponseDTO;
import com.allegaeon.catworld.dto.lookup.VetLookupOptionDTO;
import com.allegaeon.catworld.service.IVetService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RequiredArgsConstructor
@RestController
@RequestMapping("/api/vets")
public class VetController {

    private final IVetService vetService;

    @GetMapping
    public ResponseEntity<List<VetResponseDTO>> getAllVets() {
        return ResponseEntity.ok(vetService.getAllVets());
    }

    @GetMapping("/{id}")
    public ResponseEntity<VetResponseDTO> getVet(@PathVariable UUID id) {
        return ResponseEntity.ok(vetService.getVet(id));
    }

    @GetMapping("/search")
    public ResponseEntity<LookupPageResponseDTO<VetLookupOptionDTO>> searchVets(
            @RequestParam("q") String query,
            @RequestParam(defaultValue = "0") int page) {
        return ResponseEntity.ok(vetService.searchLookupOptions(query, page));
    }

    @GetMapping("/{id}/lookup-option")
    public ResponseEntity<VetLookupOptionDTO> getLookupOption(@PathVariable UUID id) {
        return ResponseEntity.ok(vetService.getLookupOption(id));
    }

    @PostMapping
    public ResponseEntity<VetResponseDTO> createVet(@Valid @RequestBody VetRequestDTO vetRequestDTO) {
        return ResponseEntity.status(HttpStatus.CREATED).body(vetService.createVet(vetRequestDTO));
    }

    @PutMapping("/{id}")
    public ResponseEntity<VetResponseDTO> updateVet(@PathVariable UUID id, @Valid @RequestBody VetRequestDTO vetRequestDTO) {
        return ResponseEntity.ok(vetService.updateVet(id, vetRequestDTO));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteVet(@PathVariable UUID id) {
        vetService.deleteVet(id);
    }

}
