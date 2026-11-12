package com.allegaeon.catworld.controller;

import com.allegaeon.catworld.dto.operations.OperationsTaskCreateRequest;
import com.allegaeon.catworld.dto.operations.OperationsTaskResolutionRequest;
import com.allegaeon.catworld.dto.operations.OperationsTaskResponse;
import com.allegaeon.catworld.service.OperationsTaskService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/operations/tasks")
@RequiredArgsConstructor
public class OperationsTaskController {

    private final OperationsTaskService service;

    @GetMapping
    public List<OperationsTaskResponse> list() {
        return service.list();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public OperationsTaskResponse create(@Valid @RequestBody OperationsTaskCreateRequest request) {
        return service.create(request);
    }

    @PutMapping("/{id}/resolution")
    public OperationsTaskResponse changeResolution(
            @PathVariable UUID id, @Valid @RequestBody OperationsTaskResolutionRequest request) {
        return service.changeResolution(id, request);
    }
}
