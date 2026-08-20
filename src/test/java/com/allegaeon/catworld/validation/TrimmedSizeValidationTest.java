package com.allegaeon.catworld.validation;

import com.allegaeon.catworld.dto.CatRequestDTO;
import com.allegaeon.catworld.dto.OwnerRequestDTO;
import com.allegaeon.catworld.dto.VetRequestDTO;
import com.allegaeon.catworld.model.Sex;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;
import jakarta.validation.constraints.NotBlank;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;

import java.lang.annotation.Annotation;
import java.time.LocalDate;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class TrimmedSizeValidationTest {

    private static ValidatorFactory validatorFactory;
    private static Validator validator;

    @BeforeAll
    static void createValidator() {
        validatorFactory = Validation.buildDefaultValidatorFactory();
        validator = validatorFactory.getValidator();
    }

    @AfterAll
    static void closeValidatorFactory() {
        validatorFactory.close();
    }

    @ParameterizedTest
    @MethodSource("entityNameCases")
    void validatesEntityNamesByTrimmedLengthWithoutChangingTheirValues(
            String value,
            Class<? extends Annotation> expectedConstraint
    ) {
        for (EntityNameTarget target : entityNameTargets(value)) {
            Set<ConstraintViolation<Object>> nameViolations = validator.validate(target.request()).stream()
                    .filter(violation -> violation.getPropertyPath().toString().equals(target.propertyName()))
                    .collect(Collectors.toSet());

            if (expectedConstraint == null) {
                assertTrue(nameViolations.isEmpty(), target.propertyName());
            } else {
                assertEquals(1, nameViolations.size(), target.propertyName());
                assertEquals(
                        expectedConstraint,
                        nameViolations.iterator().next().getConstraintDescriptor().getAnnotation().annotationType(),
                        target.propertyName()
                );
            }

            assertEquals(value, target.valueReader().apply(target.request()), target.propertyName());
        }
    }

    private static Stream<Arguments> entityNameCases() {
        return Stream.of(
                Arguments.of("   ", NotBlank.class),
                Arguments.of("  ab  ", TrimmedSize.class),
                Arguments.of("  abc  ", (Class<? extends Annotation>) null),
                Arguments.of(" " + "a".repeat(100) + " ", (Class<? extends Annotation>) null),
                Arguments.of(" " + "a".repeat(101) + " ", TrimmedSize.class)
        );
    }

    private static List<EntityNameTarget> entityNameTargets(String value) {
        return List.of(
                new EntityNameTarget(
                        OwnerRequestDTO.builder()
                                .fullName(value)
                                .primaryPhone("555-0100")
                                .build(),
                        "fullName",
                        request -> ((OwnerRequestDTO) request).getFullName()
                ),
                new EntityNameTarget(
                        CatRequestDTO.builder()
                                .name(value)
                                .birthDate(LocalDate.of(2020, 1, 1))
                                .sex(Sex.FEMALE)
                                .ownerId(UUID.fromString("00000000-0000-0000-0000-000000000001"))
                                .build(),
                        "name",
                        request -> ((CatRequestDTO) request).getName()
                ),
                new EntityNameTarget(
                        VetRequestDTO.builder()
                                .name(value)
                                .build(),
                        "name",
                        request -> ((VetRequestDTO) request).getName()
                )
        );
    }

    private record EntityNameTarget(
            Object request,
            String propertyName,
            Function<Object, String> valueReader
    ) {
    }
}
