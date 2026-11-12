package com.allegaeon.catworld.service;

import com.allegaeon.catworld.dto.operations.OperationsTaskCreateRequest;
import com.allegaeon.catworld.dto.operations.OperationsTaskResolutionRequest;
import com.allegaeon.catworld.dto.operations.OperationsTaskResponse;
import com.allegaeon.catworld.dto.operations.OperationsTaskResponse.Attribution;
import com.allegaeon.catworld.dto.operations.OperationsTaskResponse.Bucket;
import com.allegaeon.catworld.exception.BadRequestException;
import com.allegaeon.catworld.exception.ConflictException;
import com.allegaeon.catworld.exception.ResourceNotFoundException;
import com.allegaeon.catworld.model.OperationsTask;
import com.allegaeon.catworld.model.OperationsTaskTransition;
import com.allegaeon.catworld.model.Stay;
import com.allegaeon.catworld.repository.OperationsTaskRepository;
import com.allegaeon.catworld.repository.OperationsTaskTransitionRepository;
import com.allegaeon.catworld.repository.StayRepository;
import com.allegaeon.catworld.security.CurrentUserAccountService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class OperationsTaskService {

    private final OperationsTaskRepository tasks;
    private final OperationsTaskTransitionRepository transitions;
    private final StayRepository stays;
    private final CurrentUserAccountService currentUser;
    private final Clock clock;

    @Transactional(readOnly = true)
    public List<OperationsTaskResponse> list() {
        LocalDate today = LocalDate.now(clock);
        return tasks.findCurrentTasks().stream()
                .map(snapshot -> toResponse(snapshot.getTask(), snapshot.getTransition(), today))
                .toList();
    }

    @Transactional
    public OperationsTaskResponse create(OperationsTaskCreateRequest request) {
        LocalDate dueDate = request.dueDate();
        if (dueDate != null && (dueDate.getYear() < 1000 || dueDate.getYear() > 9999)) {
            throw new BadRequestException("Task due date is outside the supported range");
        }
        Stay stay = request.stayId() == null ? null : stays.findByIdForUpdate(request.stayId())
                .orElseThrow(() -> new ResourceNotFoundException("Stay", request.stayId()));
        var actor = currentUser.getCurrentUserAccount();
        Instant now = clock.instant().truncatedTo(ChronoUnit.MICROS);
        OperationsTask task = tasks.save(OperationsTask.builder()
                .description(request.description().strip())
                .dueDate(dueDate)
                .stay(stay)
                .createdById(actor.getId())
                .createdByUsername(actor.getUsername())
                .createdAt(now)
                .build());
        return toResponse(task, null, LocalDate.ofInstant(now, clock.getZone()));
    }

    @Transactional
    public OperationsTaskResponse changeResolution(UUID id, OperationsTaskResolutionRequest request) {
        // Lock the task before the first snapshot read so a concurrent request sees the committed revision.
        OperationsTask task = tasks.findByIdForUpdate(id)
                .orElseThrow(() -> new ResourceNotFoundException("Operations task", id));
        OperationsTaskTransition latest = transitions.findFirstByTask_IdOrderByRevisionDesc(id).orElse(null);
        long revision = latest == null ? 0 : latest.getRevision();
        boolean resolved = latest != null && latest.isResolved();
        boolean changesState = resolved != request.resolved();
        boolean repeated = !changesState && request.revision() == revision - 1;
        if (request.revision() != revision && !repeated) {
            throw new ConflictException("Operations task has changed");
        }

        Instant now = clock.instant().truncatedTo(ChronoUnit.MICROS);
        if (changesState) {
            var actor = currentUser.getCurrentUserAccount();
            latest = transitions.save(OperationsTaskTransition.builder()
                    .task(task)
                    .revision(revision + 1)
                    .resolved(request.resolved())
                    .actorId(actor.getId())
                    .actorUsername(actor.getUsername())
                    .occurredAt(now)
                    .build());
        }
        return toResponse(task, latest, LocalDate.ofInstant(now, clock.getZone()));
    }

    private OperationsTaskResponse toResponse(
            OperationsTask task, OperationsTaskTransition latest, LocalDate today) {
        boolean resolved = latest != null && latest.isResolved();
        return new OperationsTaskResponse(
                task.getId(), task.getDescription(), task.getDueDate(),
                task.getStay() == null ? null : task.getStay().getId(),
                bucket(task.getDueDate(), today, resolved),
                latest == null ? 0 : latest.getRevision(),
                new Attribution(task.getCreatedById(), task.getCreatedByUsername(), task.getCreatedAt()),
                latest == null ? null : new Attribution(latest.getActorId(), latest.getActorUsername(),
                        latest.getOccurredAt()));
    }

    private Bucket bucket(LocalDate dueDate, LocalDate today, boolean resolved) {
        if (resolved) return Bucket.RESOLVED;
        if (dueDate == null) return Bucket.UNDATED;
        if (dueDate.isBefore(today)) return Bucket.OVERDUE;
        return dueDate.equals(today) ? Bucket.TODAY : Bucket.UPCOMING;
    }
}
