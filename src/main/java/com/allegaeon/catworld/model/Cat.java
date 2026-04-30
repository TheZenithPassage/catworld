package com.allegaeon.catworld.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Builder
@Table(name = "cats")
public class Cat extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private LocalDate birthDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Sex sex;

    private String breed;
    private String coat;
    private String color;
    private String foodBrand;
    private String litterBrand;
    private String personality;

    private String lastInternalDewormerName;
    private LocalDate lastInternalDewormingDate;
    private String lastExternalDewormerName;
    private LocalDate lastExternalDewormingDate;
    private LocalDate lastTripleFelineDate;
    private LocalDate lastRabiesDate;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "owner_id", nullable = false)
    private Owner owner;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vet_id")
    private Vet vet;

    @Builder.Default
    @OneToMany(fetch = FetchType.LAZY, mappedBy = "cat")
    private Set<StayCat> stayCats = new HashSet<>();

}