package com.allegaeon.catworld.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Entity
@Table(name = "care_routines")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class CareRoutine {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, length = 100)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private CareMode mode;

    @Enumerated(EnumType.STRING)
    @Column(length = 10, unique = true)
    private CareRoutineSeed seedKey;

    @Column(nullable = false)
    private boolean active = true;

    public CareRoutine(String name, CareMode mode) {
        this.name = name;
        this.mode = mode;
    }

    public void configure(String name, CareMode mode) {
        if (!this.name.equals(name)) {
            seedKey = null;
        }
        this.name = name;
        this.mode = mode;
    }

    public void deactivate() {
        active = false;
    }
}
