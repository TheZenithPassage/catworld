package com.allegaeon.catworld.service;

import com.allegaeon.catworld.dto.PricingDecisionRequestDTO;
import com.allegaeon.catworld.dto.CreationPricingConfirmationDTO;
import com.allegaeon.catworld.dto.ExistingStayPricingConfirmationDTO;
import com.allegaeon.catworld.dto.PaymentAnnulmentRequestDTO;
import com.allegaeon.catworld.dto.PaymentEditRequestDTO;
import com.allegaeon.catworld.dto.PaymentRegistrationRequestDTO;
import com.allegaeon.catworld.dto.PaymentRemovalRequestDTO;
import com.allegaeon.catworld.dto.StayRequestDTO;
import com.allegaeon.catworld.dto.StayResponseDTO;
import com.allegaeon.catworld.dto.StayUpdateDTO;
import com.allegaeon.catworld.dto.StayCreationPricingPreviewRequestDTO;
import com.allegaeon.catworld.dto.StayDatePricingPreviewRequestDTO;
import com.allegaeon.catworld.dto.StayDatePricingPreviewResponseDTO;
import com.allegaeon.catworld.dto.StayPricingPreviewResponseDTO;
import com.allegaeon.catworld.dto.VaccineConflictReason;
import com.allegaeon.catworld.dto.VaccineConflictViolationDTO;
import com.allegaeon.catworld.dto.VaccineType;
import com.allegaeon.catworld.exception.BadRequestException;
import com.allegaeon.catworld.exception.ConflictException;
import com.allegaeon.catworld.exception.ForbiddenException;
import com.allegaeon.catworld.exception.ResourceNotFoundException;
import com.allegaeon.catworld.exception.StalePricingConfirmationException;
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
import com.allegaeon.catworld.model.StayPaymentRemoval;
import com.allegaeon.catworld.model.StayPricingDecision;
import com.allegaeon.catworld.model.UserAccount;
import com.allegaeon.catworld.model.UserRole;
import com.allegaeon.catworld.repository.CatRepository;
import com.allegaeon.catworld.repository.NightlyReferenceRateRepository;
import com.allegaeon.catworld.repository.StayAgreedAmountCorrectionRepository;
import com.allegaeon.catworld.repository.StayPaymentAnnulmentRepository;
import com.allegaeon.catworld.repository.StayPaymentEditRepository;
import com.allegaeon.catworld.repository.StayPaymentRepository;
import com.allegaeon.catworld.repository.StayPaymentRemovalRepository;
import com.allegaeon.catworld.repository.StayPricingDecisionRepository;
import com.allegaeon.catworld.repository.StayRepository;
import com.allegaeon.catworld.repository.StayCatRepository;
import com.allegaeon.catworld.dto.relationship.CatRelationshipItem;
import com.allegaeon.catworld.dto.relationship.OwnerRelationshipItem;
import com.allegaeon.catworld.dto.relationship.RelationshipPage;
import com.allegaeon.catworld.dto.relationship.RelationshipPreview;
import com.allegaeon.catworld.dto.relationship.StayDetailResponse;
import com.allegaeon.catworld.security.CurrentUserAccountService;
import com.allegaeon.catworld.validation.WholeMonetaryAmount;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

@RequiredArgsConstructor
@Service
public class StayService implements IStayService {

    private final StayRepository stayRepository;
    private final StayMapper stayMapper;
    private final CatRepository catRepository;
    private final StayCatRepository stayCatRepository;
    private final NightlyReferenceRateRepository nightlyReferenceRateRepository;
    private final StayPricingDecisionRepository stayPricingDecisionRepository;
    private final StayAgreedAmountCorrectionRepository
            stayAgreedAmountCorrectionRepository;
    private final StayPaymentRepository stayPaymentRepository;
    private final StayPaymentEditRepository stayPaymentEditRepository;
    private final StayPaymentAnnulmentRepository stayPaymentAnnulmentRepository;
    private final StayPaymentRemovalRepository stayPaymentRemovalRepository;
    private final SensitiveStayContextFactory sensitiveStayContextFactory;
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
        Map<UUID, Map<UUID, StayPaymentAnnulment>> annulmentsByStay =
                Optional.ofNullable(stayPaymentAnnulmentRepository
                        .findAllByStayIdInOrderByAnnulledAtAsc(
                                stays.stream().map(Stay::getId).toList()))
                        .orElseGet(List::of)
                        .stream()
                        .collect(Collectors.groupingBy(
                                StayPaymentAnnulment::getStayId,
                                Collectors.toMap(
                                        StayPaymentAnnulment::getPaymentId,
                                        Function.identity()
                                )
                        ));

        Map<UUID, Boolean> deletionAuthorizationByStay = stays.stream()
                .collect(Collectors.toMap(
                        Stay::getId,
                        this::hasDeletionAuthorization
                ));
        List<UUID> deletionAuthorizedStayIds = stays.stream()
                .filter(stay -> deletionAuthorizationByStay.get(stay.getId()))
                .map(Stay::getId)
                .toList();
        Set<UUID> staysWithRemovalHistory = deletionAuthorizedStayIds.isEmpty()
                ? Set.of()
                : emptyIfNull(stayPaymentRemovalRepository
                        .findStayIdsWithRemovalHistory(deletionAuthorizedStayIds));

        return stays.stream()
                .map(stay -> toResponseDTO(
                        stay,
                        paymentsByStay.getOrDefault(stay.getId(), List.of()),
                        annulmentsByStay.getOrDefault(stay.getId(), Map.of()),
                        canDeleteStay(
                                deletionAuthorizationByStay.get(stay.getId()),
                                !paymentsByStay.getOrDefault(
                                        stay.getId(), List.of()).isEmpty(),
                                staysWithRemovalHistory.contains(stay.getId())
                        )
                ))
                .toList();
    }

    @Override
    public StayResponseDTO getStay(UUID stayId) {
        return toResponseDTO(getStayEntity(stayId));
    }

    @Override
    @Transactional(readOnly = true)
    public StayDetailResponse getStayDetail(UUID stayId) {
        Stay stay = getStayEntity(stayId);
        Page<Cat> cats = stayCatRepository.findCatsByStayId(
                stayId, PageRequest.of(0, 4));
        Owner owner = stay.getOwner();
        RelationshipPreview<CatRelationshipItem> preview =
                RelationshipResponses.preview(cats, RelationshipResponses::cat);
        return new StayDetailResponse(stay.getId(), stay.getStatus(),
                stay.getStartAt(), stay.getEndAt(),
                ChronoUnit.DAYS.between(stay.getStartAt().toLocalDate(),
                        stay.getEndAt().toLocalDate()),
                stay.getNotes(),
                new OwnerRelationshipItem(owner.getId(), owner.getFullName()), preview);
    }

    @Override
    @Transactional(readOnly = true)
    public RelationshipPage<CatRelationshipItem> getStayCats(UUID stayId, int page) {
        RelationshipResponses.requireValidPage(page);
        getStayEntity(stayId);
        return RelationshipResponses.page(
                stayCatRepository.findCatsByStayId(stayId,
                        PageRequest.of(page, RelationshipResponses.PAGE_SIZE)),
                RelationshipResponses::cat);
    }

    @Override
    public StayPricingPreviewResponseDTO previewCreationPricing(
            StayCreationPricingPreviewRequestDTO request) {
        validateEndDateIsAfterStartDate(request.getStartAt(), request.getEndAt());
        UserAccount currentUser = currentUserAccountService.getCurrentUserAccount();
        stayPricingAuthorizationPolicy.authorizeCreation(currentUser);
        List<Cat> cats = resolvePricingPreviewCats(request.getCatIds());
        CreationPricingBasis basis = creationPricingBasis(
                request.getStartAt(), request.getEndAt(), cats.size(),
                nightlyReferenceRateRepository::findById);
        return creationPreview(basis);
    }

    @Override
    public StayDatePricingPreviewResponseDTO previewDateChangePricing(
            UUID stayId, StayDatePricingPreviewRequestDTO request) {
        validateEndDateIsAfterStartDate(request.getStartAt(), request.getEndAt());
        Stay stay = getStayEntity(stayId);
        validateStayCanBeModified(stay);
        return dateChangePreview(stay, request.getStartAt(), request.getEndAt());
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

        CreationPricingBasis basis = creationPricingBasis(
                stayRequestDTO.getStartAt(), stayRequestDTO.getEndAt(), cats.size(),
                nightlyReferenceRateRepository::findByCategoryForUpdate);
        BigDecimal retainedNightlyRate = basis.retainedNightlyRate();
        long numberOfNights = basis.numberOfNights();
        BigDecimal suggestedAmount = basis.suggestedAmount();
        PricingDecisionRequestDTO pricingDecision = stayRequestDTO.getPricingDecision();
        validateCreationConfirmation(
                stayRequestDTO.getConfirmation(), numberOfNights,
                retainedNightlyRate, suggestedAmount);
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
        BigDecimal selectedRetainedNightlyRate = stay.getRetainedNightlyRate();
        UserAccount currentUser = null;

        if (pricingAffecting) {
            currentUser = currentUserAccountService.getCurrentUserAccount();
            stayPricingAuthorizationPolicy.authorizeNightCountChange(currentUser);
            selectedRetainedNightlyRate = validateDateChangeConfirmation(
                    stayUpdateDTO.getConfirmation(), previousNumberOfNights,
                    previousAgreedAmount, newNumberOfNights,
                    stay);
            BigDecimal selectedSuggestion = stayMapper.calculateSuggestedAmount(
                    selectedRetainedNightlyRate, newNumberOfNights);
            if (!sameMoney(
                    stayUpdateDTO.getConfirmation().getSuggestedAmount(),
                    selectedSuggestion)) {
                throw new StalePricingConfirmationException();
            }
            newAgreedAmount = validatePricingDecision(
                    stayUpdateDTO.getPricingDecision(),
                    selectedSuggestion
            );
            validateAgreementFloor(stayId, newAgreedAmount);
        }

        boolean extendsStay = stayUpdateDTO.getEndAt().isAfter(stay.getEndAt());

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

        stay = stayMapper.updateEntity(stay, stayUpdateDTO);
        if (pricingAffecting) {
            stay.setRetainedNightlyRate(selectedRetainedNightlyRate);
            stay.setAgreedAmount(newAgreedAmount);
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

        if (stay.getAgreedAmount() == null) {
            throw new ConflictException(
                    "The stay agreement must exist before it can be corrected"
            );
        }

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
                        .sensitiveContext(
                                sensitiveStayContextFactory.create(savedStay)
                        )
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
        requirePaymentAgreement(stay);
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
                        .sensitiveContext(
                                sensitiveStayContextFactory.create(stay)
                        )
                        .paymentDate(savedPayment.getPaymentDate())
                        .paymentNote(savedPayment.getNote())
                        .registeredBy(savedPayment.getRegisteredBy())
                        .registeredAt(savedPayment.getCreatedAt())
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
        requirePaymentAgreement(stay);
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
                        .sensitiveContext(
                                sensitiveStayContextFactory.create(stay)
                        )
                        .amount(
                                WholeMonetaryAmount.canonicalize(
                                        savedPayment.getAmount()
                                )
                        )
                        .paymentDate(savedPayment.getPaymentDate())
                        .paymentNote(savedPayment.getNote())
                        .registeredBy(savedPayment.getRegisteredBy())
                        .registeredAt(savedPayment.getCreatedAt())
                        .build()
        );
        return toResponseDTO(stay);
    }

    @Override
    @Transactional
    public StayResponseDTO removePayment(
            UUID stayId,
            UUID paymentId,
            PaymentRemovalRequestDTO paymentRequest) {
        Stay stay = getStayEntityForUpdate(stayId);
        UserAccount currentUser = currentUserAccountService.getCurrentUserAccount();
        stayPaymentAuthorizationPolicy.authorizeRemoval(currentUser);
        requirePaymentAgreement(stay);
        StayPayment payment = getPayment(stayId, paymentId);
        String reason = requireReason(
                paymentRequest == null ? null : paymentRequest.getReason(),
                "remove"
        );

        try {
            stayPaymentRemovalRepository.saveAndFlush(
                    StayPaymentRemoval.builder()
                            .sensitiveContext(
                                    sensitiveStayContextFactory.create(stay)
                            )
                            .stayId(stayId)
                            .paymentId(payment.getId())
                            .amount(
                                    WholeMonetaryAmount.canonicalize(
                                            payment.getAmount()
                                    )
                            )
                            .paymentDate(payment.getPaymentDate())
                            .paymentNote(payment.getNote())
                            .annulled(payment.isAnnulled())
                            .registeredBy(payment.getRegisteredBy())
                            .registeredAt(payment.getCreatedAt())
                            .removedBy(currentUser)
                            .removedAt(Instant.now(clock))
                            .reason(reason)
                            .build()
            );
            stayPaymentRepository.delete(payment);
            stayPaymentRepository.flush();
        } catch (DataIntegrityViolationException | OptimisticLockingFailureException exception) {
            throw new ConflictException(
                    "Payment cannot be removed because of a data conflict"
            );
        }
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

        Stay stay = getStayEntityForUpdate(stayId);
        UserAccount currentUser = currentUserAccountService.getCurrentUserAccount();
        deletionAuthorizationPolicy.authorize(
                currentUser,
                stay.getCreatedBy(),
                stay.getCreatedAt()
        );
        if (stayPaymentRepository.existsByStay_Id(stayId)) {
            throw new ConflictException(
                    "Stay cannot be deleted while operational payments remain"
            );
        }
        if (currentUser.getRole() == UserRole.STAFF
                && stayPaymentRemovalRepository.existsByStayId(stayId)) {
            throw new ForbiddenException(
                    "Staff cannot delete a stay with payment history"
            );
        }

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

    private List<Cat> resolvePricingPreviewCats(Set<UUID> catIds) {
        List<Cat> cats = catIds.stream().map(this::getCatEntity).toList();
        UUID ownerId = cats.get(0).getOwner().getId();
        if (cats.stream().anyMatch(cat -> !ownerId.equals(cat.getOwner().getId()))) {
            throw new BadRequestException("Owner must be the same for all the cats");
        }
        return cats;
    }

    private NightlyReferenceRateCategory categoryFor(int catCount) {
        return NightlyReferenceRateCategory.fromActualCatCount(catCount)
                .orElseThrow(() -> new BadRequestException(
                        "A stay must contain at least one cat"));
    }

    private CreationPricingBasis creationPricingBasis(
            LocalDateTime startAt,
            LocalDateTime endAt,
            int catCount,
            Function<NightlyReferenceRateCategory,
                    Optional<NightlyReferenceRate>> rateLookup) {
        NightlyReferenceRateCategory category = categoryFor(catCount);
        NightlyReferenceRate currentRate = rateLookup.apply(category)
                .orElseThrow(() -> new ConflictException(
                        "Nightly reference-rate configuration is incomplete"));
        BigDecimal retainedRate = validateRetainedNightlyRate(
                currentRate.getNightlyRate());
        long nights = stayMapper.calculateNumberOfNights(startAt, endAt);
        BigDecimal suggestion = stayMapper.calculateSuggestedAmount(
                retainedRate, nights);
        return new CreationPricingBasis(
                category, nights, retainedRate, suggestion);
    }

    private StayPricingPreviewResponseDTO creationPreview(
            CreationPricingBasis basis) {
        return StayPricingPreviewResponseDTO.builder()
                .numberOfNights(basis.numberOfNights())
                .retainedNightlyRate(basis.retainedNightlyRate())
                .suggestedAmount(basis.suggestedAmount())
                .confirmation(CreationPricingConfirmationDTO.builder()
                        .numberOfNights(basis.numberOfNights())
                        .retainedNightlyRate(basis.retainedNightlyRate())
                        .suggestedAmount(basis.suggestedAmount())
                        .build())
                .build();
    }

    private record CreationPricingBasis(
            NightlyReferenceRateCategory category,
            long numberOfNights,
            BigDecimal retainedNightlyRate,
            BigDecimal suggestedAmount) {
    }

    private StayDatePricingPreviewResponseDTO dateChangePreview(
            Stay stay, LocalDateTime startAt, LocalDateTime endAt) {
        long previousNights = stayMapper.calculateNumberOfNights(
                stay.getStartAt(), stay.getEndAt());
        long nights = stayMapper.calculateNumberOfNights(startAt, endAt);
        boolean pricingDecisionRequired = previousNights != nights;
        if (pricingDecisionRequired) {
            UserAccount currentUser = currentUserAccountService.getCurrentUserAccount();
            stayPricingAuthorizationPolicy.authorizeNightCountChange(currentUser);
        }
        BigDecimal suggestion = stayMapper.calculateSuggestedAmount(
                stay.getRetainedNightlyRate(), nights);
        ExistingStayPricingConfirmationDTO confirmation = pricingDecisionRequired
                ? ExistingStayPricingConfirmationDTO.builder()
                        .previousNumberOfNights(previousNights)
                        .previousAgreedAmount(stay.getAgreedAmount())
                        .numberOfNights(nights)
                        .retainedNightlyRate(stay.getRetainedNightlyRate())
                        .suggestedAmount(suggestion)
                        .build()
                : null;
        return StayDatePricingPreviewResponseDTO.builder()
                .pricingDecisionRequired(pricingDecisionRequired)
                .currentNumberOfNights(previousNights)
                .currentAgreedAmount(stay.getAgreedAmount())
                .numberOfNights(nights)
                .retainedNightlyRate(stay.getRetainedNightlyRate())
                .suggestedAmount(suggestion)
                .confirmation(confirmation)
                .build();
    }

    private void validateCreationConfirmation(
            CreationPricingConfirmationDTO confirmation, long nights,
            BigDecimal retainedRate, BigDecimal suggestion) {
        if (confirmation == null || confirmation.getNumberOfNights() == null) {
            throw new BadRequestException("Pricing confirmation is required");
        }
        if (confirmation.getNumberOfNights() != nights
                || !sameMoney(confirmation.getRetainedNightlyRate(), retainedRate)
                || !sameMoney(confirmation.getSuggestedAmount(), suggestion)) {
            throw new StalePricingConfirmationException();
        }
    }

    private BigDecimal validateDateChangeConfirmation(
            ExistingStayPricingConfirmationDTO confirmation,
            long previousNights, BigDecimal previousAgreement,
            long proposedNights, Stay stay) {
        if (confirmation == null
                || confirmation.getPreviousNumberOfNights() == null
                || confirmation.getNumberOfNights() == null) {
            throw new BadRequestException("Pricing confirmation is required");
        }
        if (confirmation.getPreviousNumberOfNights() != previousNights
                || !sameMoney(confirmation.getPreviousAgreedAmount(), previousAgreement)
                || confirmation.getNumberOfNights() != proposedNights) {
            throw new StalePricingConfirmationException();
        }

        BigDecimal submittedRate = confirmation.getRetainedNightlyRate();
        if (submittedRate != null
                && (submittedRate.signum() <= 0
                || !WholeMonetaryAmount.isSupported(submittedRate))) {
            throw new StalePricingConfirmationException();
        }
        BigDecimal selectedRate = canonicalizeNullable(submittedRate);
        BigDecimal originalRate = canonicalizeNullable(
                stay.getRetainedNightlyRate());
        if (sameMoney(selectedRate, originalRate)) {
            return originalRate;
        }

        NightlyReferenceRateCategory category = NightlyReferenceRateCategory
                .fromActualCatCount(stay.getStayCats().size())
                .orElseThrow(StalePricingConfirmationException::new);
        BigDecimal currentRate = nightlyReferenceRateRepository
                .findByCategoryForUpdate(category)
                .map(NightlyReferenceRate::getNightlyRate)
                .filter(rate -> rate.signum() > 0)
                .filter(WholeMonetaryAmount::isSupported)
                .map(WholeMonetaryAmount::canonicalize)
                .orElseThrow(StalePricingConfirmationException::new);
        if (!sameMoney(selectedRate, currentRate)) {
            throw new StalePricingConfirmationException();
        }
        return currentRate;
    }

    private boolean sameMoney(BigDecimal clientValue, BigDecimal authoritative) {
        return clientValue == null ? authoritative == null
                : authoritative != null && clientValue.compareTo(authoritative) == 0;
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
        StayPayment payment = getPayment(stayId, paymentId);
        if (payment.isAnnulled()) {
            throw new ConflictException("Annulled payments are immutable");
        }
        return payment;
    }

    private StayPayment getPayment(UUID stayId, UUID paymentId) {
        return stayPaymentRepository
                .findByIdAndStay_Id(paymentId, stayId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Stay payment",
                        paymentId
                ));
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
                .sensitiveContext(
                        isPricingOverride(
                                stay.getRetainedNightlyRate(),
                                newNumberOfNights,
                                newAgreedAmount
                        )
                                ? sensitiveStayContextFactory.create(stay)
                                : null
                )
                .build();
    }

    private boolean isPricingOverride(
            BigDecimal retainedNightlyRate,
            long numberOfNights,
            BigDecimal agreedAmount) {
        if (retainedNightlyRate == null) {
            return false;
        }
        BigDecimal suggestion = WholeMonetaryAmount.canonicalize(
                retainedNightlyRate.multiply(BigDecimal.valueOf(numberOfNights))
        );
        return suggestion.compareTo(agreedAmount) != 0;
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
                        .findAllByStay_IdOrderByCreatedAtAscIdAsc(stay.getId()),
                Optional.ofNullable(stayPaymentAnnulmentRepository
                        .findAllByStayIdOrderByAnnulledAtAsc(stay.getId()))
                        .orElseGet(List::of)
                        .stream()
                        .collect(Collectors.toMap(
                                StayPaymentAnnulment::getPaymentId,
                                Function.identity()
                        ))
        );
    }

    private StayResponseDTO toResponseDTO(
            Stay stay,
            List<StayPayment> payments,
            Map<UUID, StayPaymentAnnulment> annulmentsByPayment) {
        boolean deletionAuthorized = hasDeletionAuthorization(stay);
        return toResponseDTO(
                stay,
                payments,
                annulmentsByPayment,
                canDeleteStay(
                        deletionAuthorized,
                        !payments.isEmpty(),
                        deletionAuthorized
                                && stayPaymentRemovalRepository.existsByStayId(
                                        stay.getId())
                )
        );
    }

    private StayResponseDTO toResponseDTO(
            Stay stay,
            List<StayPayment> payments,
            Map<UUID, StayPaymentAnnulment> annulmentsByPayment,
            boolean canDelete) {
        StayResponseDTO response = stayMapper.toResponseDTO(
                stay,
                canDelete
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
                        .map(payment -> stayMapper.toPaymentResponseDTO(
                                payment,
                                annulmentsByPayment.get(payment.getId())
                        ))
                        .toList()
        );
        return response;
    }

    private boolean hasDeletionAuthorization(Stay stay) {
        return deletionAuthorizationPolicy.canDelete(
                stay.getCreatedBy(),
                stay.getCreatedAt()
        );
    }

    private boolean canDeleteStay(
            boolean deletionAuthorized,
            boolean hasOperationalPayments,
            boolean hasRemovalHistory) {
        if (!deletionAuthorized || hasOperationalPayments) {
            return false;
        }
        if (!hasRemovalHistory) {
            return true;
        }
        UserAccount currentUser = currentUserAccountService.getCurrentUserAccount();
        return currentUser != null && currentUser.getRole() == UserRole.ADMIN;
    }

    private Set<UUID> emptyIfNull(Set<UUID> values) {
        return values == null ? Set.of() : values;
    }

}
