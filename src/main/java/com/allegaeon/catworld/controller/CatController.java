package com.allegaeon.catworld.controller;

import com.allegaeon.catworld.dto.CatRequestDTO;
import com.allegaeon.catworld.dto.CatResponseDTO;
import com.allegaeon.catworld.dto.lookup.CatLookupOptionDTO;
import com.allegaeon.catworld.dto.lookup.LookupPageResponseDTO;
import com.allegaeon.catworld.service.ICatService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RequiredArgsConstructor
@RestController
@RequestMapping("/api/cats")
public class CatController {

    private final ICatService catService;

    @GetMapping
    public ResponseEntity<List<CatResponseDTO>> getAllCats() {
        return ResponseEntity.ok(catService.getAllCats());
    }

    @GetMapping("/search")
    public ResponseEntity<LookupPageResponseDTO<CatLookupOptionDTO>> searchLookupOptions(
            @RequestParam("q") String query,
            @RequestParam(defaultValue = "0") int page) {
        return ResponseEntity.ok(catService.searchLookupOptions(query, page));
    }

    @GetMapping("/{id}/lookup-option")
    public ResponseEntity<CatLookupOptionDTO> getLookupOption(@PathVariable UUID id) {
        return ResponseEntity.ok(catService.getLookupOption(id));
    }

    @GetMapping("/{id}")
    public ResponseEntity<CatResponseDTO> getCat(@PathVariable UUID id) {
        return ResponseEntity.ok(catService.getCat(id));
    }

    @PostMapping
    public ResponseEntity<CatResponseDTO> createCat(@Valid @RequestBody CatRequestDTO catRequestDTO) {
        return ResponseEntity.status(HttpStatus.CREATED).body(catService.createCat(catRequestDTO));
    }

    @PutMapping("/{id}")
    public ResponseEntity<CatResponseDTO> updateCat(@PathVariable UUID id, @Valid @RequestBody CatRequestDTO catRequestDTO) {
        return ResponseEntity.ok(catService.updateCat(id, catRequestDTO));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteCat(@PathVariable UUID id) {
        catService.deleteCat(id);
    }

}
