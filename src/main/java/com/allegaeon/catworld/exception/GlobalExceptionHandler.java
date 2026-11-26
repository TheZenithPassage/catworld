package com.allegaeon.catworld.exception;

import com.allegaeon.catworld.dto.VaccineConflictResponseDTO;
import com.allegaeon.catworld.dto.StalePricingConfirmationResponseDTO;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
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

    @ExceptionHandler(DemoPhotoUploadLimitException.class)
    public ResponseEntity<CatPhotoErrorResponse> handleDemoPhotoUploadLimit() {
        return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                .contentType(MediaType.APPLICATION_JSON)
                .body(new CatPhotoErrorResponse("DEMO_PHOTO_UPLOAD_LIMIT_REACHED"));
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

    @ExceptionHandler(CatIntakeVaccineDateException.class)
    public ResponseEntity<Map<String, Object>> handleIntakeVaccineDate(CatIntakeVaccineDateException exception) {
        return ResponseEntity.badRequest().body(Map.of("code", "CAT_INTAKE_VACCINE_DATE_OUT_OF_RANGE",
                "catIndex", exception.getCatIndex(), "field", exception.getField(),
                "vaccineDateRange", exception.getVaccineDateRange()));
    }

    @ExceptionHandler(StayEndBeforeActualArrivalException.class)
    public ResponseEntity<Map<String, String>> handleStayEndBeforeActualArrival() {
        return ResponseEntity.badRequest().body(Map.of("code", "STAY_END_BEFORE_ACTUAL_ARRIVAL"));
    }

    @ExceptionHandler(StayBookingConflictException.class)
    public ResponseEntity<Map<String, String>> handleStayBookingConflict(StayBookingConflictException exception) {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("code", "STAY_DATES_OVERLAP",
                "catName", exception.getCatName()));
    }

    @ExceptionHandler(ConflictException.class)
    public ResponseEntity<String> handleConflict(ConflictException exception) {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(exception.getMessage());
    }

    @ExceptionHandler(CatCatalogOptionInUseException.class)
    public ResponseEntity<Map<String, String>> handleCatalogOptionInUse() {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("code", "CAT_CATALOG_OPTION_IN_USE"));
    }

    @ExceptionHandler(CatCatalogTextConfirmationException.class)
    public ResponseEntity<Map<String, Object>> handleCatalogTextConfirmation(
            CatCatalogTextConfirmationException exception) {
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(Map.of("code", "CAT_CATALOG_TEXT_CONFIRMATION_REQUIRED", "fields", exception.getFields()));
    }

    @ExceptionHandler(CatIntakeCatalogChangedException.class)
    public ResponseEntity<Map<String, String>> handleIntakeCatalogChanged(CatIntakeCatalogChangedException exception) {
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(Map.of("code", "CAT_INTAKE_CATALOG_CHANGED", "field", exception.getField()));
    }

    @ExceptionHandler(StaleCatEditException.class)
    public ResponseEntity<Map<String, String>> handleStaleCatEdit(StaleCatEditException exception) {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("code", "CAT_EDIT_STALE"));
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
