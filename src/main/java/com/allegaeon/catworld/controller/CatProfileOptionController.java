package com.allegaeon.catworld.controller;

import com.allegaeon.catworld.dto.CatProfileOptionDto;
import com.allegaeon.catworld.dto.ManagedCatProfileOption;
import com.allegaeon.catworld.service.CatProfileOptionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/cat-profile-options")
@RequiredArgsConstructor
public class CatProfileOptionController {
    private final CatProfileOptionService options;

    @GetMapping
    public Map<String, List<CatProfileOptionDto>> approvedOptions() {
        return options.approvedOptions();
    }

    @PostMapping
    public CatProfileOptionDto publish(@RequestBody Publication request) {
        return options.publish(request.field(), request.name(), request.brandId());
    }

    @GetMapping("/manage")
    public List<ManagedCatProfileOption> managedOptions() {
        return options.managedOptions();
    }

    @PatchMapping("/manage/{field}/{id}")
    public ManagedCatProfileOption changeOption(@PathVariable String field, @PathVariable UUID id,
                                                 @RequestBody Change request) {
        return options.changeOption(field, id, request.name(), request.active());
    }

    @DeleteMapping("/manage/{field}/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteOption(@PathVariable String field, @PathVariable UUID id) {
        options.deleteOption(field, id);
    }

    public record Change(String name, Boolean active) {}

    public record Publication(String field, String name, UUID brandId) {}
}
