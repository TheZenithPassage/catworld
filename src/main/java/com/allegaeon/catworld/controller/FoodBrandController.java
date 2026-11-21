package com.allegaeon.catworld.controller;

import com.allegaeon.catworld.dto.FoodBrandOption;
import com.allegaeon.catworld.dto.FoodVarietyOption;
import com.allegaeon.catworld.service.FoodBrandService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/food-brands")
public class FoodBrandController {
    private final FoodBrandService brands;

    @GetMapping
    public List<FoodBrandOption> approvedBrands() {
        return brands.approvedBrands();
    }

    @GetMapping("/varieties")
    public List<FoodVarietyOption> approvedVarieties() {
        return brands.approvedVarieties();
    }
}
