package com.allegaeon.catworld.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

public final class CatIntakeDtos {
    private CatIntakeDtos() {}

    @JsonIgnoreProperties("catIds")
    public record InviteRequest(@NotNull UUID ownerId, boolean allowNewCats, UUID stayId) {}
    public record IssuedInvite(UUID id, String url, Instant expiresAt) {}
    public record ActiveInvite(UUID id, UUID ownerId, List<UUID> catIds, boolean allowNewCats, Instant expiresAt) {}

    public record ScopedCat(UUID catId, Map<String, String> fields, List<String> requestedFields, UUID draftId,
                            long revision, Map<String, String> proposedFields, List<ReviewPhoto> photos,
                            Map<String, UUID> optionIds) {}
    public record RecipientForm(boolean allowNewCats, List<ScopedCat> cats, Instant expiresAt,
                                List<CatProfileOptionDto> brands, Map<String, List<CatProfileOptionDto>> catalogOptions,
                                List<FoodVarietyOption> foodVarieties,
                                @JsonFormat(shape = JsonFormat.Shape.STRING) BigDecimal litterRatePerKg) {}
    public record SubmittedCat(UUID catId, UUID draftId, Long revision, Map<String, String> fields,
                               List<UUID> retainedPhotoIds, List<String> photoKeys, Map<String, UUID> optionIds) {}
    public record Submission(List<SubmittedCat> cats) {}

    public record ReviewRow(UUID id, UUID ownerId, String ownerName, UUID catId, String catName, Instant submittedAt) {}
    public record ReviewPhoto(UUID id) {}
    public record ReviewDetail(UUID id, UUID ownerId, String ownerName, UUID catId, String catName, Instant submittedAt,
                               Map<String, String> current, Map<String, String> proposed, List<String> conflictFields,
                               List<String> unansweredRequestedFields, List<ReviewPhoto> photos,
                               Instant catUpdatedAt, long revision, String proposedFoodDetailBrand) {}
    public record Approval(Map<String, String> fields, List<UUID> photoIds, Instant expectedCatUpdatedAt,
                           Long expectedReviewRevision) {}
    public record Dismissal(Instant expectedCatUpdatedAt, @NotNull Long expectedReviewRevision) {}
}
