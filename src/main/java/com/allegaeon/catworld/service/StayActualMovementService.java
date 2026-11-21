package com.allegaeon.catworld.service;

import com.allegaeon.catworld.dto.StayActualMovementRequest;
import com.allegaeon.catworld.dto.StayActualMovementsDTO;
import com.allegaeon.catworld.dto.StayActualMovementsDTO.ActualMovement;
import com.allegaeon.catworld.exception.BadRequestException;
import com.allegaeon.catworld.exception.ConflictException;
import com.allegaeon.catworld.exception.ForbiddenException;
import com.allegaeon.catworld.exception.ResourceNotFoundException;
import com.allegaeon.catworld.model.Stay;
import com.allegaeon.catworld.model.StayActualMovement;
import com.allegaeon.catworld.model.StayActualMovementId;
import com.allegaeon.catworld.model.StayArrivalReset;
import com.allegaeon.catworld.model.StayMovementType;
import com.allegaeon.catworld.model.StayStatus;
import com.allegaeon.catworld.model.UserAccount;
import com.allegaeon.catworld.model.UserRole;
import com.allegaeon.catworld.repository.CatRepository;
import com.allegaeon.catworld.repository.StayActualMovementRepository;
import com.allegaeon.catworld.repository.StayCatRepository;
import com.allegaeon.catworld.repository.StayRepository;
import com.allegaeon.catworld.security.CurrentUserAccountService;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;
import java.util.EnumMap;
import java.util.List;
import java.util.UUID;

import static com.allegaeon.catworld.model.StayMovementType.ARRIVAL;
import static com.allegaeon.catworld.model.StayMovementType.DEPARTURE;

@Service
@RequiredArgsConstructor
public class StayActualMovementService {

    private static final Instant FIRST_STORABLE_INSTANT = Instant.parse("1000-01-01T00:00:00Z");

    private final StayRepository stayRepository;
    private final StayActualMovementRepository movementRepository;
    private final StayCatRepository stayCatRepository;
    private final CatRepository catRepository;
    private final CurrentUserAccountService currentUser;
    private final EntityManager entityManager;
    private final Clock clock;

    @Transactional(readOnly = true)
    public StayActualMovementsDTO getMovements(UUID stayId) {
        return detailsFor(stayRepository.findById(stayId)
                .orElseThrow(() -> new ResourceNotFoundException("Stay", stayId)));
    }

    StayActualMovementsDTO detailsFor(Stay stay) {
        return toResponse(stay, currentMovements(stay.getId()), currentUser.getCurrentUserAccount(),
                LocalDate.now(clock));
    }

    @Transactional(isolation = Isolation.READ_COMMITTED)
    public StayActualMovementsDTO recordMovement(UUID stayId, StayMovementType type,
                                                 StayActualMovementRequest request) {
        Stay stay = lockStay(stayId);
        UserAccount actor = enabledActor();
        checkRevision(stay, request.expectedRevision());

        var movements = currentMovements(stayId);
        StayActualMovement existing = movements.get(type);
        StayStatus status = stay.status();
        boolean correction = type == ARRIVAL && existing != null && status == StayStatus.CHECKED_IN;
        if (!correction && (existing != null || !canRecord(type, status))) {
            throw new ConflictException("The stay does not allow this movement");
        }
        if (correction && !canManageArrival(actor, existing)) {
            throw new ForbiddenException("Staff can correct only their own arrivals");
        }

        Instant now = clock.instant();
        LocalDate today = now.atZone(clock.getZone()).toLocalDate();
        LocalDate planned = (type == ARRIVAL ? stay.getStartAt() : stay.getEndAt()).toLocalDate();
        Instant occurredAt = validateMovementTime(request.occurredAt(), now, planned, today);

        StayActualMovement arrival = movements.get(ARRIVAL);
        if (type == DEPARTURE && arrival != null && occurredAt.isBefore(arrival.occurredAt())) {
            throw new BadRequestException("Actual departure must be at or after actual arrival");
        }

        if (correction && existing.occurredAt().equals(occurredAt)) {
            return toResponse(stay, movements, actor, today);
        }

        // The stay lock serializes its schedule, lifecycle, economic writes and cancellation.
        // Both kinds of confirmation lock every cat before checking any competing stay.
        List<UUID> catIds = lockCats(stay);
        if (type == ARRIVAL && !catIds.isEmpty() && stayCatRepository.hasOverlappingActualOccupancy(
                catIds, stayId, LocalDateTime.ofInstant(occurredAt, ZoneOffset.UTC))) {
            throw new ConflictException("A cat has overlapping actual occupancy in another stay");
        }

        stay.advanceMovementRevision();
        if (correction) {
            existing.correct(occurredAt, actor);
        } else {
            stay.setMovementStatus(type == ARRIVAL ? StayStatus.CHECKED_IN : StayStatus.CHECKED_OUT);
            movements.put(type, movementRepository.save(
                    new StayActualMovement(new StayActualMovementId(stayId, type), occurredAt, actor)));
        }
        movementRepository.flush();
        return toResponse(stay, movements, actor, today);
    }

    @Transactional(isolation = Isolation.READ_COMMITTED)
    public StayActualMovementsDTO resetArrival(UUID stayId, long expectedRevision) {
        Stay stay = lockStay(stayId);
        UserAccount actor = enabledActor();
        checkRevision(stay, expectedRevision);
        if (stay.status() != StayStatus.CHECKED_IN) {
            throw new ConflictException("Only a checked-in stay can be reset to pending");
        }

        var movements = currentMovements(stayId);
        StayActualMovement arrival = movements.get(ARRIVAL);
        if (!canManageArrival(actor, arrival)) {
            throw new ForbiddenException("Staff can reset only their own arrivals");
        }
        lockCats(stay);
        Instant now = clock.instant().truncatedTo(ChronoUnit.MICROS);
        movements.remove(ARRIVAL);
        entityManager.persist(new StayArrivalReset(stay, arrival, actor, now));
        if (arrival != null) {
            movementRepository.delete(arrival);
        }
        stay.setMovementStatus(StayStatus.RESERVED);
        stay.advanceMovementRevision();
        movementRepository.flush();
        return toResponse(stay, movements, actor, now.atZone(clock.getZone()).toLocalDate());
    }

    private Stay lockStay(UUID stayId) {
        return stayRepository.findByIdForUpdate(stayId)
                .orElseThrow(() -> new ResourceNotFoundException("Stay", stayId));
    }

    private List<UUID> lockCats(Stay stay) {
        List<UUID> catIds = stay.getStayCats().stream().map(link -> link.getCat().getId()).sorted().toList();
        for (UUID id : catIds) {
            catRepository.findByIdForUpdate(id).orElseThrow(() -> new ResourceNotFoundException("Cat", id));
        }
        return catIds;
    }

    private UserAccount enabledActor() {
        UserAccount actor = currentUser.getCurrentUserAccount();
        if (!actor.isEnabled()) {
            throw new ForbiddenException("An enabled account is required to record actual movements");
        }
        return actor;
    }

    private static void checkRevision(Stay stay, long expectedRevision) {
        if (stay.getMovementRevision() != expectedRevision) {
            throw new ConflictException("The stay or its actual movements have changed");
        }
    }

    private Instant validateMovementTime(Instant requested, Instant now, LocalDate planned, LocalDate today) {
        Instant occurredAt = requested == null ? now : requested;
        if (occurredAt.isBefore(FIRST_STORABLE_INSTANT) || occurredAt.isAfter(now)) {
            throw new BadRequestException("Actual movement time must be within the supported range and not in the future");
        }
        if ((requested == null && !planned.equals(today))
                || !occurredAt.atZone(clock.getZone()).toLocalDate().equals(planned)) {
            throw new BadRequestException("Actual movement time must be on the scheduled business date");
        }
        return occurredAt.truncatedTo(ChronoUnit.MICROS);
    }

    private EnumMap<StayMovementType, StayActualMovement> currentMovements(UUID stayId) {
        var byType = new EnumMap<StayMovementType, StayActualMovement>(StayMovementType.class);
        movementRepository.findAllByIdStayId(stayId).forEach(movement -> byType.put(movement.getId().getType(), movement));
        return byType;
    }

    private static boolean canRecord(StayMovementType type, StayStatus status) {
        return status == (type == ARRIVAL ? StayStatus.RESERVED : StayStatus.CHECKED_IN);
    }

    private static boolean canManageArrival(UserAccount actor, StayActualMovement arrival) {
        return actor.getRole() == UserRole.ADMIN
                || (arrival != null && actor.getId().equals(arrival.getRecordedById()));
    }

    private static StayActualMovementsDTO toResponse(Stay stay, EnumMap<StayMovementType, StayActualMovement> movements,
                                                      UserAccount actor, LocalDate today) {
        StayStatus status = stay.status();
        boolean enabled = actor.isEnabled();
        LocalDate arrivalDay = stay.getStartAt().toLocalDate();
        LocalDate departureDay = stay.getEndAt().toLocalDate();
        StayActualMovement arrival = movements.get(ARRIVAL);
        StayActualMovement departure = movements.get(DEPARTURE);
        boolean canRecordArrival = enabled && arrival == null && canRecord(ARRIVAL, status) && !arrivalDay.isAfter(today);
        boolean canRecordDeparture = enabled && departure == null && canRecord(DEPARTURE, status) && !departureDay.isAfter(today);
        boolean canCorrectArrival = enabled && status == StayStatus.CHECKED_IN && arrival != null
                && !arrivalDay.isAfter(today) && canManageArrival(actor, arrival);
        boolean canReset = enabled && status == StayStatus.CHECKED_IN && canManageArrival(actor, arrival);
        return new StayActualMovementsDTO(stay.getStartAt(), stay.getEndAt(), status == StayStatus.CANCELLED, status,
                stay.getMovementRevision(), toMovement(arrival, canCorrectArrival), toMovement(departure, false),
                canRecordArrival, canRecordDeparture, canReset,
                arrivalDay.equals(today) && (canRecordArrival || canCorrectArrival),
                departureDay.equals(today) && canRecordDeparture);
    }

    private static ActualMovement toMovement(StayActualMovement movement, boolean canEdit) {
        if (movement == null) return null;
        return new ActualMovement(movement.occurredAt(), movement.revision(), movement.getRecordedBy(),
                movement.getCorrectedBy(), canEdit);
    }
}
