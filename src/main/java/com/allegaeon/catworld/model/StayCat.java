package com.allegaeon.catworld.model;

import jakarta.persistence.*;
import lombok.*;

@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Builder
@Table(name = "stay_cat")
public class StayCat {

    @Builder.Default
    @EmbeddedId
    private StayCatId id = new StayCatId();

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @MapsId("stayId")
    @JoinColumn(name = "stay_id", nullable = false)
    private Stay stay;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @MapsId("catId")
    @JoinColumn(name = "cat_id", nullable = false)
    private Cat cat;

}
