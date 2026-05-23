package com.allegaeon.catworld.mapper;

import com.allegaeon.catworld.dto.StayCatSummaryDTO;
import com.allegaeon.catworld.dto.StayRequestDTO;
import com.allegaeon.catworld.dto.StayResponseDTO;
import com.allegaeon.catworld.dto.StayUpdateDTO;
import com.allegaeon.catworld.model.Stay;
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
                .ownerId(stay.getOwner().getId())
                .ownerName(stay.getOwner().getFullName())
                .cats(toCatSummaries(stay))
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

    private Set<StayCatSummaryDTO> toCatSummaries(Stay stay) {

        return stay.getStayCats().stream()
                .map(stayCat -> StayCatSummaryDTO.builder()
                        .catId(stayCat.getCat().getId())
                        .name(stayCat.getCat().getName())
                        .build())
                .collect(Collectors.toSet());

    }

}
