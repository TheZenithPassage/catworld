package com.allegaeon.catworld.model;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.util.UUID;

@Embeddable
@Getter
@EqualsAndHashCode
@AllArgsConstructor
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class StayActualMovementId implements Serializable {

    @Column(name = "stay_id", nullable = false)
    private UUID stayId;

    @Enumerated(EnumType.STRING)
    @Column(name = "movement_type", nullable = false, length = 9)
    private StayMovementType type;
}
