package com.allegaeon.catworld.service;

import com.allegaeon.catworld.dto.UserAccountCreateRequestDTO;
import com.allegaeon.catworld.dto.UserAccountResponseDTO;
import com.allegaeon.catworld.exception.BadRequestException;
import com.allegaeon.catworld.exception.ConflictException;
import com.allegaeon.catworld.exception.ForbiddenException;
import com.allegaeon.catworld.exception.ResourceNotFoundException;
import com.allegaeon.catworld.mapper.UserAccountMapper;
import com.allegaeon.catworld.model.UserAccount;
import com.allegaeon.catworld.model.UserRole;
import com.allegaeon.catworld.repository.CatRepository;
import com.allegaeon.catworld.repository.NightlyReferenceRateChangeRepository;
import com.allegaeon.catworld.repository.OwnerRepository;
import com.allegaeon.catworld.repository.StayRepository;
import com.allegaeon.catworld.repository.StayPricingDecisionRepository;
import com.allegaeon.catworld.repository.StayAgreedAmountCorrectionRepository;
import com.allegaeon.catworld.repository.StayPaymentRepository;
import com.allegaeon.catworld.repository.StayPaymentEditRepository;
import com.allegaeon.catworld.repository.StayPaymentAnnulmentRepository;
import com.allegaeon.catworld.repository.StayPaymentRemovalRepository;
import com.allegaeon.catworld.repository.UserAccountRepository;
import com.allegaeon.catworld.repository.VetRepository;
import com.allegaeon.catworld.security.CurrentUserAccountService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
import org.mockito.ArgumentCaptor;
import org.mockito.InOrder;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.security.crypto.factory.PasswordEncoderFactories;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UserAccountServiceTest {

    @Mock
    private UserAccountRepository userAccountRepository;

    @Mock
    private CurrentUserAccountService currentUserAccountService;

    @Mock
    private OwnerRepository ownerRepository;

    @Mock
    private CatRepository catRepository;

    @Mock
    private VetRepository vetRepository;

    @Mock
    private StayRepository stayRepository;

    @Mock
    private NightlyReferenceRateChangeRepository nightlyReferenceRateChangeRepository;

    @Mock
    private StayPricingDecisionRepository stayPricingDecisionRepository;

    @Mock
    private StayAgreedAmountCorrectionRepository correctionRepository;

    @Mock
    private StayPaymentRepository stayPaymentRepository;

    @Mock
    private StayPaymentEditRepository stayPaymentEditRepository;

    @Mock
    private StayPaymentAnnulmentRepository stayPaymentAnnulmentRepository;

    @Mock
    private StayPaymentRemovalRepository stayPaymentRemovalRepository;

    private final PasswordEncoder passwordEncoder = PasswordEncoderFactories.createDelegatingPasswordEncoder();
    private UserAccountService userAccountService;

    @BeforeEach
    void setUp() {
        userAccountService = new UserAccountService(
                userAccountRepository,
                new UserAccountMapper(),
                passwordEncoder,
                currentUserAccountService,
                ownerRepository,
                catRepository,
                vetRepository,
                stayRepository,
                nightlyReferenceRateChangeRepository,
                stayPricingDecisionRepository,
                correctionRepository,
                stayPaymentRepository,
                stayPaymentEditRepository,
                stayPaymentAnnulmentRepository,
                stayPaymentRemovalRepository
        );
        lenient().when(currentUserAccountService.getCurrentUserAccount())
                .thenReturn(account(UserRole.ADMIN, true));
    }

    @Test
    void createsEnabledUserWithNormalizedUsernameAndEncodedPassword() {
        UserAccountCreateRequestDTO request = UserAccountCreateRequestDTO.builder()
                .username(" New.Staff ")
                .password("plain-password")
                .role(UserRole.STAFF)
                .build();
        when(userAccountRepository.existsByUsername("new.staff")).thenReturn(false);
        when(userAccountRepository.saveAndFlush(any(UserAccount.class))).thenAnswer(invocation -> {
            UserAccount account = invocation.getArgument(0);
            account.setId(UUID.randomUUID());
            return account;
        });

        UserAccountResponseDTO response = userAccountService.createUser(request);

        ArgumentCaptor<UserAccount> accountCaptor = ArgumentCaptor.forClass(UserAccount.class);
        verify(userAccountRepository).saveAndFlush(accountCaptor.capture());
        UserAccount storedAccount = accountCaptor.getValue();
        assertEquals("new.staff", storedAccount.getUsername());
        assertEquals(UserRole.STAFF, storedAccount.getRole());
        assertTrue(storedAccount.isEnabled());
        assertNotEquals("plain-password", storedAccount.getPasswordHash());
        assertTrue(passwordEncoder.matches("plain-password", storedAccount.getPasswordHash()));
        assertEquals("new.staff", response.getUsername());
    }

    @Test
    void rejectsDuplicateNormalizedUsername() {
        UserAccountCreateRequestDTO request = UserAccountCreateRequestDTO.builder()
                .username(" Existing-User ")
                .password("password")
                .role(UserRole.STAFF)
                .build();
        when(userAccountRepository.existsByUsername("existing-user")).thenReturn(true);

        assertThrows(ConflictException.class, () -> userAccountService.createUser(request));

        verify(userAccountRepository, never()).saveAndFlush(any(UserAccount.class));
    }

    @Test
    void rejectsBlankUsernameAtServiceBoundary() {
        UserAccountCreateRequestDTO request = UserAccountCreateRequestDTO.builder()
                .username("   ")
                .password("password")
                .role(UserRole.STAFF)
                .build();

        assertThrows(BadRequestException.class, () -> userAccountService.createUser(request));

        verify(userAccountRepository, never()).existsByUsername(any());
    }

    @Test
    void preventsDemotingLastEnabledAdmin() {
        UserAccount administrator = account(UserRole.ADMIN, true);
        when(userAccountRepository.findById(administrator.getId())).thenReturn(Optional.of(administrator));
        when(userAccountRepository.findEnabledByRoleForUpdate(UserRole.ADMIN)).thenReturn(List.of(administrator));

        assertThrows(ConflictException.class,
                () -> userAccountService.changeRole(administrator.getId(), UserRole.STAFF));

        assertEquals(UserRole.ADMIN, administrator.getRole());
        verify(userAccountRepository, never())
                .updateRole(eq(administrator.getId()), eq(UserRole.STAFF), any(Instant.class));
    }

    @Test
    void allowsDemotingAdminWhenAnotherEnabledAdminExists() {
        UserAccount administrator = account(UserRole.ADMIN, true);
        UserAccount otherAdministrator = account(UserRole.ADMIN, true);
        UserAccount storedAccount = accountWithId(administrator.getId(), UserRole.STAFF, true);
        when(userAccountRepository.findById(administrator.getId()))
                .thenReturn(Optional.of(administrator), Optional.of(storedAccount));
        when(userAccountRepository.findEnabledByRoleForUpdate(UserRole.ADMIN))
                .thenReturn(List.of(administrator, otherAdministrator));

        UserAccountResponseDTO response = userAccountService.changeRole(administrator.getId(), UserRole.STAFF);

        assertEquals(UserRole.ADMIN, administrator.getRole());
        assertEquals(UserRole.STAFF, response.getRole());
        verify(userAccountRepository)
                .updateRole(eq(administrator.getId()), eq(UserRole.STAFF), any(Instant.class));
    }

    @Test
    void preventsCurrentAdminDemotionBeforeEnabledAdminValidation() {
        UserAccount administrator = account(UserRole.ADMIN, true);
        when(userAccountRepository.findById(administrator.getId())).thenReturn(Optional.of(administrator));
        when(currentUserAccountService.getCurrentUserAccount()).thenReturn(administrator);

        assertThrows(ConflictException.class,
                () -> userAccountService.changeRole(administrator.getId(), UserRole.STAFF));

        verify(userAccountRepository, never()).findEnabledByRoleForUpdate(UserRole.ADMIN);
        verify(userAccountRepository, never())
                .updateRole(eq(administrator.getId()), eq(UserRole.STAFF), any(Instant.class));
    }

    @Test
    void rejectsRoleChangeToStaffWhenStaffSnapshotIsNowLastEnabledAdmin() {
        UserAccount staffSnapshot = account(UserRole.STAFF, true);
        UserAccount currentTarget = UserAccount.builder()
                .id(staffSnapshot.getId())
                .username(staffSnapshot.getUsername())
                .passwordHash(staffSnapshot.getPasswordHash())
                .role(UserRole.ADMIN)
                .enabled(true)
                .build();
        when(userAccountRepository.findById(staffSnapshot.getId())).thenReturn(Optional.of(staffSnapshot));
        when(userAccountRepository.findEnabledByRoleForUpdate(UserRole.ADMIN)).thenReturn(List.of(currentTarget));

        assertThrows(ConflictException.class,
                () -> userAccountService.changeRole(staffSnapshot.getId(), UserRole.STAFF));

        InOrder order = inOrder(userAccountRepository);
        order.verify(userAccountRepository).findById(staffSnapshot.getId());
        order.verify(userAccountRepository).findEnabledByRoleForUpdate(UserRole.ADMIN);
        verify(userAccountRepository, never())
                .updateRole(eq(staffSnapshot.getId()), eq(UserRole.STAFF), any(Instant.class));
    }

    @Test
    void preventsDisablingLastEnabledAdmin() {
        UserAccount administrator = account(UserRole.ADMIN, true);
        when(userAccountRepository.findById(administrator.getId())).thenReturn(Optional.of(administrator));
        when(userAccountRepository.findEnabledByRoleForUpdate(UserRole.ADMIN)).thenReturn(List.of(administrator));

        assertThrows(ConflictException.class,
                () -> userAccountService.changeEnabled(administrator.getId(), false));

        assertTrue(administrator.isEnabled());
        verify(userAccountRepository, never())
                .updateEnabled(eq(administrator.getId()), eq(false), any(Instant.class));
    }

    @Test
    void allowsDisablingAdminWhenAnotherEnabledAdminExists() {
        UserAccount administrator = account(UserRole.ADMIN, true);
        UserAccount otherAdministrator = account(UserRole.ADMIN, true);
        UserAccount storedAccount = accountWithId(administrator.getId(), UserRole.ADMIN, false);
        when(userAccountRepository.findById(administrator.getId()))
                .thenReturn(Optional.of(administrator), Optional.of(storedAccount));
        when(userAccountRepository.findEnabledByRoleForUpdate(UserRole.ADMIN))
                .thenReturn(List.of(administrator, otherAdministrator));

        UserAccountResponseDTO response = userAccountService.changeEnabled(administrator.getId(), false);

        assertTrue(administrator.isEnabled());
        assertFalse(response.isEnabled());
        verify(userAccountRepository)
                .updateEnabled(eq(administrator.getId()), eq(false), any(Instant.class));
    }

    @Test
    void preventsCurrentAdminDisableEvenWhenAnotherEnabledAdminExists() {
        UserAccount administrator = account(UserRole.ADMIN, true);
        when(userAccountRepository.findById(administrator.getId())).thenReturn(Optional.of(administrator));
        when(currentUserAccountService.getCurrentUserAccount()).thenReturn(administrator);

        assertThrows(ConflictException.class,
                () -> userAccountService.changeEnabled(administrator.getId(), false));

        verify(userAccountRepository, never()).findEnabledByRoleForUpdate(UserRole.ADMIN);
        verify(userAccountRepository, never())
                .updateEnabled(eq(administrator.getId()), eq(false), any(Instant.class));
    }

    @Test
    void rejectsDisableWhenDisabledSnapshotIsNowLastEnabledAdmin() {
        UserAccount disabledSnapshot = account(UserRole.ADMIN, false);
        UserAccount currentTarget = UserAccount.builder()
                .id(disabledSnapshot.getId())
                .username(disabledSnapshot.getUsername())
                .passwordHash(disabledSnapshot.getPasswordHash())
                .role(UserRole.ADMIN)
                .enabled(true)
                .build();
        when(userAccountRepository.findById(disabledSnapshot.getId())).thenReturn(Optional.of(disabledSnapshot));
        when(userAccountRepository.findEnabledByRoleForUpdate(UserRole.ADMIN)).thenReturn(List.of(currentTarget));

        assertThrows(ConflictException.class,
                () -> userAccountService.changeEnabled(disabledSnapshot.getId(), false));

        InOrder order = inOrder(userAccountRepository);
        order.verify(userAccountRepository).findById(disabledSnapshot.getId());
        order.verify(userAccountRepository).findEnabledByRoleForUpdate(UserRole.ADMIN);
        verify(userAccountRepository, never())
                .updateEnabled(eq(disabledSnapshot.getId()), eq(false), any(Instant.class));
    }

    @Test
    void roleAndEnabledChangesReturnNotFoundForUnknownUser() {
        UUID missingId = UUID.randomUUID();
        when(userAccountRepository.findById(missingId)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class,
                () -> userAccountService.changeRole(missingId, UserRole.ADMIN));
        assertThrows(ResourceNotFoundException.class,
                () -> userAccountService.changeEnabled(missingId, true));
    }

    @Test
    void deletesUnreferencedStaffAccount() {
        UserAccount currentAdmin = account(UserRole.ADMIN, true);
        UserAccount target = account(UserRole.STAFF, true);
        prepareDeletion(currentAdmin, target);
        when(userAccountRepository.findEnabledByRoleForUpdate(UserRole.ADMIN))
                .thenReturn(List.of(currentAdmin));

        userAccountService.deleteUser(target.getId());

        verify(userAccountRepository).delete(target);
        verify(userAccountRepository).flush();
        verify(userAccountRepository).findEnabledByRoleForUpdate(UserRole.ADMIN);
    }

    @Test
    void deletesEnabledAdminWhenAnotherEnabledAdminRemains() {
        UserAccount currentAdmin = account(UserRole.ADMIN, true);
        UserAccount target = account(UserRole.ADMIN, true);
        prepareDeletion(currentAdmin, target);
        when(userAccountRepository.findEnabledByRoleForUpdate(UserRole.ADMIN))
                .thenReturn(List.of(target, currentAdmin));

        userAccountService.deleteUser(target.getId());

        InOrder order = inOrder(
                userAccountRepository,
                currentUserAccountService,
                ownerRepository,
                catRepository,
                vetRepository,
                stayRepository,
                nightlyReferenceRateChangeRepository);
        order.verify(userAccountRepository).findById(target.getId());
        order.verify(currentUserAccountService).getCurrentUserAccount();
        order.verify(ownerRepository).existsByCreatedBy_Id(target.getId());
        order.verify(catRepository).existsByCreatedBy_Id(target.getId());
        order.verify(vetRepository).existsByCreatedBy_Id(target.getId());
        order.verify(stayRepository).existsByCreatedBy_Id(target.getId());
        order.verify(nightlyReferenceRateChangeRepository).existsByChangedBy_Id(target.getId());
        order.verify(userAccountRepository).findEnabledByRoleForUpdate(UserRole.ADMIN);
        order.verify(userAccountRepository).delete(target);
        order.verify(userAccountRepository).flush();
    }

    @Test
    void deletesDisabledAdminWhenOneEnabledAdminRemains() {
        UserAccount currentAdmin = account(UserRole.ADMIN, true);
        UserAccount target = account(UserRole.ADMIN, false);
        prepareDeletion(currentAdmin, target);
        when(userAccountRepository.findEnabledByRoleForUpdate(UserRole.ADMIN))
                .thenReturn(List.of(currentAdmin));

        userAccountService.deleteUser(target.getId());

        verify(userAccountRepository).delete(target);
        verify(userAccountRepository).flush();
    }

    @Test
    void deleteReturnsNotFoundBeforeResolvingCurrentUserOrReferences() {
        UUID missingId = UUID.randomUUID();
        when(userAccountRepository.findById(missingId)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> userAccountService.deleteUser(missingId));

        verifyNoInteractions(
                currentUserAccountService,
                ownerRepository,
                catRepository,
                vetRepository,
                stayRepository,
                nightlyReferenceRateChangeRepository
        );
        verify(userAccountRepository, never()).delete(any(UserAccount.class));
    }

    @Test
    void rejectsSelfDeletionBeforeCheckingReferences() {
        UserAccount currentAdmin = account(UserRole.ADMIN, true);
        when(userAccountRepository.findById(currentAdmin.getId())).thenReturn(Optional.of(currentAdmin));
        when(currentUserAccountService.getCurrentUserAccount()).thenReturn(currentAdmin);

        assertThrows(ForbiddenException.class, () -> userAccountService.deleteUser(currentAdmin.getId()));

        verifyNoInteractions(
                ownerRepository,
                catRepository,
                vetRepository,
                stayRepository,
                nightlyReferenceRateChangeRepository
        );
        verify(userAccountRepository, never()).findEnabledByRoleForUpdate(UserRole.ADMIN);
        verify(userAccountRepository, never()).delete(any(UserAccount.class));
    }

    @ParameterizedTest
    @EnumSource(CreatorReference.class)
    void rejectsEveryCreatorReferenceBeforeDeleting(CreatorReference reference) {
        UserAccount currentAdmin = account(UserRole.ADMIN, true);
        UserAccount target = account(UserRole.STAFF, true);
        prepareDeletion(currentAdmin, target);
        stubCreatorReference(reference, target.getId());

        assertThrows(ConflictException.class, () -> userAccountService.deleteUser(target.getId()));

        verifyNoReferenceChecksAfter(reference);
        verify(userAccountRepository, never()).delete(any(UserAccount.class));
        verify(userAccountRepository, never()).flush();
    }

    @Test
    void rejectsAdminDeletionWhenNoDifferentEnabledAdminRemains() {
        UserAccount currentAdmin = account(UserRole.ADMIN, false);
        UserAccount target = account(UserRole.ADMIN, true);
        prepareDeletion(currentAdmin, target);
        when(userAccountRepository.findEnabledByRoleForUpdate(UserRole.ADMIN)).thenReturn(List.of(target));

        assertThrows(ConflictException.class, () -> userAccountService.deleteUser(target.getId()));

        verify(userAccountRepository, never()).delete(any(UserAccount.class));
        verify(userAccountRepository, never()).flush();
    }

    @Test
    void rejectsDeletionWhenStaffSnapshotWasPromotedAndNoOtherEnabledAdminRemains() {
        UserAccount currentAdmin = account(UserRole.ADMIN, false);
        UserAccount staffSnapshot = account(UserRole.STAFF, true);
        UserAccount promotedTarget = UserAccount.builder()
                .id(staffSnapshot.getId())
                .username(staffSnapshot.getUsername())
                .passwordHash(staffSnapshot.getPasswordHash())
                .role(UserRole.ADMIN)
                .enabled(true)
                .build();
        prepareDeletion(currentAdmin, staffSnapshot);
        when(userAccountRepository.findEnabledByRoleForUpdate(UserRole.ADMIN))
                .thenReturn(List.of(promotedTarget));

        assertThrows(ConflictException.class, () -> userAccountService.deleteUser(staffSnapshot.getId()));

        verify(userAccountRepository, never()).delete(any(UserAccount.class));
        verify(userAccountRepository, never()).flush();
    }

    @Test
    void translatesDeleteIntegrityRaceToConflict() {
        UserAccount currentAdmin = account(UserRole.ADMIN, true);
        UserAccount target = account(UserRole.STAFF, true);
        prepareDeletion(currentAdmin, target);
        when(userAccountRepository.findEnabledByRoleForUpdate(UserRole.ADMIN))
                .thenReturn(List.of(currentAdmin));
        doThrow(new DataIntegrityViolationException("race")).when(userAccountRepository).delete(target);

        assertThrows(ConflictException.class, () -> userAccountService.deleteUser(target.getId()));

        verify(userAccountRepository, never()).flush();
    }

    @Test
    void translatesFlushOptimisticRaceToConflict() {
        UserAccount currentAdmin = account(UserRole.ADMIN, true);
        UserAccount target = account(UserRole.STAFF, true);
        prepareDeletion(currentAdmin, target);
        when(userAccountRepository.findEnabledByRoleForUpdate(UserRole.ADMIN))
                .thenReturn(List.of(currentAdmin));
        doThrow(new OptimisticLockingFailureException("race")).when(userAccountRepository).flush();

        assertThrows(ConflictException.class, () -> userAccountService.deleteUser(target.getId()));

        verify(userAccountRepository).delete(target);
    }

    private void prepareDeletion(UserAccount currentAdmin, UserAccount target) {
        when(userAccountRepository.findById(target.getId())).thenReturn(Optional.of(target));
        when(currentUserAccountService.getCurrentUserAccount()).thenReturn(currentAdmin);
    }

    private void stubCreatorReference(CreatorReference reference, UUID targetId) {
        switch (reference) {
            case OWNER -> when(ownerRepository.existsByCreatedBy_Id(targetId)).thenReturn(true);
            case CAT -> when(catRepository.existsByCreatedBy_Id(targetId)).thenReturn(true);
            case VET -> when(vetRepository.existsByCreatedBy_Id(targetId)).thenReturn(true);
            case STAY -> when(stayRepository.existsByCreatedBy_Id(targetId)).thenReturn(true);
            case NIGHTLY_REFERENCE_RATE_CHANGE ->
                    when(nightlyReferenceRateChangeRepository.existsByChangedBy_Id(targetId))
                            .thenReturn(true);
            case PRICING_DECISION ->
                    when(stayPricingDecisionRepository.existsByDecidedBy_Id(targetId))
                            .thenReturn(true);
            case AGREED_AMOUNT_CORRECTION ->
                    when(correctionRepository.existsByDecidedBy_Id(targetId))
                            .thenReturn(true);
            case PAYMENT_REGISTRATION ->
                    when(stayPaymentRepository.existsByRegisteredBy_Id(targetId))
                            .thenReturn(true);
            case PAYMENT_EDIT_ACTOR ->
                    when(stayPaymentEditRepository.existsByEditedBy_Id(targetId))
                            .thenReturn(true);
            case PAYMENT_EDIT_REGISTRANT ->
                    when(stayPaymentEditRepository.existsByRegisteredBy_Id(targetId))
                            .thenReturn(true);
            case PAYMENT_ANNULMENT_ACTOR ->
                    when(stayPaymentAnnulmentRepository.existsByAnnulledBy_Id(targetId))
                            .thenReturn(true);
            case PAYMENT_ANNULMENT_REGISTRANT ->
                    when(stayPaymentAnnulmentRepository.existsByRegisteredBy_Id(targetId))
                            .thenReturn(true);
            case PAYMENT_REMOVAL_REGISTRANT ->
                    when(stayPaymentRemovalRepository.existsByRegisteredBy_Id(targetId))
                            .thenReturn(true);
            case PAYMENT_REMOVAL_ACTOR ->
                    when(stayPaymentRemovalRepository.existsByRemovedBy_Id(targetId))
                            .thenReturn(true);
        }
    }

    private void verifyNoReferenceChecksAfter(CreatorReference reference) {
        switch (reference) {
            case OWNER -> verifyNoInteractions(
                    catRepository,
                    vetRepository,
                    stayRepository,
                    nightlyReferenceRateChangeRepository
            );
            case CAT -> verifyNoInteractions(
                    vetRepository,
                    stayRepository,
                    nightlyReferenceRateChangeRepository
            );
            case VET -> verifyNoInteractions(
                    stayRepository,
                    nightlyReferenceRateChangeRepository
            );
            case STAY -> verifyNoInteractions(nightlyReferenceRateChangeRepository);
            case NIGHTLY_REFERENCE_RATE_CHANGE -> {
                // All reference repositories are expected to have been checked.
            }
            default -> {
                // The assertion that delete/flush were not reached is authoritative
                // for the expanded durable-economic actor matrix.
            }
        }
    }

    private UserAccount account(UserRole role, boolean enabled) {
        return accountWithId(UUID.randomUUID(), role, enabled);
    }

    private UserAccount accountWithId(UUID id, UserRole role, boolean enabled) {
        return UserAccount.builder()
                .id(id)
                .username(UUID.randomUUID().toString())
                .passwordHash("encoded-password")
                .role(role)
                .enabled(enabled)
                .build();
    }

    private enum CreatorReference {
        OWNER,
        CAT,
        VET,
        STAY,
        NIGHTLY_REFERENCE_RATE_CHANGE,
        PRICING_DECISION,
        AGREED_AMOUNT_CORRECTION,
        PAYMENT_REGISTRATION,
        PAYMENT_EDIT_ACTOR,
        PAYMENT_EDIT_REGISTRANT,
        PAYMENT_ANNULMENT_ACTOR,
        PAYMENT_ANNULMENT_REGISTRANT,
        PAYMENT_REMOVAL_REGISTRANT,
        PAYMENT_REMOVAL_ACTOR
    }
}
