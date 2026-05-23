package com.allegaeon.catworld.dto;

import lombok.*;

import java.util.UUID;

@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StayCatSummaryDTO {

    private UUID catId;
    private String name;

}
