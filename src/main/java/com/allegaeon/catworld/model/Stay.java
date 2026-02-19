package com.allegaeon.catworld.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Entity
public class Stay extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private LocalDateTime startAt;

    @Column(nullable = false)
    private LocalDateTime endAt;

    private LocalDateTime cancelledAt;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "cat_id", nullable = false)
    private Cat cat;

    @Transient
    public StayStatus getStatus() {
        if (cancelledAt != null) return StayStatus.CANCELLED;

        LocalDateTime now = LocalDateTime.now();

        if (now.isBefore(startAt)) return StayStatus.RESERVED;
        if (now.isBefore(endAt)) return StayStatus.CHECKED_IN;
        return StayStatus.CHECKED_OUT;
    }

}
