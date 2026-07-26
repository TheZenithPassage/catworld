package com.allegaeon.catworld.controller;

import com.allegaeon.catworld.exception.ConflictException;
import com.allegaeon.catworld.exception.ForbiddenException;
import com.allegaeon.catworld.exception.ResourceNotFoundException;
import com.allegaeon.catworld.service.IUserAccountService;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.UUID;

import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.verify;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(UserAccountController.class)
class UserAccountControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private IUserAccountService userAccountService;

    @Nested
    class DeleteUserTests {

        @Test
        void returnsNoContentAndDelegatesDeletion() throws Exception {
            UUID userId = UUID.randomUUID();

            mockMvc.perform(delete("/api/users/{id}", userId))
                    .andExpect(status().isNoContent())
                    .andExpect(content().string(""));

            verify(userAccountService).deleteUser(userId);
        }

        @Test
        void returnsForbiddenWhenSelfDeletionIsRejected() throws Exception {
            UUID userId = UUID.randomUUID();
            doThrow(new ForbiddenException("Administrators cannot delete their own account"))
                    .when(userAccountService).deleteUser(userId);

            mockMvc.perform(delete("/api/users/{id}", userId))
                    .andExpect(status().isForbidden())
                    .andExpect(content().string("Administrators cannot delete their own account"));

            verify(userAccountService).deleteUser(userId);
        }

        @Test
        void returnsNotFoundWhenTargetIsMissing() throws Exception {
            UUID userId = UUID.randomUUID();
            doThrow(new ResourceNotFoundException("User account", userId))
                    .when(userAccountService).deleteUser(userId);

            mockMvc.perform(delete("/api/users/{id}", userId))
                    .andExpect(status().isNotFound())
                    .andExpect(content().string("User account with id " + userId + " not found"));

            verify(userAccountService).deleteUser(userId);
        }

        @Test
        void returnsConflictWhenDeletionWouldBreakAnInvariant() throws Exception {
            UUID userId = UUID.randomUUID();
            doThrow(new ConflictException("User account cannot be deleted while operational records reference it"))
                    .when(userAccountService).deleteUser(userId);

            mockMvc.perform(delete("/api/users/{id}", userId))
                    .andExpect(status().isConflict())
                    .andExpect(content().string(
                            "User account cannot be deleted while operational records reference it"));

            verify(userAccountService).deleteUser(userId);
        }
    }
}
