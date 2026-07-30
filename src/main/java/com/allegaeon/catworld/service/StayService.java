package com.allegaeon.catworld.service;

import com.allegaeon.catworld.dto.PricingDecisionRequestDTO;
import com.allegaeon.catworld.dto.PaymentAnnulmentRequestDTO;
import com.allegaeon.catworld.dto.PaymentEditRequestDTO;
import com.allegaeon.catworld.dto.PaymentRegistrationRequestDTO;
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
import com.allegaeon.catworld.model.StayAgreedAmountCorrection;
import com.allegaeon.catworld.model.StayCat;
import com.allegaeon.catworld.model.StayPayment;
import com.allegaeon.catworld.model.StayPaymentAnnulment;
import com.allegaeon.catworld.model.StayPaymentEdit;
import com.allegaeon.catworld.model.StayPricingDecision;
import com.allegaeon.catworld.model.UserAccount;
import com.allegaeon.catworld.model.UserRole;
import com.allegaeon.catworld.repository.CatRepository;
import com.allegaeon.catworld.repository.NightlyReferenceRateRepository;
import com.allegaeon.catworld.repository.StayAgreedAmountCorrectionRepository;
import com.allegaeon.catworld.repository.StayPaymentAnnulmentRepository;
import com.allegaeon.catworld.repository.StayPaymentEditRepository;
import com.allegaeon.catworld.repository.StayPaymentRepository;
import com.allegaeon.catworld.repository.StayPricingDecisionRepository;
import com.allegaeon.catworld.repository.StayRepository;
import com.allegaeon.catworld.security.CurrentUserAccountService;
import com.allegaeon.catworld.validation.WholeMonetaryAmount;
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
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@RequiredArgsConstructor
@Service
public class StayService implements IStayService {

    private final StayRepository stayRepository;
    private final StayMapper stayMapper;
    private final CatRepository catRepository;
    private final NightlyReferenceRateRepository nightlyReferenceRateRepository;
    private final StayPricingDecisionRepository stayPricingDecisionRepository;
    private final StayAgreedAmountCorrectionRepository
            stayAgreedAmountCorrectionRepository;
    private final StayPaymentRepository stayPaymentRepository;
    private final StayPaymentEditRepository stayPaymentEditRepository;
    private final StayPaymentAnnulmentRepository stayPaymentAnnulmentRepository;
    private final CurrentUserAccountService currentUserAccountService;
    private final DeletionAuthorizationPolicy deletionAuthorizationPolicy;
    private final StayPricingAuthorizationPolicy stayPricingAuthorizationPolicy;
    private final StayPaymentAuthorizationPolicy stayPaymentAuthorizationPolicy;
    private final Clock clock;

    @Override
    public List<StayResponseDTO> getAllStays() {
        List<Stay> stays = stayRepository.findAll();
        if (stays.isEmpty()) {
            return List.of();
        }

        Map<UUID, List<StayPayment>> paymentsByStay =
                stayPaymentRepository
                        .findAllByStay_IdInOrderByCreatedAtAscIdAsc(
                                stays.stream().map(Stay::getId).toList()
                        )
                        .stream()
                        .collect(Collectors.groupingBy(
                                payment -> payment.getStay().getId(),
                                HashMap::new,
                                Collectors.toList()
                        ));

        return stays.stream()
                .map(stay -> toResponseDTO(
                        stay,
                        paymentsByStay.getOrDefault(stay.getId(), List.of())
                ))
                .toList();
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
        BigDecimal retainedNightlyRate = validateRetainedNightlyRate(
                currentRate.getNightlyRate()
        );

        long numberOfNights = stayMapper.calculateNumberOfNights(
                stayRequestDTO.getStartAt(),
                stayRequestDTO.getEndAt()
        );
        BigDecimal suggestedAmount = stayMapper.calculateSuggestedAmount(
                retainedNightlyRate,
                numberOfNights
        );
        PricingDecisionRequestDTO pricingDecision = stayRequestDTO.getPricingDecision();
        BigDecimal agreedAmount = validatePricingDecision(
                pricingDecision,
                suggestedAmount
        );

        stay.setOwner(owner);
        stay.setStayCats(stayCats);
        stay.setCreatedBy(currentUser);
        stay.setRetainedNightlyRate(retainedNightlyRate);
        stay.setAgreedAmount(agreedAmount);

        Stay savedStay = stayRepository.save(stay);
        stayPricingDecisionRepository.saveAndFlush(
                buildPricingDecision(
                        savedStay,
                        null,
                        numberOfNights,
                        null,
                        agreedAmount,
                        pricingDecision.getReason(),
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
        BigDecimal newAgreedAmount = null;
        UserAccount currentUser = null;

        if (pricingAffecting) {
            currentUser = currentUserAccountService.getCurrentUserAccount();
            stayPricingAuthorizationPolicy.authorizeNightCountChange(currentUser);
            newAgreedAmount = validatePricingDecision(
                    stayUpdateDTO.getPricingDecision(),
                    stayMapper.calculateSuggestedAmount(
                            stay.getRetainedNightlyRate(),
                            newNumberOfNights
                    )
            );
            validateAgreementFloor(stayId, newAgreedAmount);
        }

        boolean extendsStay = stayUpdateDTO.getEndAt().isAfter(stay.getEndAt());

        stay = stayMapper.updateEntity(stay, stayUpdateDTO);
        if (pricingAffecting) {
            stay.setAgreedAmount(newAgreedAmount);
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
                            newAgreedAmount,
                            stayUpdateDTO.getPricingDecision().getReason(),
                            currentUser
                    )
            );
        }

        return toResponseDTO(savedStay);

    }

    @Override
    @Transactional
    public StayResponseDTO correctAgreedAmount(
            UUID stayId,
            PricingDecisionRequestDTO pricingDecision) {

        Stay stay = getStayEntityForUpdate(stayId);
        UserAccount currentUser = currentUserAccountService.getCurrentUserAccount();
        stayPricingAuthorizationPolicy.authorizeAgreedAmountCorrection(currentUser);

        BigDecimal newAgreedAmount = validateCorrectionAmount(pricingDecision);
        BigDecimal previousAgreedAmount = stay.getAgreedAmount();

        if (previousAgreedAmount != null
                && previousAgreedAmount.compareTo(newAgreedAmount) == 0) {
            return toResponseDTO(stay);
        }

        if (pricingDecision.getReason() == null
                || pricingDecision.getReason().isBlank()) {
            throw new BadRequestException(
                    "A non-blank reason is required to correct the agreed amount"
            );
        }
        validateAgreementFloor(stayId, newAgreedAmount);

        stay.setAgreedAmount(newAgreedAmount);
        Stay savedStay = stayRepository.save(stay);
        stayAgreedAmountCorrectionRepository.saveAndFlush(
                StayAgreedAmountCorrection.builder()
                        .stayId(savedStay.getId())
                        .previousAgreedAmount(
                                canonicalizeNullable(previousAgreedAmount)
                        )
                        .newAgreedAmount(newAgreedAmount)
                        .decidedBy(currentUser)
                        .decidedAt(Instant.now(clock))
                        .reason(pricingDecision.getReason())
                        .build()
        );

        return toResponseDTO(savedStay);
    }

    @Override
    @Transactional
    public StayResponseDTO registerPayment(
            UUID stayId,
            PaymentRegistrationRequestDTO paymentRequest) {
        Stay stay = getStayEntityForUpdate(stayId);
        UserAccount currentUser = currentUserAccountService.getCurrentUserAccount();
        stayPaymentAuthorizationPolicy.authorizeMutation(
                currentUser,
                stay.getStatus()
        );
        BigDecimal amount = validatePaymentAmount(
                paymentRequest == null ? null : paymentRequest.getAmount()
        );
        if (paymentRequest.getPaymentDate() == null) {
            throw new BadRequestException("Payment date is required");
        }
        BigDecimal agreement = requirePaymentAgreement(stay);
        BigDecimal activeTotal = getActivePaymentTotal(stayId);
        if (activeTotal.add(amount).compareTo(agreement) > 0) {
            throw new ConflictException(
                    "Payment amount exceeds the current remaining amount"
            );
        }

        stayPaymentRepository.saveAndFlush(
                StayPayment.builder()
                        .stay(stay)
                        .amount(amount)
                        .paymentDate(paymentRequest.getPaymentDate())
                        .note(paymentRequest.getNote())
                        .registeredBy(currentUser)
                        .build()
        );
        return toResponseDTO(stay);
    }

    @Override
    @Transactional
    public StayResponseDTO editPayment(
            UUID stayId,
            UUID paymentId,
            PaymentEditRequestDTO paymentRequest) {
        Stay stay = getStayEntityForUpdate(stayId);
        UserAccount currentUser = currentUserAccountService.getCurrentUserAccount();
        stayPaymentAuthorizationPolicy.authorizeMutation(
                currentUser,
                stay.getStatus()
        );
        StayPayment payment = getActivePayment(stayId, paymentId);
        BigDecimal newAmount = validatePaymentAmount(
                paymentRequest == null ? null : paymentRequest.getAmount()
        );
        String reason = requireReason(
                paymentRequest == null ? null : paymentRequest.getReason(),
                "edit"
        );
        BigDecimal previousAmount = payment.getAmount();
        if (previousAmount.compareTo(newAmount) == 0) {
            throw new BadRequestException(
                    "Edited payment amount must differ from the current amount"
            );
        }

        BigDecimal agreement = requirePaymentAgreement(stay);
        BigDecimal resultingTotal = getActivePaymentTotal(stayId)
                .subtract(previousAmount)
                .add(newAmount);
        if (resultingTotal.compareTo(agreement) > 0) {
            throw new ConflictException(
                    "Edited payment amount would exceed the agreed amount"
            );
        }

        payment.changeAmount(newAmount);
        StayPayment savedPayment = stayPaymentRepository.saveAndFlush(payment);
        stayPaymentEditRepository.saveAndFlush(
                StayPaymentEdit.builder()
                        .stayId(stayId)
                        .paymentId(savedPayment.getId())
                        .previousAmount(
                                WholeMonetaryAmount.canonicalize(previousAmount)
                        )
                        .newAmount(newAmount)
                        .editedBy(currentUser)
                        .editedAt(Instant.now(clock))
                        .reason(reason)
                        .build()
        );
        return toResponseDTO(stay);
    }

    @Override
    @Transactional
    public StayResponseDTO annulPayment(
            UUID stayId,
            UUID paymentId,
            PaymentAnnulmentRequestDTO paymentRequest) {
        Stay stay = getStayEntityForUpdate(stayId);
        UserAccount currentUser = currentUserAccountService.getCurrentUserAccount();
        stayPaymentAuthorizationPolicy.authorizeMutation(
                currentUser,
                stay.getStatus()
        );
        StayPayment payment = getActivePayment(stayId, paymentId);
        String reason = requireReason(
                paymentRequest == null ? null : paymentRequest.getReason(),
                "annul"
        );

        payment.annul();
        StayPayment savedPayment = stayPaymentRepository.saveAndFlush(payment);
        stayPaymentAnnulmentRepository.saveAndFlush(
                StayPaymentAnnulment.builder()
                        .stayId(stayId)
                        .paymentId(savedPayment.getId())
                        .annulledBy(currentUser)
                        .annulledAt(Instant.now(clock))
                        .reason(reason)
                        .build()
        );
        return toResponseDTO(stay);
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

    private BigDecimal validateRetainedNightlyRate(
            BigDecimal retainedNightlyRate) {
        if (retainedNightlyRate == null) {
            return null;
        }
        if (retainedNightlyRate.signum() <= 0
                || !WholeMonetaryAmount.isSupported(retainedNightlyRate)) {
            throw new ConflictException(
                    "Applicable nightly reference rate is not a valid positive whole amount"
            );
        }
        return WholeMonetaryAmount.canonicalize(retainedNightlyRate);
    }

    private BigDecimal validatePricingDecision(
            PricingDecisionRequestDTO pricingDecision,
            BigDecimal suggestedAmount) {
        if (pricingDecision == null) {
            throw new BadRequestException("An explicit pricing decision is required");
        }

        BigDecimal agreedAmount = pricingDecision.getAgreedAmount();
        if (agreedAmount == null
                || agreedAmount.signum() < 0
                || !WholeMonetaryAmount.isSupported(agreedAmount)) {
            throw new BadRequestException(
                    "Agreed amount must be a non-negative whole number with at most 19 digits"
            );
        }

        BigDecimal canonicalAgreedAmount =
                WholeMonetaryAmount.canonicalize(agreedAmount);
        if (suggestedAmount != null
                && suggestedAmount.compareTo(canonicalAgreedAmount) != 0
                && (pricingDecision.getReason() == null
                || pricingDecision.getReason().isBlank())) {
            throw new BadRequestException(
                    "A non-blank pricing decision reason is required when the agreed amount differs from the suggestion"
            );
        }
        return canonicalAgreedAmount;
    }

    private BigDecimal validateCorrectionAmount(
            PricingDecisionRequestDTO pricingDecision) {
        if (pricingDecision == null) {
            throw new BadRequestException(
                    "An explicit pricing correction decision is required"
            );
        }

        BigDecimal agreedAmount = pricingDecision.getAgreedAmount();
        if (agreedAmount == null
                || agreedAmount.signum() < 0
                || !WholeMonetaryAmount.isSupported(agreedAmount)) {
            throw new BadRequestException(
                    "Agreed amount must be a non-negative whole number with at most 19 digits"
            );
        }

        return WholeMonetaryAmount.canonicalize(agreedAmount);
    }

    private BigDecimal validatePaymentAmount(BigDecimal amount) {
        if (amount == null
                || amount.signum() <= 0
                || !WholeMonetaryAmount.isSupported(amount)) {
            throw new BadRequestException(
                    "Payment amount must be a positive whole number with at most 19 digits"
            );
        }
        return WholeMonetaryAmount.canonicalize(amount);
    }

    private BigDecimal requirePaymentAgreement(Stay stay) {
        if (stay.getAgreedAmount() == null) {
            throw new ConflictException(
                    "The stay agreement must be initialized before changing payments"
            );
        }
        return WholeMonetaryAmount.canonicalize(stay.getAgreedAmount());
    }

    private BigDecimal getActivePaymentTotal(UUID stayId) {
        BigDecimal total = stayPaymentRepository.sumActiveAmountByStayId(stayId);
        return total == null
                ? BigDecimal.ZERO
                : WholeMonetaryAmount.canonicalize(total);
    }

    private void validateAgreementFloor(
            UUID stayId,
            BigDecimal proposedAgreement) {
        if (getActivePaymentTotal(stayId).compareTo(proposedAgreement) > 0) {
            throw new ConflictException(
                    "Agreed amount cannot be lower than active payments"
            );
        }
    }

    private StayPayment getActivePayment(UUID stayId, UUID paymentId) {
        StayPayment payment = stayPaymentRepository
                .findByIdAndStay_Id(paymentId, stayId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Stay payment",
                        paymentId
                ));
        if (payment.isAnnulled()) {
            throw new ConflictException("Annulled payments are immutable");
        }
        return payment;
    }

    private String requireReason(String reason, String action) {
        if (reason == null || reason.isBlank()) {
            throw new BadRequestException(
                    "A non-blank reason is required to " + action + " a payment"
            );
        }
        return reason;
    }

    private StayPricingDecision buildPricingDecision(
            Stay stay,
            Long previousNumberOfNights,
            long newNumberOfNights,
            BigDecimal previousAgreedAmount,
            BigDecimal newAgreedAmount,
            String reason,
            UserAccount currentUser) {
        return StayPricingDecision.builder()
                .stayId(stay.getId())
                .retainedNightlyRate(
                        canonicalizeNullable(stay.getRetainedNightlyRate())
                )
                .previousNumberOfNights(previousNumberOfNights)
                .newNumberOfNights(newNumberOfNights)
                .previousAgreedAmount(
                        canonicalizeNullable(previousAgreedAmount)
                )
                .newAgreedAmount(newAgreedAmount)
                .decidedBy(currentUser)
                .decidedAt(Instant.now(clock))
                .reason(reason)
                .build();
    }

    private BigDecimal canonicalizeNullable(BigDecimal amount) {
        return amount == null
                ? null
                : WholeMonetaryAmount.canonicalize(amount);
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
        return toResponseDTO(
                stay,
                stayPaymentRepository
                        .findAllByStay_IdOrderByCreatedAtAscIdAsc(stay.getId())
        );
    }

    private StayResponseDTO toResponseDTO(
            Stay stay,
            List<StayPayment> payments) {
        StayResponseDTO response = stayMapper.toResponseDTO(
                stay,
                deletionAuthorizationPolicy.canDelete(
                        stay.getCreatedBy(),
                        stay.getCreatedAt()
                )
        );
        StayPaymentEconomics economics = StayPaymentEconomics.calculate(
                stay.getAgreedAmount(),
                payments,
                stay.getCancelledAt() != null
        );
        response.setTotalPaid(economics.totalPaid());
        response.setRemainingAmount(economics.remainingAmount());
        response.setPaymentCondition(economics.paymentCondition());
        response.setOutstandingCollectionEligible(
                economics.outstandingCollectionEligible()
        );
        response.setPayments(
                payments.stream()
                        .map(stayMapper::toPaymentResponseDTO)
                        .toList()
        );
        return response;
    }

}
