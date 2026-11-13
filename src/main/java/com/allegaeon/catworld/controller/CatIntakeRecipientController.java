package com.allegaeon.catworld.controller;

import com.allegaeon.catworld.dto.CatIntakeDtos.RecipientForm;
import com.allegaeon.catworld.dto.CatIntakeDtos.Submission;
import com.allegaeon.catworld.service.CatIntakeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartHttpServletRequest;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/intake")
public class CatIntakeRecipientController {
    private final CatIntakeService intake;

    @GetMapping("/request")
    public RecipientForm form(@RequestHeader(name = HttpHeaders.AUTHORIZATION, required = false) String authorization) {
        return intake.form(authorization);
    }

    @PostMapping(value = "/submissions", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void submit(@RequestHeader(HttpHeaders.AUTHORIZATION) String authorization,
                       @RequestPart("submission") Submission submission, MultipartHttpServletRequest request) {
        intake.submit(authorization, submission, request.getMultiFileMap());
    }
}
