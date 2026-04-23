package com.allegaeon.catworld.mapper;

import com.allegaeon.catworld.dto.StayRequestDTO;
import com.allegaeon.catworld.dto.StayResponseDTO;
import com.allegaeon.catworld.dto.StayUpdateDTO;
import com.allegaeon.catworld.model.Stay;
import com.allegaeon.catworld.model.StayCat;
import org.springframework.stereotype.Component;

import java.util.Set;
import java.util.stream.Collectors;

@Component
public class StayMapper {

    public StayResponseDTO toResponseDTO(Stay stay) {

        return StayResponseDTO.builder()
                .stayId(stay.getId())
                .startAt(stay.getStartAt())
                .endAt(stay.getEndAt())
                .cancelledAt(stay.getCancelledAt())
                .createdAt(stay.getCreatedAt())
                .updatedAt(stay.getUpdatedAt())
                .notes(stay.getNotes())
                .catIds(stay.getStayCats().stream().map(stayCat -> stayCat.getCat().getId()).collect(Collectors.toSet()))
                .build();

    }

    public Stay toEntity(StayRequestDTO stayRequestDTO) {

        return Stay.builder()
                .startAt(stayRequestDTO.getStartAt())
                .endAt(stayRequestDTO.getEndAt())
                .notes(stayRequestDTO.getNotes())
                .build();

    }

    public Stay updateEntity(Stay stay, StayUpdateDTO stayUpdateDTO) {

        stay.setStartAt(stayUpdateDTO.getStartAt());
        stay.setEndAt(stayUpdateDTO.getEndAt());
        stay.setNotes(stayUpdateDTO.getNotes());

        return stay;

    }

}
