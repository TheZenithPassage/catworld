package com.allegaeon.catworld.service;

import com.allegaeon.catworld.dto.StayRequestDTO;
import com.allegaeon.catworld.dto.StayResponseDTO;
import com.allegaeon.catworld.dto.StayUpdateDTO;
import com.allegaeon.catworld.exception.BadRequestException;
import com.allegaeon.catworld.exception.ConflictException;
import com.allegaeon.catworld.exception.ResourceNotFoundException;
import com.allegaeon.catworld.mapper.StayMapper;
import com.allegaeon.catworld.model.Cat;
import com.allegaeon.catworld.model.Owner;
import com.allegaeon.catworld.model.Stay;
import com.allegaeon.catworld.model.StayCat;
import com.allegaeon.catworld.repository.CatRepository;
import com.allegaeon.catworld.repository.StayRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@RequiredArgsConstructor
@Service
public class StayService implements IStayService {

    private final StayRepository stayRepository;
    private final StayMapper stayMapper;
    private final CatRepository catRepository;

    @Override
    public List<StayResponseDTO> getAllStays() {
        return stayRepository.findAll().stream().map(stayMapper::toResponseDTO).toList();
    }

    @Override
    public StayResponseDTO getStay(UUID stayId) {
        return stayMapper.toResponseDTO(getStayEntity(stayId));
    }

    @Override
    @Transactional
    public StayResponseDTO createStay(StayRequestDTO stayRequestDTO) {

        if(!(stayRequestDTO.getEndAt().isAfter(stayRequestDTO.getStartAt()))) throw new BadRequestException("End time must be after start time");

        Stay stay = stayMapper.toEntity(stayRequestDTO);

        Set<StayCat> stayCats = new HashSet<>();
        Owner owner = null;

        for(UUID catId : stayRequestDTO.getCatIds()) {

            Cat cat = getCatEntity(catId);

            if(hasOverBooking(stayRequestDTO.getStartAt(), stayRequestDTO.getEndAt(), cat, null)) throw new ConflictException("There's already a booking for " + cat.getName() + " in the selected dates");

            if(owner == null) {
                owner = cat.getOwner();
            } else if(!(cat.getOwner().getId().equals(owner.getId()))) {
                throw new BadRequestException("Owner must be the same for all the cats");
            }

            stayCats.add(StayCat.builder()
                    .stay(stay)
                    .cat(cat)
                    .build());
        }

        stay.setOwner(owner);
        stay.setStayCats(stayCats);

        return stayMapper.toResponseDTO(stayRepository.save(stay));

    }

    @Override
    @Transactional
    public StayResponseDTO updateStay(UUID stayId, StayUpdateDTO stayUpdateDTO) {

        if(!(stayUpdateDTO.getEndAt().isAfter(stayUpdateDTO.getStartAt()))) throw new BadRequestException("End time must be after start time");

        Stay stay = stayMapper.updateEntity(getStayEntity(stayId), stayUpdateDTO);

        for(Cat cat : stay.getStayCats().stream().map(StayCat::getCat).toList()) {
            if(hasOverBooking(stayUpdateDTO.getStartAt(), stayUpdateDTO.getEndAt(), cat, stayId)) throw new ConflictException("There's already a booking for " + cat.getName() + " in the selected dates");
        }

        return stayMapper.toResponseDTO(stayRepository.save(stay));

    }

    private Stay getStayEntity(UUID stayId) {
        return stayRepository.findById(stayId)
                .orElseThrow(() -> new ResourceNotFoundException("Stay", stayId));
    }

    private Cat getCatEntity(UUID id) {
        return catRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Cat", id));
    }

    private boolean hasOverBooking(LocalDateTime startAt, LocalDateTime endAt, Cat cat, UUID stayId) {

        Set<StayCat> catStays = cat.getStayCats();

        for(StayCat stayCat : catStays) {

            Stay existingStay = stayCat.getStay();

            if(existingStay.getCancelledAt() != null || existingStay.getId().equals(stayId)) continue;

            if(endAt.isAfter(existingStay.getStartAt()) && startAt.isBefore(existingStay.getEndAt())) return true;
        }
        return false;
    }

}
