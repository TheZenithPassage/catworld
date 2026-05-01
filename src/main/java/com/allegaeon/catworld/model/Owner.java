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
@Table(name = "owners")
public class Owner extends AuditableEntity{

    @Id
    @GeneratedValue(strategy= GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String fullName;
    private String address;

    @Column(nullable = false)
    private String primaryPhone;

    private String secondaryPhone;
    private String secondaryPhoneName;
    private String instagram;
    private String facebook;

    @Builder.Default
    @OneToMany(mappedBy = "owner", fetch = FetchType.LAZY)
    private List<Cat> cats = new ArrayList<>();

}
