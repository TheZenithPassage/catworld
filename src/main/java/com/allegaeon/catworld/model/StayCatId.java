package com.allegaeon.catworld.model;

import jakarta.persistence.Embeddable;
import lombok.*;

import java.io.Serializable;
import java.util.UUID;

@Embeddable
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode
public class StayCatId implements Serializable {

    private UUID stayId;
    private UUID catId;

}