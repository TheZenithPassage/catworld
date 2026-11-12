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
import com.allegaeon.catworld.model.StayMovementType;
import com.allegaeon.catworld.model.UserAccount;
import com.allegaeon.catworld.model.UserRole;
import com.allegaeon.catworld.repository.StayActualMovementRepository;
import com.allegaeon.catworld.repository.StayRepository;
import com.allegaeon.catworld.security.CurrentUserAccountService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.Instant;
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
    private final CurrentUserAccountService currentUser;
    private final Clock clock;

    @Transactional(readOnly = true)
    public StayActualMovementsDTO getMovements(UUID stayId) {
        Stay stay = stayRepository.findById(stayId)
                .orElseThrow(() -> new ResourceNotFoundException("Stay", stayId));
        return toResponse(stay, byType(movementRepository.findAllByIdStayId(stayId)),
                currentUser.getCurrentUserAccount());
    }

    @Transactional(isolation = Isolation.READ_COMMITTED)
    public StayActualMovementsDTO recordMovement(UUID stayId, StayMovementType type,
                                                  StayActualMovementRequest request) {
        // Stay cancellation and permanent deletion take the same lock.
        Stay stay = stayRepository.findByIdForUpdate(stayId)
                .orElseThrow(() -> new ResourceNotFoundException("Stay", stayId));
        if (stay.getCancelledAt() != null) {
            throw new ConflictException("Actual movements cannot be changed after cancellation");
        }
        UserAccount actor = currentUser.getCurrentUserAccount();
        if (!actor.isEnabled()) {
            throw new ForbiddenException("An enabled account is required to record actual movements");
        }

        var movements = byType(movementRepository.findAllByIdStayId(stayId));
        StayActualMovement existing = movements.get(type);
        if (existing != null && !canCorrect(actor, existing)) {
            throw new ForbiddenException("Staff can correct only their own actual movements");
        }
        long revision = existing == null ? 0 : existing.revision();
        if (revision != request.expectedRevision()) {
            throw new ConflictException("The actual movement has changed");
        }

        Instant now = clock.instant();
        Instant occurredAt = request.occurredAt() == null ? now : request.occurredAt();
        if (occurredAt.isBefore(FIRST_STORABLE_INSTANT) || occurredAt.isAfter(now)) {
            throw new BadRequestException("Actual movement time must be within the supported range and not in the future");
        }
        validateOrder(movements, type, occurredAt);
        occurredAt = occurredAt.truncatedTo(ChronoUnit.MICROS);

        if (existing == null) {
            var movement = new StayActualMovement(new StayActualMovementId(stayId, type), occurredAt, actor);
            movements.put(type, movementRepository.saveAndFlush(movement));
        } else if (!existing.occurredAt().equals(occurredAt)) {
            existing.correct(occurredAt, actor);
            movementRepository.flush();
        }
        return toResponse(stay, movements, actor);
    }

    private static void validateOrder(EnumMap<StayMovementType, StayActualMovement> movements,
                                      StayMovementType type, Instant occurredAt) {
        StayActualMovement other = movements.get(type == ARRIVAL ? DEPARTURE : ARRIVAL);
        if (other == null) return;
        Instant arrival = type == ARRIVAL ? occurredAt : other.occurredAt();
        Instant departure = type == DEPARTURE ? occurredAt : other.occurredAt();
        if (departure.isBefore(arrival)) {
            throw new BadRequestException("Actual departure must be at or after actual arrival");
        }
    }

    private static EnumMap<StayMovementType, StayActualMovement> byType(List<StayActualMovement> movements) {
        var byType = new EnumMap<StayMovementType, StayActualMovement>(StayMovementType.class);
        movements.forEach(movement -> byType.put(movement.getId().getType(), movement));
        return byType;
    }

    private static boolean canCorrect(UserAccount actor, StayActualMovement movement) {
        return actor.getRole() == UserRole.ADMIN || actor.getId().equals(movement.getRecordedById());
    }

    private static StayActualMovementsDTO toResponse(Stay stay,
                                                     EnumMap<StayMovementType, StayActualMovement> movements,
                                                     UserAccount actor) {
        boolean cancelled = stay.getCancelledAt() != null;
        return new StayActualMovementsDTO(stay.getStartAt(), stay.getEndAt(), cancelled,
                toMovement(movements.get(ARRIVAL), actor, cancelled),
                toMovement(movements.get(DEPARTURE), actor, cancelled));
    }

    private static ActualMovement toMovement(StayActualMovement movement, UserAccount actor, boolean cancelled) {
        if (movement == null) return null;
        return new ActualMovement(movement.occurredAt(), movement.revision(), movement.getRecordedBy(),
                movement.getCorrectedBy(), !cancelled && actor.isEnabled() && canCorrect(actor, movement));
    }
}
