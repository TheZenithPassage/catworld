package com.allegaeon.catworld.controller;

import com.allegaeon.catworld.dto.CatProfileOptionDto;
import com.allegaeon.catworld.service.CatProfileOptionService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/cat-profile-options")
@RequiredArgsConstructor
public class CatProfileOptionController {
    private final CatProfileOptionService options;

    @GetMapping
    public Map<String, List<CatProfileOptionDto>> approvedOptions() {
        return options.approvedOptions();
    }
}
