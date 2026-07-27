package com.allegaeon.catworld.service;

import com.allegaeon.catworld.dto.StayRequestDTO;
import com.allegaeon.catworld.dto.StayResponseDTO;
import com.allegaeon.catworld.dto.StayUpdateDTO;
import com.allegaeon.catworld.dto.VaccineConflictReason;
import com.allegaeon.catworld.dto.VaccineConflictViolationDTO;
import com.allegaeon.catworld.dto.VaccineType;
import com.allegaeon.catworld.exception.BadRequestException;
import com.allegaeon.catworld.exception.ConflictException;
import com.allegaeon.catworld.exception.ResourceNotFoundException;
import com.allegaeon.catworld.exception.VaccineConflictException;
import com.allegaeon.catworld.mapper.StayMapper;
import com.allegaeon.catworld.model.Cat;
import com.allegaeon.catworld.model.Owner;
import com.allegaeon.catworld.model.Stay;
import com.allegaeon.catworld.model.StayCat;
import com.allegaeon.catworld.model.UserAccount;
import com.allegaeon.catworld.model.UserRole;
import com.allegaeon.catworld.repository.CatRepository;
import com.allegaeon.catworld.repository.StayRepository;
import com.allegaeon.catworld.security.CurrentUserAccountService;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
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
    private final CurrentUserAccountService currentUserAccountService;
    private final DeletionAuthorizationPolicy deletionAuthorizationPolicy;

    @Override
    public List<StayResponseDTO> getAllStays() {
        return stayRepository.findAll().stream().map(this::toResponseDTO).toList();
    }

    @Override
    public StayResponseDTO getStay(UUID stayId) {
        return toResponseDTO(getStayEntity(stayId));
    }

    @Override
    @Transactional
    public StayResponseDTO createStay(StayRequestDTO stayRequestDTO) {

        validateEndDateIsAfterStartDate(stayRequestDTO.getStartAt(), stayRequestDTO.getEndAt());

        Stay stay = stayMapper.toEntity(stayRequestDTO);

        Set<StayCat> stayCats = new HashSet<>();
        List<Cat> cats = new ArrayList<>();
        Owner owner = null;

        for(UUID catId : stayRequestDTO.getCatIds()) {

            Cat cat = getCatEntity(catId);
            cats.add(cat);

            if(owner == null) {
                owner = cat.getOwner();
            } else if(!(cat.getOwner().getId().equals(owner.getId()))) {
                throw new BadRequestException("Owner must be the same for all the cats");
            }

            if(hasOverBooking(stayRequestDTO.getStartAt(), stayRequestDTO.getEndAt(), cat, null)) throw new ConflictException("There's already a booking for " + cat.getName() + " in the selected dates");

            stayCats.add(StayCat.builder()
                    .stay(stay)
                    .cat(cat)
                    .build());
        }

        UserAccount currentUser = currentUserAccountService.getCurrentUserAccount();
        validateVaccineCoverage(
                cats,
                stayRequestDTO.getEndAt(),
                stayRequestDTO.isOverrideVaccineConflicts(),
                currentUser);

        stay.setOwner(owner);
        stay.setStayCats(stayCats);
        stay.setCreatedBy(currentUser);

        return toResponseDTO(stayRepository.save(stay));

    }

    @Override
    @Transactional
    public StayResponseDTO updateStay(UUID stayId, StayUpdateDTO stayUpdateDTO) {

        validateEndDateIsAfterStartDate(stayUpdateDTO.getStartAt(), stayUpdateDTO.getEndAt());
        Stay stay = getStayEntity(stayId);
        validateStayCanBeModified(stay);
        boolean extendsStay = stayUpdateDTO.getEndAt().isAfter(stay.getEndAt());

        stay = stayMapper.updateEntity(stay, stayUpdateDTO);

        List<Cat> cats = stay.getStayCats().stream().map(StayCat::getCat).toList();

        for(Cat cat : cats) {
            if(hasOverBooking(stayUpdateDTO.getStartAt(), stayUpdateDTO.getEndAt(), cat, stayId)) throw new ConflictException("There's already a booking for " + cat.getName() + " in the selected dates");
        }

        if (extendsStay) {
            List<VaccineConflictViolationDTO> vaccineConflicts = findVaccineConflicts(cats, stayUpdateDTO.getEndAt());
            if (!vaccineConflicts.isEmpty()) {
                validateVaccineOverride(
                        vaccineConflicts,
                        stayUpdateDTO.isOverrideVaccineConflicts(),
                        currentUserAccountService.getCurrentUserAccount());
            }
        }

        return toResponseDTO(stayRepository.save(stay));

    }

    @Override
    @Transactional
    public void cancelStay(UUID stayId) {

        Stay stay = getStayEntity(stayId);
        validateStayCanBeModified(stay);

        stay.setCancelledAt(LocalDateTime.now());

    }

    @Override
    @Transactional
    public void deleteStay(UUID stayId) {

        Stay stay = getStayEntity(stayId);
        deletionAuthorizationPolicy.authorize(stay.getCreatedBy(), stay.getCreatedAt());

        try {
            stayRepository.delete(stay);
            stayRepository.flush();
        } catch (DataIntegrityViolationException | OptimisticLockingFailureException exception) {
            throw new ConflictException("Stay cannot be deleted because of a data conflict");
        }

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

        for(StayCat stayCat : cat.getStayCats()) {
            Stay existingStay = stayCat.getStay();
            if(existingStay.getCancelledAt() != null || existingStay.getId().equals(stayId)) continue;
            if(endAt.isAfter(existingStay.getStartAt()) && startAt.isBefore(existingStay.getEndAt())) return true;
        }

        return false;
    }

    private void validateStayCanBeModified(Stay stay) {
        if(stay.getCancelledAt() != null || stay.getEndAt().isBefore(LocalDateTime.now())) throw new ConflictException("Closed stays cannot be modified");
    }

    private void validateEndDateIsAfterStartDate(LocalDateTime startAt, LocalDateTime endAt) {
        if(startAt.isAfter(endAt) || startAt.isEqual(endAt)) throw new BadRequestException("End time must be after start time");
    }

    private void validateVaccineCoverage(
            List<Cat> cats,
            LocalDateTime stayEndAt,
            boolean overrideVaccineConflicts,
            UserAccount currentUser) {

        List<VaccineConflictViolationDTO> vaccineConflicts = findVaccineConflicts(cats, stayEndAt);
        if (!vaccineConflicts.isEmpty()) {
            validateVaccineOverride(vaccineConflicts, overrideVaccineConflicts, currentUser);
        }

    }

    private List<VaccineConflictViolationDTO> findVaccineConflicts(List<Cat> cats, LocalDateTime stayEndAt) {
        LocalDate stayEndDate = stayEndAt.toLocalDate();
        List<VaccineConflictViolationDTO> conflicts = new ArrayList<>();

        for (Cat cat : cats) {
            addVaccineConflict(conflicts, cat, VaccineType.RABIES, cat.getLastRabiesDate(), stayEndDate);
            addVaccineConflict(conflicts, cat, VaccineType.TRIPLE_FELINE, cat.getLastTripleFelineDate(), stayEndDate);
        }

        return conflicts;
    }

    private void addVaccineConflict(
            List<VaccineConflictViolationDTO> conflicts,
            Cat cat,
            VaccineType vaccineType,
            LocalDate vaccinatedOn,
            LocalDate stayEndDate) {

        LocalDate expiresOn = vaccinatedOn == null ? null : vaccinatedOn.plusYears(1);
        if (expiresOn != null && stayEndDate.isBefore(expiresOn)) {
            return;
        }

        conflicts.add(VaccineConflictViolationDTO.builder()
                .catId(cat.getId())
                .catName(cat.getName())
                .vaccineType(vaccineType)
                .reason(vaccinatedOn == null ? VaccineConflictReason.MISSING : VaccineConflictReason.EXPIRED)
                .vaccinatedOn(vaccinatedOn)
                .expiresOn(expiresOn)
                .build());
    }

    private void validateVaccineOverride(
            List<VaccineConflictViolationDTO> vaccineConflicts,
            boolean overrideVaccineConflicts,
            UserAccount currentUser) {

        if (currentUser.getRole() == UserRole.ADMIN && overrideVaccineConflicts) {
            return;
        }

        throw new VaccineConflictException(vaccineConflicts);
    }

    private StayResponseDTO toResponseDTO(Stay stay) {
        return stayMapper.toResponseDTO(stay, deletionAuthorizationPolicy.canDelete(stay.getCreatedBy(), stay.getCreatedAt()));
    }

}
