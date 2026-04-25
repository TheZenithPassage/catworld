package com.allegaeon.catworld.controller;

import com.allegaeon.catworld.dto.StayRequestDTO;
import com.allegaeon.catworld.dto.StayResponseDTO;
import com.allegaeon.catworld.dto.StayUpdateDTO;
import com.allegaeon.catworld.service.IStayService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RequiredArgsConstructor
@RestController
@RequestMapping("/api/stays")
public class StayController {

    private final IStayService stayService;

    @GetMapping
    public ResponseEntity<List<StayResponseDTO>> getStays() {
        return ResponseEntity.ok(stayService.getAllStays());
    }

    @GetMapping("/{id}")
    public ResponseEntity<StayResponseDTO> getStay(@PathVariable UUID id) {
        return ResponseEntity.ok(stayService.getStay(id));
    }

    @PostMapping
    public ResponseEntity<StayResponseDTO> createStay(@Valid @RequestBody StayRequestDTO stayRequestDTO) {
        return ResponseEntity.status(HttpStatus.CREATED).body(stayService.createStay(stayRequestDTO));
    }

    @PutMapping("/{id}")
    public ResponseEntity<StayResponseDTO> updateStay(@PathVariable UUID id, @Valid @RequestBody StayUpdateDTO stayUpdateDTO) {
        return ResponseEntity.ok(stayService.updateStay(id, stayUpdateDTO));
    }

    @PatchMapping("/{id}/cancel")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void  cancelStay(@PathVariable UUID id) {
        stayService.cancelStay(id);
    }

}
