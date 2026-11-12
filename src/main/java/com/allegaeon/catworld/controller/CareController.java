package com.allegaeon.catworld.controller;

import com.allegaeon.catworld.dto.care.CareDayDTO;
import com.allegaeon.catworld.dto.care.CareHistoryDTO;
import com.allegaeon.catworld.dto.care.CareRecordDTO;
import com.allegaeon.catworld.dto.care.CareRecordRequestDTO;
import com.allegaeon.catworld.dto.care.CareRoutineDTO;
import com.allegaeon.catworld.dto.care.CareRoutineRequestDTO;
import com.allegaeon.catworld.service.CareService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/care")
public class CareController {

    private final CareService care;

    @GetMapping("/day")
    public CareDayDTO day(@RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return care.day(date);
    }

    @GetMapping("/stays/{stayId}/records")
    public CareHistoryDTO history(@PathVariable UUID stayId) {
        return care.history(stayId);
    }

    @GetMapping("/routines")
    public List<CareRoutineDTO> routines() {
        return care.listRoutines();
    }

    @PostMapping("/routines")
    @ResponseStatus(HttpStatus.CREATED)
    public CareRoutineDTO addRoutine(@Valid @RequestBody CareRoutineRequestDTO request) {
        return care.addRoutine(request);
    }

    @PutMapping("/routines/{id}")
    public CareRoutineDTO configureRoutine(@PathVariable UUID id, @Valid @RequestBody CareRoutineRequestDTO request) {
        return care.configureRoutine(id, request);
    }

    @DeleteMapping("/routines/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deactivateRoutine(@PathVariable UUID id) {
        care.deactivateRoutine(id);
    }

    @PostMapping("/records")
    public CareRecordDTO record(@Valid @RequestBody CareRecordRequestDTO request) {
        return care.record(request);
    }

    @PostMapping("/records/{id}/annul")
    public CareRecordDTO annul(@PathVariable UUID id) {
        return care.annul(id);
    }
}
