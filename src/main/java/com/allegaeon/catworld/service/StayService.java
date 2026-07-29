package com.allegaeon.catworld.service;

import com.allegaeon.catworld.dto.PricingDecisionRequestDTO;
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
import com.allegaeon.catworld.model.NightlyReferenceRate;
import com.allegaeon.catworld.model.NightlyReferenceRateCategory;
import com.allegaeon.catworld.model.Stay;
import com.allegaeon.catworld.model.StayCat;
import com.allegaeon.catworld.model.StayPricingDecision;
import com.allegaeon.catworld.model.UserAccount;
import com.allegaeon.catworld.model.UserRole;
import com.allegaeon.catworld.repository.CatRepository;
import com.allegaeon.catworld.repository.NightlyReferenceRateRepository;
import com.allegaeon.catworld.repository.StayPricingDecisionRepository;
import com.allegaeon.catworld.repository.StayRepository;
import com.allegaeon.catworld.security.CurrentUserAccountService;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.Instant;
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

    private static final int MAX_MONETARY_INTEGER_DIGITS = 19;

    private final StayRepository stayRepository;
    private final StayMapper stayMapper;
    private final CatRepository catRepository;
    private final NightlyReferenceRateRepository nightlyReferenceRateRepository;
    private final StayPricingDecisionRepository stayPricingDecisionRepository;
    private final CurrentUserAccountService currentUserAccountService;
    private final DeletionAuthorizationPolicy deletionAuthorizationPolicy;
    private final StayPricingAuthorizationPolicy stayPricingAuthorizationPolicy;
    private final Clock clock;

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
        stayPricingAuthorizationPolicy.authorizeCreation(currentUser);
        validateVaccineCoverage(
                cats,
                stayRequestDTO.getEndAt(),
                stayRequestDTO.isOverrideVaccineConflicts(),
                currentUser);

        NightlyReferenceRateCategory category = NightlyReferenceRateCategory
                .fromActualCatCount(cats.size())
                .orElseThrow(() -> new BadRequestException(
                        "A stay must contain at least one cat"
                ));
        NightlyReferenceRate currentRate = nightlyReferenceRateRepository
                .findById(category)
                .orElseThrow(() -> new ConflictException(
                        "Nightly reference-rate configuration is incomplete"
                ));
        BigDecimal retainedNightlyRate = currentRate.getNightlyRate();
        validateRetainedNightlyRate(retainedNightlyRate);

        long numberOfNights = stayMapper.calculateNumberOfNights(
                stayRequestDTO.getStartAt(),
                stayRequestDTO.getEndAt()
        );
        BigDecimal suggestedAmount = stayMapper.calculateSuggestedAmount(
                retainedNightlyRate,
                numberOfNights
        );
        PricingDecisionRequestDTO pricingDecision = stayRequestDTO.getPricingDecision();
        validatePricingDecision(pricingDecision, suggestedAmount);

        stay.setOwner(owner);
        stay.setStayCats(stayCats);
        stay.setCreatedBy(currentUser);
        stay.setRetainedNightlyRate(retainedNightlyRate);
        stay.setAgreedAmount(pricingDecision.getAgreedAmount());

        Stay savedStay = stayRepository.save(stay);
        stayPricingDecisionRepository.saveAndFlush(
                buildPricingDecision(
                        savedStay,
                        null,
                        numberOfNights,
                        null,
                        pricingDecision,
                        currentUser
                )
        );

        return toResponseDTO(savedStay);

    }

    @Override
    @Transactional
    public StayResponseDTO updateStay(UUID stayId, StayUpdateDTO stayUpdateDTO) {

        validateEndDateIsAfterStartDate(stayUpdateDTO.getStartAt(), stayUpdateDTO.getEndAt());
        Stay stay = getStayEntityForUpdate(stayId);
        validateStayCanBeModified(stay);
        long previousNumberOfNights = stayMapper.calculateNumberOfNights(
                stay.getStartAt(),
                stay.getEndAt()
        );
        long newNumberOfNights = stayMapper.calculateNumberOfNights(
                stayUpdateDTO.getStartAt(),
                stayUpdateDTO.getEndAt()
        );
        boolean pricingAffecting = previousNumberOfNights != newNumberOfNights;
        BigDecimal previousAgreedAmount = stay.getAgreedAmount();
        UserAccount currentUser = null;

        if (pricingAffecting) {
            currentUser = currentUserAccountService.getCurrentUserAccount();
            stayPricingAuthorizationPolicy.authorizeNightCountChange(currentUser);
            validatePricingDecision(
                    stayUpdateDTO.getPricingDecision(),
                    stayMapper.calculateSuggestedAmount(
                            stay.getRetainedNightlyRate(),
                            newNumberOfNights
                    )
            );
        }

        boolean extendsStay = stayUpdateDTO.getEndAt().isAfter(stay.getEndAt());

        stay = stayMapper.updateEntity(stay, stayUpdateDTO);
        if (pricingAffecting) {
            stay.setAgreedAmount(stayUpdateDTO.getPricingDecision().getAgreedAmount());
        }

        List<Cat> cats = stay.getStayCats().stream().map(StayCat::getCat).toList();

        for(Cat cat : cats) {
            if(hasOverBooking(stayUpdateDTO.getStartAt(), stayUpdateDTO.getEndAt(), cat, stayId)) throw new ConflictException("There's already a booking for " + cat.getName() + " in the selected dates");
        }

        if (extendsStay) {
            List<VaccineConflictViolationDTO> vaccineConflicts = findVaccineConflicts(cats, stayUpdateDTO.getEndAt());
            if (!vaccineConflicts.isEmpty()) {
                if (currentUser == null) {
                    currentUser = currentUserAccountService.getCurrentUserAccount();
                }
                validateVaccineOverride(
                        vaccineConflicts,
                        stayUpdateDTO.isOverrideVaccineConflicts(),
                        currentUser);
            }
        }

        Stay savedStay = stayRepository.save(stay);
        if (pricingAffecting) {
            stayPricingDecisionRepository.saveAndFlush(
                    buildPricingDecision(
                            savedStay,
                            previousNumberOfNights,
                            newNumberOfNights,
                            previousAgreedAmount,
                            stayUpdateDTO.getPricingDecision(),
                            currentUser
                    )
            );
        }

        return toResponseDTO(savedStay);

    }

    @Override
    @Transactional
    public void cancelStay(UUID stayId) {

        Stay stay = getStayEntityForUpdate(stayId);
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

    private Stay getStayEntityForUpdate(UUID stayId) {
        return stayRepository.findByIdForUpdate(stayId)
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

    private void validateRetainedNightlyRate(BigDecimal retainedNightlyRate) {
        if (retainedNightlyRate == null) {
            return;
        }
        if (retainedNightlyRate.signum() <= 0 || !isSupportedWholeAmount(retainedNightlyRate)) {
            throw new ConflictException(
                    "Applicable nightly reference rate is not a valid positive whole amount"
            );
        }
    }

    private void validatePricingDecision(
            PricingDecisionRequestDTO pricingDecision,
            BigDecimal suggestedAmount) {
        if (pricingDecision == null) {
            throw new BadRequestException("An explicit pricing decision is required");
        }

        BigDecimal agreedAmount = pricingDecision.getAgreedAmount();
        if (agreedAmount == null
                || agreedAmount.signum() < 0
                || !isSupportedWholeAmount(agreedAmount)) {
            throw new BadRequestException(
                    "Agreed amount must be a non-negative whole number with at most 19 digits"
            );
        }

        if (suggestedAmount != null
                && suggestedAmount.compareTo(agreedAmount) != 0
                && (pricingDecision.getReason() == null
                || pricingDecision.getReason().isBlank())) {
            throw new BadRequestException(
                    "A non-blank pricing decision reason is required when the agreed amount differs from the suggestion"
            );
        }
    }

    private boolean isSupportedWholeAmount(BigDecimal amount) {
        BigDecimal normalized = amount.stripTrailingZeros();
        int fractionalDigits = Math.max(normalized.scale(), 0);
        int integerDigits = Math.max(normalized.precision() - normalized.scale(), 0);
        return fractionalDigits == 0 && integerDigits <= MAX_MONETARY_INTEGER_DIGITS;
    }

    private StayPricingDecision buildPricingDecision(
            Stay stay,
            Long previousNumberOfNights,
            long newNumberOfNights,
            BigDecimal previousAgreedAmount,
            PricingDecisionRequestDTO pricingDecision,
            UserAccount currentUser) {
        return StayPricingDecision.builder()
                .stayId(stay.getId())
                .retainedNightlyRate(stay.getRetainedNightlyRate())
                .previousNumberOfNights(previousNumberOfNights)
                .newNumberOfNights(newNumberOfNights)
                .previousAgreedAmount(previousAgreedAmount)
                .newAgreedAmount(pricingDecision.getAgreedAmount())
                .decidedBy(currentUser)
                .decidedAt(Instant.now(clock))
                .reason(pricingDecision.getReason())
                .build();
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
