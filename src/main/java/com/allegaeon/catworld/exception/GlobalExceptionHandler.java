package com.allegaeon.catworld.exception;

import com.allegaeon.catworld.dto.VaccineConflictResponseDTO;
import com.allegaeon.catworld.dto.StalePricingConfirmationResponseDTO;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import com.allegaeon.catworld.dto.CatPhotoErrorResponse;

import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(CatPhotoException.class)
    public ResponseEntity<CatPhotoErrorResponse> handleCatPhoto(CatPhotoException exception) {
        return ResponseEntity.badRequest().body(new CatPhotoErrorResponse(exception.getCode().name()));
    }

    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<CatPhotoErrorResponse> handleMultipartTooLarge(MaxUploadSizeExceededException exception) {
        return ResponseEntity.badRequest().body(new CatPhotoErrorResponse(
                CatPhotoErrorCode.CAT_PHOTO_FILE_TOO_LARGE.name()));
    }

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<String> handleNotFound(ResourceNotFoundException exception) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(exception.getMessage());
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, String>> handleMethodArgumentNotValid(MethodArgumentNotValidException exception) {
        Map<String, String> errors = new HashMap<>();

        for(FieldError error : exception.getBindingResult().getFieldErrors()) {
            errors.put(error.getField(), error.getDefaultMessage());
        }

        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errors);

    }

    @ExceptionHandler(BadRequestException.class)
    public ResponseEntity<String> handleBadRequest(BadRequestException exception) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(exception.getMessage());
    }

    @ExceptionHandler(ConflictException.class)
    public ResponseEntity<String> handleConflict(ConflictException exception) {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(exception.getMessage());
    }

    @ExceptionHandler(StalePricingConfirmationException.class)
    public ResponseEntity<StalePricingConfirmationResponseDTO> handleStalePricingConfirmation(
            StalePricingConfirmationException exception) {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(
                new StalePricingConfirmationResponseDTO(
                        StalePricingConfirmationResponseDTO.CODE));
    }

    @ExceptionHandler(VaccineConflictException.class)
    public ResponseEntity<VaccineConflictResponseDTO> handleVaccineConflict(VaccineConflictException exception) {
        VaccineConflictResponseDTO response = VaccineConflictResponseDTO.builder()
                .code(VaccineConflictResponseDTO.CODE)
                .violations(exception.getViolations())
                .build();

        return ResponseEntity.status(HttpStatus.CONFLICT).body(response);
    }

    @ExceptionHandler(ForbiddenException.class)
    public ResponseEntity<String> handleForbidden(ForbiddenException exception) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(exception.getMessage());
    }

}
