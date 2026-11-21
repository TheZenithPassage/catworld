package com.allegaeon.catworld.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.IdClass;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.io.Serializable;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.UUID;

@Entity
@Table(name = "stay_arrival_resets")
@IdClass(StayArrivalReset.Id.class)
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class StayArrivalReset {

    public record Id(UUID stayId, long movementRevision) implements Serializable {}

    @jakarta.persistence.Id
    private UUID stayId;
    @jakarta.persistence.Id
    private long movementRevision;

    @JdbcTypeCode(SqlTypes.LOCAL_DATE_TIME)
    private LocalDateTime occurredAtUtc;
    private UUID recordedById;
    private String recordedBy;
    private UUID correctedById;
    private String correctedBy;
    private Long version;

    @Column(nullable = false)
    private UUID resetById;
    @Column(nullable = false)
    private String resetBy;
    @JdbcTypeCode(SqlTypes.LOCAL_DATE_TIME)
    @Column(nullable = false)
    private LocalDateTime resetAtUtc;

    public StayArrivalReset(Stay stay, StayActualMovement arrival, UserAccount actor, Instant resetAt) {
        stayId = stay.getId();
        movementRevision = stay.getMovementRevision();
        if (arrival != null) {
            occurredAtUtc = arrival.getOccurredAtUtc();
            recordedById = arrival.getRecordedById();
            recordedBy = arrival.getRecordedBy();
            correctedById = arrival.getCorrectedById();
            correctedBy = arrival.getCorrectedBy();
            version = arrival.getVersion();
        }
        resetById = actor.getId();
        resetBy = actor.getUsername();
        resetAtUtc = LocalDateTime.ofInstant(resetAt, ZoneOffset.UTC);
    }
}
