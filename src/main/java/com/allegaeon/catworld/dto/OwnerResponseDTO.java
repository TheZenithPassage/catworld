package com.allegaeon.catworld.dto;

import lombok.*;

import java.util.UUID;

@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OwnerResponseDTO {

    private UUID id;
    private String fullName;
    private String address;
    private String primaryPhone;
    private String secondaryPhone;
    private String secondaryPhoneName;
    private String instagram;
    private String facebook;

}
