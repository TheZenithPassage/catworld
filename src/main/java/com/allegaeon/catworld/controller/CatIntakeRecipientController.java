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

import java.util.UUID;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/intake")
public class CatIntakeRecipientController {
    private final CatIntakeService intake;

    @GetMapping("/request")
    public RecipientForm form(@RequestHeader(name = HttpHeaders.AUTHORIZATION, required = false) String authorization) {
        return intake.form(authorization);
    }

    @GetMapping(value = "/photos/{id}", produces = MediaType.IMAGE_JPEG_VALUE)
    public byte[] photo(@PathVariable UUID id,
                        @RequestHeader(name = HttpHeaders.AUTHORIZATION, required = false) String authorization) {
        return intake.recipientPhoto(authorization, id);
    }

    @PostMapping(value = "/submissions", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void submit(@RequestHeader(HttpHeaders.AUTHORIZATION) String authorization,
                       @RequestPart("submission") Submission submission, MultipartHttpServletRequest request) {
        intake.submit(authorization, submission, request.getMultiFileMap());
    }
}
