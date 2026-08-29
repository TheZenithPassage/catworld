package com.allegaeon.catworld.model;

import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Builder
@Table(name = "vets")
public class Vet extends AuditableEntity {

    @Id
    @GeneratedValue(strategy= GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String name;

    private String address;
    private String phoneNumber;

    @Column(name = "registration_number", length = 100)
    private String registrationNumber;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "created_by_id", nullable = false, updatable = false)
    private UserAccount createdBy;

    @Builder.Default
    @OneToMany(mappedBy = "vet", fetch = FetchType.LAZY)
    private List<Cat> cats = new ArrayList<>();

}
