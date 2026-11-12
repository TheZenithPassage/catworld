package com.allegaeon.catworld.service;

import com.allegaeon.catworld.dto.care.CareDayDTO;
import com.allegaeon.catworld.dto.care.CareHistoryDTO;
import com.allegaeon.catworld.dto.care.CareRecordDTO;
import com.allegaeon.catworld.dto.care.CareRecordRequestDTO;
import com.allegaeon.catworld.dto.care.CareRoutineDTO;
import com.allegaeon.catworld.dto.care.CareRoutineRequestDTO;
import com.allegaeon.catworld.exception.BadRequestException;
import com.allegaeon.catworld.exception.ConflictException;
import com.allegaeon.catworld.exception.ForbiddenException;
import com.allegaeon.catworld.exception.ResourceNotFoundException;
import com.allegaeon.catworld.mapper.CareMapper;
import com.allegaeon.catworld.model.CareMode;
import com.allegaeon.catworld.model.CareRecord;
import com.allegaeon.catworld.model.CareRoutine;
import com.allegaeon.catworld.model.Stay;
import com.allegaeon.catworld.model.StayCat;
import com.allegaeon.catworld.model.StayCatId;
import com.allegaeon.catworld.model.UserRole;
import com.allegaeon.catworld.repository.CareRecordRepository;
import com.allegaeon.catworld.repository.CareRoutineRepository;
import com.allegaeon.catworld.repository.StayCatRepository;
import com.allegaeon.catworld.repository.StayRepository;
import com.allegaeon.catworld.security.CurrentUserAccountService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CareService {

    private final StayRepository stays;
    private final StayCatRepository stayCats;
    private final CareRoutineRepository routines;
    private final CareRecordRepository records;
    private final CurrentUserAccountService accounts;
    private final Clock clock;

    @Transactional(readOnly = true)
    public CareDayDTO day(LocalDate requestedDate) {
        LocalDate today = LocalDate.now(clock);
        LocalDate date = requestedDate == null ? today : requestedDate;
        LocalDateTime nextMidnight = date.equals(LocalDate.MAX)
                ? LocalDateTime.MAX : date.plusDays(1).atStartOfDay();
        List<StayCat> links = stayCats.findOnBusinessDay(date.atStartOfDay(), nextMidnight);
        List<UUID> stayIds = links.stream().map(link -> link.getId().getStayId()).distinct().toList();
        Map<StayCatId, List<CareRecordDTO>> recordsByCat = stayIds.isEmpty() ? Map.of()
                : records.findByBusinessDateAndStay_IdInAndAnnulledAtIsNullOrderByRecordedAtAscIdAsc(date, stayIds)
                        .stream().map(CareMapper::toDTO)
                        .collect(Collectors.groupingBy(
                                record -> new StayCatId(record.stayId(), record.catId())));

        List<CareDayDTO.Cat> cats = links.stream().map(link -> new CareDayDTO.Cat(
                link.getId().getStayId(), link.getId().getCatId(), link.getCat().getName(),
                link.getCat().getFoodBrand(), link.getCat().getLitterBrand(),
                link.getStay().getStartAt(), link.getStay().getEndAt(),
                recordsByCat.getOrDefault(link.getId(), List.of())
        )).toList();
        return new CareDayDTO(date, today, activeRoutines().stream().map(CareMapper::toDTO).toList(), cats);
    }

    @Transactional(readOnly = true)
    public CareHistoryDTO history(UUID stayId) {
        Stay stay = stays.findById(stayId).orElseThrow(() -> new ResourceNotFoundException("Stay", stayId));
        return new CareHistoryDTO(
                stayId, stay.getStartAt(), stay.getEndAt(), accounts.getCurrentUserAccount().getId(),
                records.findByStay_IdOrderByBusinessDateAscRecordedAtAscIdAsc(stayId)
                        .stream().map(CareMapper::toDTO).toList()
        );
    }

    @Transactional(readOnly = true)
    public List<CareRoutineDTO> listRoutines() {
        var catalog = accounts.getCurrentUserAccount().getRole() == UserRole.ADMIN
                ? routines.findAllByOrderByNameAscIdAsc() : activeRoutines();
        return catalog.stream().map(CareMapper::toDTO).toList();
    }

    @Transactional
    public CareRoutineDTO addRoutine(CareRoutineRequestDTO request) {
        requireAdmin();
        return CareMapper.toDTO(routines.save(new CareRoutine(request.name().strip(), request.mode())));
    }

    @Transactional
    public CareRoutineDTO configureRoutine(UUID id, CareRoutineRequestDTO request) {
        requireAdmin();
        CareRoutine routine = routineForUpdate(id);
        requireActive(routine);
        routine.configure(request.name().strip(), request.mode());
        return CareMapper.toDTO(routine);
    }

    @Transactional
    public void deactivateRoutine(UUID id) {
        requireAdmin();
        routineForUpdate(id).deactivate();
    }

    @Transactional
    public CareRecordDTO record(CareRecordRequestDTO request) {
        String note = request.note() == null || request.note().isBlank() ? null : request.note().strip();
        if ((request.routineId() == null) == (note == null)) {
            throw new BadRequestException("Choose a care routine or enter a note");
        }

        // Take the same stay lock as edits, cancellation and deletion before any snapshot reads.
        Stay stay = stays.findByIdForUpdate(request.stayId())
                .orElseThrow(() -> new ResourceNotFoundException("Stay", request.stayId()));
        Instant now = clock.instant();
        LocalDate today = now.atZone(clock.getZone()).toLocalDate();
        if (!today.equals(request.businessDate())) {
            throw new ConflictException("Care can only be registered for the current business day");
        }
        if (stay.getCancelledAt() != null || stay.getStartAt().toLocalDate().isAfter(today)
                || !stay.getEndAt().isAfter(today.atStartOfDay())) {
            throw new ConflictException("The stay does not cover the current business day");
        }
        StayCat link = stayCats.findById(new StayCatId(request.stayId(), request.catId()))
                .orElseThrow(() -> new BadRequestException("The cat does not belong to this stay"));

        CareRoutine routine = null;
        if (request.routineId() != null) {
            routine = routines.findByIdForRead(request.routineId())
                    .orElseThrow(() -> new ResourceNotFoundException("Care routine", request.routineId()));
            requireActive(routine);
            if (request.expectedMode() != null && request.expectedMode() != routine.getMode()) {
                throw new ConflictException("The care routine frequency changed");
            }
        }
        boolean needsShift = routine != null && routine.getMode() == CareMode.SHIFT;
        if (needsShift != (request.shift() != null)) {
            throw new BadRequestException("A shift is required only for a shift-based care routine");
        }
        if (routine != null) {
            String slot = CareRecord.slotFor(routine.getMode(), request.shift());
            if (slot != null) {
                var existing = records.findByStay_IdAndCatIdAndBusinessDateAndRoutineIdAndActiveSlot(
                        request.stayId(), request.catId(), today, routine.getId(), slot);
                if (existing.isPresent()) {
                    return CareMapper.toDTO(existing.get());
                }
            }
        }

        var actor = accounts.getCurrentUserAccount();
        var record = new CareRecord(stay, link.getCat(), today, now, routine, request.shift(), note, actor);
        return CareMapper.toDTO(records.save(record));
    }

    @Transactional
    public CareRecordDTO annul(UUID id) {
        CareRecord record = records.findByIdForUpdate(id)
                .orElseThrow(() -> new ResourceNotFoundException("Care record", id));
        var actor = accounts.getCurrentUserAccount();
        if (actor.getRole() != UserRole.ADMIN && !actor.getId().equals(record.getAuthorId())) {
            throw new ForbiddenException("Only the author or an administrator can annul a care record");
        }
        record.annul(clock.instant(), actor);
        return CareMapper.toDTO(record);
    }

    private List<CareRoutine> activeRoutines() {
        return routines.findAllByActiveTrueOrderByNameAscIdAsc();
    }

    private CareRoutine routineForUpdate(UUID id) {
        return routines.findByIdForUpdate(id).orElseThrow(() -> new ResourceNotFoundException("Care routine", id));
    }

    private void requireActive(CareRoutine routine) {
        if (!routine.isActive()) {
            throw new ConflictException("The care routine is inactive");
        }
    }

    private void requireAdmin() {
        if (accounts.getCurrentUserAccount().getRole() != UserRole.ADMIN) {
            throw new ForbiddenException("Only administrators can configure care routines");
        }
    }
}
