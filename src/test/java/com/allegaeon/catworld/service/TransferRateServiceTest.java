package com.allegaeon.catworld.service;

import com.allegaeon.catworld.exception.BadRequestException;
import com.allegaeon.catworld.exception.ForbiddenException;
import com.allegaeon.catworld.model.TransferRate;
import com.allegaeon.catworld.model.UserAccount;
import com.allegaeon.catworld.model.UserRole;
import com.allegaeon.catworld.repository.TransferRateRepository;
import com.allegaeon.catworld.security.CurrentUserAccountService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import java.math.BigDecimal;
import java.util.Optional;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TransferRateServiceTest {
 @Mock TransferRateRepository repository; @Mock CurrentUserAccountService users; @Mock NightlyReferenceRateAuthorizationPolicy policy;
 @Test void configuresCanonicalPositiveWholeRateUnderCurrentRowLock() { var service=new TransferRateService(repository, users, policy); var admin=UserAccount.builder().role(UserRole.ADMIN).build(); when(users.getCurrentUserAccount()).thenReturn(admin); when(repository.findCurrentForUpdate()).thenReturn(Optional.of(TransferRate.builder().id(1L).transferRate(null).build())); assertEquals(new BigDecimal("12"),service.configure(new BigDecimal("12.0")).getTransferRate()); verify(repository).saveAndFlush(any()); }
 @Test void rejectsFractionalTransferRate() { var service=new TransferRateService(repository, users, policy); when(users.getCurrentUserAccount()).thenReturn(UserAccount.builder().role(UserRole.ADMIN).build()); assertThrows(BadRequestException.class,()->service.configure(new BigDecimal("1.5"))); verify(repository,never()).findCurrentForUpdate(); }
 @Test void readsUnavailableAsNull() { var service=new TransferRateService(repository, users, policy); when(repository.findById(1L)).thenReturn(Optional.empty()); assertNull(service.get().getTransferRate()); }
 @Test void staffCanReadButCannotConfigureOrClear() { var service=new TransferRateService(repository, users, new NightlyReferenceRateAuthorizationPolicy()); when(users.getCurrentUserAccount()).thenReturn(UserAccount.builder().role(UserRole.STAFF).build()); when(repository.findById(1L)).thenReturn(Optional.empty()); assertNull(service.get().getTransferRate()); assertThrows(ForbiddenException.class,()->service.configure(new BigDecimal("10"))); assertThrows(ForbiddenException.class,service::clear); verify(repository,never()).findCurrentForUpdate(); }
}
