package com.allegaeon.catworld.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Entity
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

    @OneToMany(mappedBy = "cat", fetch = FetchType.LAZY)
    private List<Stay> stays = new ArrayList<>();

}