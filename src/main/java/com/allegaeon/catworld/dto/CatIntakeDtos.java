package com.allegaeon.catworld.dto;

import jakarta.validation.constraints.NotNull;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

public final class CatIntakeDtos {
    private CatIntakeDtos() {}

    public record InviteRequest(@NotNull UUID ownerId, List<UUID> catIds, boolean allowNewCats) {}
    public record IssuedInvite(UUID id, String url, Instant expiresAt) {}
    public record ActiveInvite(UUID id, UUID ownerId, List<UUID> catIds, boolean allowNewCats, Instant expiresAt) {}

    public record ScopedCat(UUID catId, Map<String, String> fields) {}
    public record RecipientForm(boolean allowNewCats, List<ScopedCat> cats, Instant expiresAt) {}
    public record SubmittedCat(UUID catId, Map<String, String> fields, List<String> photoKeys) {}
    public record Submission(List<SubmittedCat> cats) {}

    public record ReviewRow(UUID id, UUID ownerId, String ownerName, UUID catId, String catName, Instant submittedAt) {}
    public record ReviewPhoto(UUID id) {}
    public record ReviewDetail(UUID id, UUID ownerId, String ownerName, UUID catId, String catName, Instant submittedAt,
                               Map<String, String> current, Map<String, String> proposed, List<String> conflictFields,
                               List<ReviewPhoto> photos, Instant catUpdatedAt) {}
    public record Approval(Map<String, String> fields, List<UUID> photoIds, Instant expectedCatUpdatedAt) {}
}
