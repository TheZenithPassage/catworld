package com.allegaeon.catworld.dto;

import lombok.*;

import java.util.UUID;

@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VetResponseDTO {

    private UUID id;
    private String name;
    private String address;
    private String phoneNumber;
    private String registrationNumber;
    private String notes;
    private boolean canDelete;

}
