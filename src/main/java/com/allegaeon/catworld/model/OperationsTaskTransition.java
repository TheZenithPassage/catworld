package com.allegaeon.catworld.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.Immutable;

import java.time.Instant;
import java.util.UUID;

@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
@Immutable
@Entity
@Table(
        name = "operations_task_transitions",
        uniqueConstraints = @UniqueConstraint(columnNames = {"task_id", "revision"})
)
public class OperationsTaskTransition {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "task_id", nullable = false)
    private OperationsTask task;

    @Column(nullable = false)
    private long revision;

    @Column(nullable = false)
    private boolean resolved;

    @Column(nullable = false)
    private UUID actorId;

    @Column(nullable = false)
    private String actorUsername;

    @Column(nullable = false)
    private Instant occurredAt;
}
