package com.allegaeon.catworld.controller;

import com.allegaeon.catworld.dto.DemoStatusResponseDTO;
import com.allegaeon.catworld.service.DemoResetService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.net.InetAddress;

@RestController
@RequestMapping("/api/demo")
@ConditionalOnProperty(name = "catworld.demo.enabled", havingValue = "true")
@RequiredArgsConstructor
public class DemoController {
    private static final String CLIENT_IP_HEADER = "X-CatWorld-Demo-Client-IP";

    private final DemoResetService resets;

    @GetMapping("/status")
    public DemoStatusResponseDTO getStatus(HttpServletRequest request) {
        return resets.getStatus(clientIp(request));
    }

    @PostMapping("/reset")
    public ResponseEntity<DemoStatusResponseDTO> requestReset(HttpServletRequest request) {
        var status = resets.requestReset(clientIp(request));
        HttpStatus code = switch (status.resetState()) {
            case QUEUED -> HttpStatus.ACCEPTED;
            case COOLDOWN, LIMIT_REACHED -> HttpStatus.TOO_MANY_REQUESTS;
            case CLEAN, AVAILABLE -> HttpStatus.OK;
        };
        return ResponseEntity.status(code).body(status);
    }

    private String clientIp(HttpServletRequest request) {
        // The demo gateway overwrites the header and is the only published API entry point.
        String forwarded = normalizeIp(request.getHeader(CLIENT_IP_HEADER));
        if (forwarded != null) {
            return forwarded;
        }
        String remote = normalizeIp(request.getRemoteAddr());
        return remote == null ? "unknown" : remote;
    }

    private String normalizeIp(String value) {
        if (value == null || value.length() > 45 || value.contains("%")) {
            return null;
        }
        try {
            return InetAddress.ofLiteral(value).getHostAddress();
        } catch (IllegalArgumentException exception) {
            return null;
        }
    }
}
