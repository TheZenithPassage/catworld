package com.allegaeon.catworld.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "care_records", uniqueConstraints = @UniqueConstraint(
        name = "uk_care_records_active_slot",
        columnNames = {"stay_id", "cat_id", "business_date", "routine_id", "active_slot"}
))
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class CareRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "stay_id", nullable = false, updatable = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    private Stay stay;

    @Column(nullable = false, updatable = false)
    private UUID catId;

    @Column(nullable = false, updatable = false)
    private String catName;

    @Column(nullable = false, updatable = false)
    private LocalDate businessDate;

    @Column(nullable = false, updatable = false)
    private Instant recordedAt;

    @Column(updatable = false)
    private UUID routineId;

    @Column(length = 100, updatable = false)
    private String routineName;

    @Enumerated(EnumType.STRING)
    @Column(length = 10, updatable = false)
    private CareRoutineSeed routineSeedKey;

    @Enumerated(EnumType.STRING)
    @Column(length = 10, updatable = false)
    private CareMode mode;

    @Enumerated(EnumType.STRING)
    @Column(length = 10, updatable = false)
    private CareShift shift;

    @Column(length = 10)
    private String activeSlot;

    @Column(columnDefinition = "TEXT", updatable = false)
    private String note;

    @Column(nullable = false, updatable = false)
    private UUID authorId;

    @Column(nullable = false, updatable = false)
    private String authorUsername;

    private Instant annulledAt;
    private UUID annulledById;
    private String annulledByUsername;

    public CareRecord(Stay stay, Cat cat, LocalDate businessDate, Instant recordedAt,
                      CareRoutine routine, CareShift shift, String note, UserAccount author) {
        this.stay = stay;
        this.catId = cat.getId();
        this.catName = cat.getName();
        this.businessDate = businessDate;
        this.recordedAt = recordedAt;
        this.note = note;
        this.authorId = author.getId();
        this.authorUsername = author.getUsername();
        if (routine != null) {
            routineId = routine.getId();
            routineName = routine.getName();
            routineSeedKey = routine.getSeedKey();
            mode = routine.getMode();
            this.shift = shift;
            activeSlot = slotFor(mode, shift);
        }
    }

    public static String slotFor(CareMode mode, CareShift shift) {
        return switch (mode) {
            case DAILY -> CareMode.DAILY.name();
            case SHIFT -> shift.name();
            case EVENT -> null;
        };
    }

    public void annul(Instant time, UserAccount actor) {
        if (annulledAt == null) {
            annulledAt = time;
            annulledById = actor.getId();
            annulledByUsername = actor.getUsername();
            activeSlot = null;
        }
    }
}
