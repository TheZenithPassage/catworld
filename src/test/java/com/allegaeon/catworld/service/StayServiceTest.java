package com.allegaeon.catworld.service;

import com.allegaeon.catworld.dto.StayRequestDTO;
import com.allegaeon.catworld.dto.StayResponseDTO;
import com.allegaeon.catworld.dto.StayUpdateDTO;
import com.allegaeon.catworld.exception.BadRequestException;
import com.allegaeon.catworld.exception.ConflictException;
import com.allegaeon.catworld.exception.ForbiddenException;
import com.allegaeon.catworld.mapper.StayMapper;
import com.allegaeon.catworld.model.Cat;
import com.allegaeon.catworld.model.Owner;
import com.allegaeon.catworld.model.Stay;
import com.allegaeon.catworld.model.StayCat;
import com.allegaeon.catworld.model.UserAccount;
import com.allegaeon.catworld.repository.CatRepository;
import com.allegaeon.catworld.repository.StayRepository;
import com.allegaeon.catworld.security.CurrentUserAccountService;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.InjectMocks;
import org.mockito.InOrder;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.DataIntegrityViolationException;
import static org.mockito.Mockito.*;
import static org.junit.jupiter.api.Assertions.*;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@ExtendWith(MockitoExtension.class)
public class StayServiceTest {

    @Mock
    private StayRepository stayRepository;

    @Mock
    private StayMapper stayMapper;

    @Mock
    private CatRepository catRepository;

    @Mock
    private CurrentUserAccountService currentUserAccountService;

    @Mock
    private DeletionAuthorizationPolicy deletionAuthorizationPolicy;

    @InjectMocks
    private StayService service;

    @Captor
    private ArgumentCaptor<Stay> stayCaptor;

    @Nested
    class CreateStayTests {

        @Test
        public void shouldThrowBadRequest_whenEndDateIsNotAfterStartDate() {

            LocalDateTime startAt = LocalDateTime.now().plusDays(2);
            LocalDateTime endAt = startAt.minusDays(1);

            assertThrows(BadRequestException.class, () -> {
                service.createStay(StayRequestDTO.builder()
                        .startAt(startAt)
                        .endAt(endAt)
                        .catIds(Set.of(UUID.randomUUID()))
                        .build());
            });

        }

        @Test
        public void shouldThrowBadRequest_whenCatsHaveDifferentOwner() {

            LocalDateTime startAt = LocalDateTime.now().plusDays(2);
            LocalDateTime endAt = startAt.plusDays(7);

            Cat cat1 = Cat.builder()
                    .id(UUID.randomUUID())
                    .owner(Owner.builder()
                            .id(UUID.randomUUID())
                            .build())
                    .build();

            Cat cat2 = Cat.builder()
                    .id(UUID.randomUUID())
                    .owner(Owner.builder()
                            .id(UUID.randomUUID())
                            .build())
                    .build();

            when(catRepository.findById(cat1.getId())).thenReturn(Optional.of(cat1));
            when(catRepository.findById(cat2.getId())).thenReturn(Optional.of(cat2));

            assertThrows(BadRequestException.class, () -> {
                service.createStay(StayRequestDTO.builder()
                        .startAt(startAt)
                        .endAt(endAt)
                        .catIds(Set.of(cat1.getId(), cat2.getId()))
                        .build());
            });

        }

        @Test
        public void shouldThrowConflict_whenCatHasOverbooking() {

            LocalDateTime existingStartAt = LocalDateTime.now().plusDays(1);
            LocalDateTime existingEndAt = existingStartAt.plusDays(11);
            LocalDateTime requestedStartAt = existingStartAt.plusDays(8);
            LocalDateTime requestedEndAt = requestedStartAt.plusDays(7);

            Stay existingStay = Stay.builder()
                    .id(UUID.randomUUID())
                    .startAt(existingStartAt)
                    .endAt(existingEndAt)
                    .build();

            Cat cat = Cat.builder()
                    .id(UUID.randomUUID())
                    .name("Cat 1")
                    .owner(Owner.builder()
                            .id(UUID.randomUUID())
                            .build())
                    .build();

            linkStayAndCat(existingStay, cat);

            when(catRepository.findById(cat.getId())).thenReturn(Optional.of(cat));

            assertThrows(ConflictException.class, () -> {
                service.createStay(StayRequestDTO.builder()
                        .startAt(requestedStartAt)
                        .endAt(requestedEndAt)
                        .catIds(Set.of(cat.getId()))
                        .build());
            });

        }

        @Test
        public void shouldCreateStay_whenReceivingOnlyOneCat() {

            LocalDateTime startAt = LocalDateTime.now().plusDays(1);
            LocalDateTime endAt = startAt.plusDays(18);

            Owner owner = Owner.builder()
                    .id(UUID.randomUUID())
                    .fullName("Owner")
                    .build();

            Cat cat = Cat.builder()
                    .id(UUID.randomUUID())
                    .name("Cat")
                    .owner(owner)
                    .build();

            StayRequestDTO stayRequestDTO = StayRequestDTO.builder()
                    .startAt(startAt)
                    .endAt(endAt)
                    .catIds(Set.of(cat.getId()))
                    .build();

            Stay mappedStay = Stay.builder()
                    .startAt(stayRequestDTO.getStartAt())
                    .endAt(stayRequestDTO.getEndAt())
                    .build();

            StayResponseDTO expectedResponseDTO = new StayResponseDTO();
            UserAccount creator = UserAccount.builder()
                    .id(UUID.randomUUID())
                    .username("staff")
                    .build();

            when(stayRepository.save(any(Stay.class))).thenAnswer(i -> i.getArgument(0));
            when(catRepository.findById(cat.getId())).thenReturn(Optional.of(cat));
            when(stayMapper.toEntity(stayRequestDTO)).thenReturn(mappedStay);
            when(currentUserAccountService.getCurrentUserAccount()).thenReturn(creator);
            when(deletionAuthorizationPolicy.canDelete(any(), any())).thenReturn(true);
            when(stayMapper.toResponseDTO(any(Stay.class), eq(true))).thenReturn(expectedResponseDTO);

            StayResponseDTO result = service.createStay(stayRequestDTO);

            assertSame(expectedResponseDTO, result);

            verify(stayRepository).save(stayCaptor.capture());
            Stay savedStay = stayCaptor.getValue();

            assertEquals(stayRequestDTO.getStartAt(), savedStay.getStartAt());
            assertEquals(stayRequestDTO.getEndAt(), savedStay.getEndAt());
            assertEquals(owner.getId(), savedStay.getOwner().getId());
            assertSame(creator, savedStay.getCreatedBy());

            Set<UUID> savedCatIds = savedStay.getStayCats().stream().map(stayCat -> stayCat.getCat().getId()).collect(Collectors.toSet());

            assertEquals(Set.of(cat.getId()), savedCatIds);

        }

        @Test
        public void shouldCreateStay_whenReceivingMultipleCatsWithSameOwner() {

            LocalDateTime startAt = LocalDateTime.now().plusDays(1);
            LocalDateTime endAt = startAt.plusDays(18);

            Owner owner = Owner.builder()
                    .id(UUID.randomUUID())
                    .fullName("Owner")
                    .build();

            Cat cat1 = Cat.builder()
                    .id(UUID.randomUUID())
                    .name("Cat 1")
                    .owner(owner)
                    .build();

            Cat cat2 = Cat.builder()
                    .id(UUID.randomUUID())
                    .name("Cat 2")
                    .owner(owner)
                    .build();

            StayRequestDTO stayRequestDTO = StayRequestDTO.builder()
                    .startAt(startAt)
                    .endAt(endAt)
                    .catIds(Set.of(cat1.getId(), cat2.getId()))
                    .build();

            Stay mappedStay = Stay.builder()
                    .startAt(stayRequestDTO.getStartAt())
                    .endAt(stayRequestDTO.getEndAt())
                    .build();

            StayResponseDTO expectedResponseDTO = new StayResponseDTO();
            UserAccount creator = UserAccount.builder()
                    .id(UUID.randomUUID())
                    .username("staff")
                    .build();

            when(stayRepository.save(any(Stay.class))).thenAnswer(i -> i.getArgument(0));
            when(catRepository.findById(cat1.getId())).thenReturn(Optional.of(cat1));
            when(catRepository.findById(cat2.getId())).thenReturn(Optional.of(cat2));
            when(stayMapper.toEntity(stayRequestDTO)).thenReturn(mappedStay);
            when(currentUserAccountService.getCurrentUserAccount()).thenReturn(creator);
            when(deletionAuthorizationPolicy.canDelete(any(), any())).thenReturn(true);
            when(stayMapper.toResponseDTO(any(Stay.class), eq(true))).thenReturn(expectedResponseDTO);

            StayResponseDTO result = service.createStay(stayRequestDTO);

            assertSame(expectedResponseDTO, result);

            verify(stayRepository).save(stayCaptor.capture());
            Stay savedStay = stayCaptor.getValue();

            assertEquals(stayRequestDTO.getStartAt(), savedStay.getStartAt());
            assertEquals(stayRequestDTO.getEndAt(), savedStay.getEndAt());
            assertEquals(owner.getId(), savedStay.getOwner().getId());
            assertSame(creator, savedStay.getCreatedBy());

            Set<UUID> savedCatIds = savedStay.getStayCats().stream().map(stayCat -> stayCat.getCat().getId()).collect(Collectors.toSet());

            assertEquals(Set.of(cat1.getId(), cat2.getId()), savedCatIds);

        }

        @Test
        public void shouldCreateStay_whenOverlappingStayIsCancelled() {

            LocalDateTime requestedStartAt = LocalDateTime.now().plusDays(1);
            LocalDateTime requestedEndAt = requestedStartAt.plusDays(18);
            LocalDateTime cancelledStartAt = requestedStartAt.minusDays(1);
            LocalDateTime cancelledEndAt = requestedStartAt.plusDays(10);

            Owner owner = Owner.builder()
                    .id(UUID.randomUUID())
                    .fullName("Owner")
                    .build();

            Cat cat = Cat.builder()
                    .id(UUID.randomUUID())
                    .name("Cat")
                    .owner(owner)
                    .build();

            StayRequestDTO stayRequestDTO = StayRequestDTO.builder()
                    .startAt(requestedStartAt)
                    .endAt(requestedEndAt)
                    .catIds(Set.of(cat.getId()))
                    .build();

            Stay cancelledStay = Stay.builder()
                    .id(UUID.randomUUID())
                    .startAt(cancelledStartAt)
                    .endAt(cancelledEndAt)
                    .cancelledAt(LocalDateTime.now().minusDays(1))
                    .build();

            linkStayAndCat(cancelledStay, cat);

            Stay mappedStay = Stay.builder()
                    .startAt(stayRequestDTO.getStartAt())
                    .endAt(stayRequestDTO.getEndAt())
                    .build();

            StayResponseDTO expectedResponseDTO = new StayResponseDTO();
            UserAccount creator = UserAccount.builder()
                    .id(UUID.randomUUID())
                    .username("staff")
                    .build();

            when(stayRepository.save(any(Stay.class))).thenAnswer(i -> i.getArgument(0));
            when(catRepository.findById(cat.getId())).thenReturn(Optional.of(cat));
            when(stayMapper.toEntity(stayRequestDTO)).thenReturn(mappedStay);
            when(currentUserAccountService.getCurrentUserAccount()).thenReturn(creator);
            when(deletionAuthorizationPolicy.canDelete(any(), any())).thenReturn(true);
            when(stayMapper.toResponseDTO(any(Stay.class), eq(true))).thenReturn(expectedResponseDTO);

            StayResponseDTO result = assertDoesNotThrow(() -> service.createStay(stayRequestDTO));

            assertSame(expectedResponseDTO, result);

            verify(stayRepository).save(stayCaptor.capture());
            Stay savedStay = stayCaptor.getValue();

            assertEquals(stayRequestDTO.getStartAt(), savedStay.getStartAt());
            assertEquals(stayRequestDTO.getEndAt(), savedStay.getEndAt());
            assertEquals(owner.getId(), savedStay.getOwner().getId());
            assertSame(creator, savedStay.getCreatedBy());

            Set<UUID> savedCatIds = savedStay.getStayCats().stream().map(stayCat -> stayCat.getCat().getId()).collect(Collectors.toSet());

            assertEquals(Set.of(cat.getId()), savedCatIds);

        }

    }

    @Nested
    class CancelStayTests {

        @Test
        public void shouldCancelStaySuccessfully() {

            LocalDateTime startAt = LocalDateTime.now().plusDays(1);
            LocalDateTime endAt = startAt.plusDays(11);

            Stay stay = Stay.builder()
                    .id(UUID.randomUUID())
                    .startAt(startAt)
                    .endAt(endAt)
                    .build();

            when(stayRepository.findById(stay.getId())).thenReturn(Optional.of(stay));

            service.cancelStay(stay.getId());

            assertNotNull(stay.getCancelledAt());

        }

        @Test
        public void shouldThrowConflict_whenStayIsAlreadyCancelled() {

            LocalDateTime startAt = LocalDateTime.now().plusDays(1);
            LocalDateTime endAt = startAt.plusDays(11);

            Stay stay = Stay.builder()
                    .id(UUID.randomUUID())
                    .startAt(startAt)
                    .endAt(endAt)
                    .cancelledAt(LocalDateTime.now().minusDays(1))
                    .build();

            when(stayRepository.findById(stay.getId())).thenReturn(Optional.of(stay));

            assertThrows(ConflictException.class, () -> service.cancelStay(stay.getId()));

        }

        @Test
        public void shouldThrowConflict_whenStayIsCheckedOut() {

            LocalDateTime startAt = LocalDateTime.now().minusDays(11);
            LocalDateTime endAt = startAt.plusDays(10);

            Stay stay = Stay.builder()
                    .id(UUID.randomUUID())
                    .startAt(startAt)
                    .endAt(endAt)
                    .build();

            when(stayRepository.findById(stay.getId())).thenReturn(Optional.of(stay));

            assertThrows(ConflictException.class, () -> service.cancelStay(stay.getId()));

        }

    }

    @Nested
    class DeleteStayTests {

        @Test
        void deleteStayAuthorizesBeforeDeletingStay() {

            Stay stay = stayWithCreator(
                    LocalDateTime.now().plusDays(1),
                    LocalDateTime.now().plusDays(5),
                    null);

            when(stayRepository.findById(stay.getId())).thenReturn(Optional.of(stay));

            service.deleteStay(stay.getId());

            InOrder inOrder = inOrder(deletionAuthorizationPolicy, stayRepository);
            inOrder.verify(deletionAuthorizationPolicy).authorize(stay.getCreatedBy(), stay.getCreatedAt());
            inOrder.verify(stayRepository).delete(stay);
            inOrder.verify(stayRepository).flush();

        }

        @Test
        void deleteStayDoesNotDeleteWhenAuthorizationFails() {

            Stay stay = stayWithCreator(
                    LocalDateTime.now().plusDays(1),
                    LocalDateTime.now().plusDays(5),
                    null);

            when(stayRepository.findById(stay.getId())).thenReturn(Optional.of(stay));
            doThrow(new ForbiddenException("Forbidden"))
                    .when(deletionAuthorizationPolicy).authorize(stay.getCreatedBy(), stay.getCreatedAt());

            assertThrows(ForbiddenException.class, () -> service.deleteStay(stay.getId()));

            verify(stayRepository, never()).delete(any(Stay.class));
            verify(stayRepository, never()).flush();

        }

        @Test
        void deleteStayTranslatesIntegrityConflict() {

            Stay stay = stayWithCreator(
                    LocalDateTime.now().plusDays(1),
                    LocalDateTime.now().plusDays(5),
                    null);

            when(stayRepository.findById(stay.getId())).thenReturn(Optional.of(stay));
            doThrow(new DataIntegrityViolationException("constraint conflict")).when(stayRepository).flush();

            assertThrows(ConflictException.class, () -> service.deleteStay(stay.getId()));

            verify(stayRepository).delete(stay);
            verify(stayRepository).flush();

        }

        @Test
        void deleteStayAllowsAnyDynamicStatusWhenAuthorizationPasses() {

            LocalDateTime now = LocalDateTime.now();
            List<Stay> stays = List.of(
                    stayWithCreator(now.plusDays(1), now.plusDays(5), now.minusHours(1)),
                    stayWithCreator(now.plusDays(1), now.plusDays(5), null),
                    stayWithCreator(now.minusDays(1), now.plusDays(1), null),
                    stayWithCreator(now.minusDays(5), now.minusDays(1), null));

            for (Stay stay : stays) {
                when(stayRepository.findById(stay.getId())).thenReturn(Optional.of(stay));
            }

            for (Stay stay : stays) {
                assertDoesNotThrow(() -> service.deleteStay(stay.getId()));
            }

            for (Stay stay : stays) {
                verify(stayRepository).delete(stay);
                verify(deletionAuthorizationPolicy).authorize(stay.getCreatedBy(), stay.getCreatedAt());
            }
            verify(stayRepository, times(stays.size())).flush();

        }

    }

    @Nested
    class ResponseCanDeleteTests {

        @Test
        void getStayPassesAllowedCanDeleteToMapper() {

            Stay stay = stayWithCreator(
                    LocalDateTime.now().plusDays(1),
                    LocalDateTime.now().plusDays(5),
                    null);
            StayResponseDTO expectedResponseDTO = new StayResponseDTO();

            when(stayRepository.findById(stay.getId())).thenReturn(Optional.of(stay));
            when(deletionAuthorizationPolicy.canDelete(stay.getCreatedBy(), stay.getCreatedAt())).thenReturn(true);
            when(stayMapper.toResponseDTO(stay, true)).thenReturn(expectedResponseDTO);

            StayResponseDTO result = service.getStay(stay.getId());

            assertSame(expectedResponseDTO, result);
            verify(stayMapper).toResponseDTO(stay, true);

        }

        @Test
        void getStayPassesDeniedCanDeleteToMapper() {

            Stay stay = stayWithCreator(
                    LocalDateTime.now().plusDays(1),
                    LocalDateTime.now().plusDays(5),
                    null);
            StayResponseDTO expectedResponseDTO = new StayResponseDTO();

            when(stayRepository.findById(stay.getId())).thenReturn(Optional.of(stay));
            when(deletionAuthorizationPolicy.canDelete(stay.getCreatedBy(), stay.getCreatedAt())).thenReturn(false);
            when(stayMapper.toResponseDTO(stay, false)).thenReturn(expectedResponseDTO);

            StayResponseDTO result = service.getStay(stay.getId());

            assertSame(expectedResponseDTO, result);
            verify(stayMapper).toResponseDTO(stay, false);

        }

        @Test
        void getAllStaysCalculatesCanDeleteForEachStay() {

            Stay allowedStay = stayWithCreator(
                    LocalDateTime.now().plusDays(1),
                    LocalDateTime.now().plusDays(5),
                    null);
            Stay deniedStay = stayWithCreator(
                    LocalDateTime.now().plusDays(6),
                    LocalDateTime.now().plusDays(10),
                    null);
            StayResponseDTO allowedResponse = new StayResponseDTO();
            StayResponseDTO deniedResponse = new StayResponseDTO();

            when(stayRepository.findAll()).thenReturn(List.of(allowedStay, deniedStay));
            when(deletionAuthorizationPolicy.canDelete(allowedStay.getCreatedBy(), allowedStay.getCreatedAt())).thenReturn(true);
            when(deletionAuthorizationPolicy.canDelete(deniedStay.getCreatedBy(), deniedStay.getCreatedAt())).thenReturn(false);
            when(stayMapper.toResponseDTO(allowedStay, true)).thenReturn(allowedResponse);
            when(stayMapper.toResponseDTO(deniedStay, false)).thenReturn(deniedResponse);

            List<StayResponseDTO> result = service.getAllStays();

            assertEquals(List.of(allowedResponse, deniedResponse), result);
            verify(stayMapper).toResponseDTO(allowedStay, true);
            verify(stayMapper).toResponseDTO(deniedStay, false);

        }

    }

    @Nested
    class UpdateStayTests {

        @Test
        public void shouldThrowBadRequest_whenEndDateIsNotAfterStartDate() {

            LocalDateTime startAt = LocalDateTime.now().plusDays(2);
            LocalDateTime endAt = startAt.minusDays(1);

            assertThrows(BadRequestException.class, () -> {
                service.updateStay(UUID.randomUUID(), StayUpdateDTO.builder()
                        .startAt(startAt)
                        .endAt(endAt)
                        .build());
            });

        }

        @Test
        public void shouldThrowConflict_whenStayIsCancelled() {

            LocalDateTime startAt = LocalDateTime.now().plusDays(1);
            LocalDateTime endAt = startAt.plusDays(4);
            LocalDateTime updateStartAt = endAt.plusDays(2);
            LocalDateTime updateEndAt = updateStartAt.plusDays(10);

            Stay stay = Stay.builder()
                    .id(UUID.randomUUID())
                    .startAt(startAt)
                    .endAt(endAt)
                    .cancelledAt(LocalDateTime.now().minusDays(1))
                    .build();

            StayUpdateDTO requestDto = StayUpdateDTO.builder()
                    .startAt(updateStartAt)
                    .endAt(updateEndAt)
                    .build();

            when(stayRepository.findById(stay.getId())).thenReturn(Optional.of(stay));

            assertThrows(ConflictException.class, () -> service.updateStay(stay.getId(), requestDto));

        }

        @Test
        public void shouldThrowConflict_whenStayIsCheckedOut() {

            LocalDateTime startAt = LocalDateTime.now().minusDays(10);
            LocalDateTime endAt = startAt.plusDays(5);
            LocalDateTime updateStartAt = LocalDateTime.now().plusDays(1);
            LocalDateTime updateEndAt = updateStartAt.plusDays(10);

            Stay stay = Stay.builder()
                    .id(UUID.randomUUID())
                    .startAt(startAt)
                    .endAt(endAt)
                    .build();

            StayUpdateDTO requestDto = StayUpdateDTO.builder()
                    .startAt(updateStartAt)
                    .endAt(updateEndAt)
                    .build();

            when(stayRepository.findById(stay.getId())).thenReturn(Optional.of(stay));

            assertThrows(ConflictException.class, () -> service.updateStay(stay.getId(), requestDto));

        }

        @Test
        public void shouldThrowConflict_whenCatHasOverbooking() {

            LocalDateTime overbookingStartAt = LocalDateTime.now().plusDays(10);
            LocalDateTime overbookingEndAt = overbookingStartAt.plusDays(11);
            LocalDateTime stayToModifyStartAt = overbookingEndAt.plusDays(10);
            LocalDateTime stayToModifyEndAt = stayToModifyStartAt.plusDays(11);
            LocalDateTime updateStartAt = overbookingStartAt.plusDays(8);
            LocalDateTime updateEndAt = updateStartAt.plusDays(7);

            Stay overbookingStay = Stay.builder()
                    .id(UUID.randomUUID())
                    .startAt(overbookingStartAt)
                    .endAt(overbookingEndAt)
                    .build();

            Stay stayToModify = Stay.builder()
                    .id(UUID.randomUUID())
                    .startAt(stayToModifyStartAt)
                    .endAt(stayToModifyEndAt)
                    .build();

            Cat cat = Cat.builder()
                    .id(UUID.randomUUID())
                    .name("Cat 1")
                    .owner(Owner.builder()
                            .id(UUID.randomUUID())
                            .build())
                    .build();

            StayUpdateDTO updateDto = StayUpdateDTO.builder()
                    .startAt(updateStartAt)
                    .endAt(updateEndAt)
                    .build();

            linkStayAndCat(overbookingStay, cat);
            linkStayAndCat(stayToModify, cat);

            when(stayRepository.findById(stayToModify.getId())).thenReturn(Optional.of(stayToModify));
            when(stayMapper.updateEntity(stayToModify, updateDto)).thenReturn(stayToModify);

            assertThrows(ConflictException.class, () -> {
                service.updateStay(stayToModify.getId(), updateDto);
            });

        }

        @Test
        public void shouldUpdateStaySuccessfully() {

            LocalDateTime startAt = LocalDateTime.now().plusDays(1);
            LocalDateTime endAt = startAt.plusDays(41);
            LocalDateTime updateStartAt = startAt.plusDays(8);
            LocalDateTime updateEndAt = updateStartAt.plusDays(7);

            Stay stay = Stay.builder()
                    .id(UUID.randomUUID())
                    .startAt(startAt)
                    .endAt(endAt)
                    .build();

            StayUpdateDTO updateDto = StayUpdateDTO.builder()
                    .startAt(updateStartAt)
                    .endAt(updateEndAt)
                    .notes("This is a note")
                    .build();

            Cat cat = Cat.builder()
                    .id(UUID.randomUUID())
                    .name("Cat 1")
                    .owner(Owner.builder()
                            .id(UUID.randomUUID())
                            .build())
                    .build();

            StayCat stayCat = linkStayAndCat(stay, cat);

            StayResponseDTO expectedResponseDTO = new StayResponseDTO();

            Stay updatedStay = Stay.builder()
                    .id(stay.getId())
                    .startAt(updateDto.getStartAt())
                    .endAt(updateDto.getEndAt())
                    .notes(updateDto.getNotes())
                    .stayCats(Set.of(stayCat))
                    .build();

            when(stayRepository.findById(stay.getId())).thenReturn(Optional.of(stay));
            when(stayMapper.updateEntity(stay, updateDto)).thenReturn(updatedStay);
            when(stayRepository.save(updatedStay)).thenReturn(updatedStay);
            when(deletionAuthorizationPolicy.canDelete(any(), any())).thenReturn(true);
            when(stayMapper.toResponseDTO(updatedStay, true)).thenReturn(expectedResponseDTO);

            StayResponseDTO result = service.updateStay(stay.getId(), updateDto);

            assertSame(expectedResponseDTO, result);

            verify(stayMapper).updateEntity(stay, updateDto);
            verify(stayRepository).save(updatedStay);
            verify(stayMapper).toResponseDTO(updatedStay, true);

        }

        @Test
        public void shouldUpdateStay_whenOnlyOverlapIsSameStay() {

            LocalDateTime startAt = LocalDateTime.now().plusDays(1);
            LocalDateTime endAt = startAt.plusDays(41);
            LocalDateTime updateStartAt = startAt.plusDays(8);
            LocalDateTime updateEndAt = updateStartAt.plusDays(7);

            Stay stay = Stay.builder()
                    .id(UUID.randomUUID())
                    .startAt(startAt)
                    .endAt(endAt)
                    .build();

            Cat cat = Cat.builder()
                    .id(UUID.randomUUID())
                    .name("Cat 1")
                    .owner(Owner.builder()
                            .id(UUID.randomUUID())
                            .build())
                    .build();

            StayCat stayCat = linkStayAndCat(stay, cat);

            StayUpdateDTO updateDto = StayUpdateDTO.builder()
                    .startAt(updateStartAt)
                    .endAt(updateEndAt)
                    .build();

            StayResponseDTO expectedResponseDTO = new StayResponseDTO();

            Stay updatedStay = Stay.builder()
                    .id(stay.getId())
                    .startAt(updateDto.getStartAt())
                    .endAt(updateDto.getEndAt())
                    .notes(updateDto.getNotes())
                    .stayCats(Set.of(stayCat))
                    .build();

            when(stayRepository.findById(stay.getId())).thenReturn(Optional.of(stay));
            when(stayMapper.updateEntity(stay, updateDto)).thenReturn(updatedStay);
            when(stayRepository.save(updatedStay)).thenReturn(updatedStay);
            when(deletionAuthorizationPolicy.canDelete(any(), any())).thenReturn(true);
            when(stayMapper.toResponseDTO(updatedStay, true)).thenReturn(expectedResponseDTO);

            StayResponseDTO result = assertDoesNotThrow(() -> service.updateStay(stay.getId(), updateDto));

            assertSame(expectedResponseDTO, result);

            verify(stayMapper).updateEntity(stay, updateDto);
            verify(stayRepository).save(updatedStay);
            verify(stayMapper).toResponseDTO(updatedStay, true);

        }

        @Test
        public void shouldUpdateStay_whenOverlappingStayIsCancelled() {

            LocalDateTime cancelledStartAt = LocalDateTime.now().plusDays(1);
            LocalDateTime cancelledEndAt = cancelledStartAt.plusDays(41);
            LocalDateTime activeStartAt = cancelledEndAt.plusDays(10);
            LocalDateTime activeEndAt = activeStartAt.plusDays(7);
            LocalDateTime updateStartAt = cancelledStartAt.plusDays(8);
            LocalDateTime updateEndAt = updateStartAt.plusDays(7);

            Stay cancelledStay = Stay.builder()
                    .id(UUID.randomUUID())
                    .startAt(cancelledStartAt)
                    .endAt(cancelledEndAt)
                    .cancelledAt(LocalDateTime.now().minusDays(1))
                    .build();

            Stay activeStay = Stay.builder()
                    .id(UUID.randomUUID())
                    .startAt(activeStartAt)
                    .endAt(activeEndAt)
                    .build();

            Cat cat = Cat.builder()
                    .id(UUID.randomUUID())
                    .name("Cat 1")
                    .owner(Owner.builder()
                            .id(UUID.randomUUID())
                            .build())
                    .build();

            linkStayAndCat(cancelledStay, cat);
            StayCat activeStayCat = linkStayAndCat(activeStay, cat);

            StayUpdateDTO updateDto = StayUpdateDTO.builder()
                    .startAt(updateStartAt)
                    .endAt(updateEndAt)
                    .build();

            StayResponseDTO expectedResponseDTO = new StayResponseDTO();

            Stay updatedStay = Stay.builder()
                    .id(activeStay.getId())
                    .startAt(updateDto.getStartAt())
                    .endAt(updateDto.getEndAt())
                    .notes(updateDto.getNotes())
                    .stayCats(Set.of(activeStayCat))
                    .build();

            when(stayRepository.findById(activeStay.getId())).thenReturn(Optional.of(activeStay));
            when(stayMapper.updateEntity(activeStay, updateDto)).thenReturn(updatedStay);
            when(stayRepository.save(updatedStay)).thenReturn(updatedStay);
            when(deletionAuthorizationPolicy.canDelete(any(), any())).thenReturn(true);
            when(stayMapper.toResponseDTO(updatedStay, true)).thenReturn(expectedResponseDTO);

            StayResponseDTO result = assertDoesNotThrow(() -> service.updateStay(activeStay.getId(), updateDto));

            assertSame(expectedResponseDTO, result);

            verify(stayMapper).updateEntity(activeStay, updateDto);
            verify(stayRepository).save(updatedStay);
            verify(stayMapper).toResponseDTO(updatedStay, true);

        }

    }

    private StayCat linkStayAndCat(Stay stay, Cat cat) {

        StayCat stayCat = StayCat.builder()
                .stay(stay)
                .cat(cat)
                .build();

        stay.getStayCats().add(stayCat);
        cat.getStayCats().add(stayCat);

        return stayCat;

    }

    private Stay stayWithCreator(LocalDateTime startAt, LocalDateTime endAt, LocalDateTime cancelledAt) {

        Stay stay = Stay.builder()
                .id(UUID.randomUUID())
                .startAt(startAt)
                .endAt(endAt)
                .cancelledAt(cancelledAt)
                .createdBy(UserAccount.builder()
                        .id(UUID.randomUUID())
                        .username("creator")
                        .build())
                .build();
        stay.setCreatedAt(Instant.now());

        return stay;

    }

}
