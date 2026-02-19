package com.allegaeon.catworld.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Entity
public class Vet extends AuditableEntity {

    @Id
    @GeneratedValue(strategy= GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String name;

    private String address;
    private String phoneNumber;

    @OneToMany(mappedBy = "vet", fetch = FetchType.LAZY)
    private List<Cat> cats = new ArrayList<>();

}
