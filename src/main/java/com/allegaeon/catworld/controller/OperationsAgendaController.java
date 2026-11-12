package com.allegaeon.catworld.controller;

import com.allegaeon.catworld.dto.OperationsAgendaDTO;
import com.allegaeon.catworld.service.OperationsAgendaService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/operations")
@RequiredArgsConstructor
public class OperationsAgendaController {

    private final OperationsAgendaService operationsAgendaService;

    @GetMapping("/agenda")
    public OperationsAgendaDTO getAgenda(
            @RequestParam(required = false) @DateTimeFormat(pattern = "uuuu-MM-dd") LocalDate date) {
        return operationsAgendaService.getAgenda(date);
    }
}
