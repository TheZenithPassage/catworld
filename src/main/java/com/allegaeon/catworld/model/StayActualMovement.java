package com.allegaeon.catworld.model;

import jakarta.persistence.Column;
import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.UUID;

@Entity
@Table(name = "stay_actual_movements")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class StayActualMovement {

    @EmbeddedId
    private StayActualMovementId id;

    // Bind the UTC calendar fields directly to DATETIME, independently of JDBC and JVM time zones.
    @JdbcTypeCode(SqlTypes.LOCAL_DATE_TIME)
    @Column(nullable = false)
    private LocalDateTime occurredAtUtc;

    @Column(nullable = false, updatable = false)
    private UUID recordedById;

    @Column(nullable = false, updatable = false)
    private String recordedBy;

    private UUID correctedById;
    private String correctedBy;

    @Version
    @Column(nullable = false)
    private Long version;

    public StayActualMovement(StayActualMovementId id, Instant occurredAt, UserAccount recorder) {
        this.id = id;
        this.occurredAtUtc = LocalDateTime.ofInstant(occurredAt, ZoneOffset.UTC);
        this.recordedById = recorder.getId();
        this.recordedBy = recorder.getUsername();
    }

    public Instant occurredAt() {
        return occurredAtUtc.toInstant(ZoneOffset.UTC);
    }

    // Revision zero in the API means the movement does not exist yet.
    public long revision() {
        return version + 1;
    }

    public void correct(Instant occurredAt, UserAccount corrector) {
        this.occurredAtUtc = LocalDateTime.ofInstant(occurredAt, ZoneOffset.UTC);
        this.correctedById = corrector.getId();
        this.correctedBy = corrector.getUsername();
    }
}
