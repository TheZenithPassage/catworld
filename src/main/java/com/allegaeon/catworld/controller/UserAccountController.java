package com.allegaeon.catworld.controller;

import com.allegaeon.catworld.dto.lookup.*;
import org.springframework.web.bind.annotation.RequestParam;

import com.allegaeon.catworld.dto.UserAccountCreateRequestDTO;
import com.allegaeon.catworld.dto.UserAccountEnabledRequestDTO;
import com.allegaeon.catworld.dto.UserAccountResponseDTO;
import com.allegaeon.catworld.dto.UserAccountRoleRequestDTO;
import com.allegaeon.catworld.service.IUserAccountService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
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
import java.util.UUID;

@RequiredArgsConstructor
@RestController
@RequestMapping("/api/users")
public class UserAccountController {

    private final IUserAccountService userAccountService;

    @GetMapping("/search")
    public LookupPage<AccountLookupItem> searchUsers(@RequestParam String q,
            @RequestParam(defaultValue = "0") int page) {
        return userAccountService.searchUsers(q, page);
    }

    @GetMapping("/{id}/lookup")
    public AccountLookupItem getUserLookup(@PathVariable UUID id) {
        return userAccountService.getUserLookup(id);
    }

    @GetMapping
    public ResponseEntity<List<UserAccountResponseDTO>> getAllUsers() {
        return ResponseEntity.ok(userAccountService.getAllUsers());
    }

    @PostMapping
    public ResponseEntity<UserAccountResponseDTO> createUser(
            @Valid @RequestBody UserAccountCreateRequestDTO request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(userAccountService.createUser(request));
    }

    @PatchMapping("/{id}/role")
    public ResponseEntity<UserAccountResponseDTO> changeRole(
            @PathVariable UUID id,
            @Valid @RequestBody UserAccountRoleRequestDTO request) {
        return ResponseEntity.ok(userAccountService.changeRole(id, request.getRole()));
    }

    @PatchMapping("/{id}/enabled")
    public ResponseEntity<UserAccountResponseDTO> changeEnabled(
            @PathVariable UUID id,
            @Valid @RequestBody UserAccountEnabledRequestDTO request) {
        return ResponseEntity.ok(userAccountService.changeEnabled(id, request.getEnabled()));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteUser(@PathVariable UUID id) {
        userAccountService.deleteUser(id);
    }
}
