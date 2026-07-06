# Research: Safe Stay Deletion

## Decision: Reuse the completed #147 deletion authorization policy for stays

**Rationale**: Issue #195 explicitly requires applying the shared deletion authorization policy from #147 before deletion. Current `origin/main` includes `DeletionAuthorizationPolicy`, `ForbiddenException`, a production `Clock`, and service usage for owner, cat and vet deletion. Reusing it keeps role, creator and strict 15-minute-window behavior centralized.

**Alternatives considered**: Duplicating the policy inside `StayService` was rejected because #147 requires one reusable backend policy. Frontend-only hiding was rejected because the backend must recheck every DELETE request. A new authorization framework was rejected as disproportionate and outside the approved issue scope.

## Decision: Add a non-throwing policy calculation for response `canDelete`

**Rationale**: Issue #195 requires stay responses to expose calculated `canDelete` while every DELETE request remains server-side authoritative. Adding a boolean calculation to the existing policy lets response rendering use the same matrix as delete enforcement without catching exceptions or copying role/time logic into stay code.

**Alternatives considered**: Catching `ForbiddenException` from `authorize` during response mapping was rejected as noisy control flow. Reimplementing the matrix in `StayService`, `StayMapper` or Angular was rejected because it risks divergence from the shared policy. Omitting `canDelete` was rejected by the issue.

## Decision: Use the existing stay aggregate mapping for owned `StayCat` removal

**Rationale**: `Stay.stayCats` is already mapped with `cascade = CascadeType.ALL` and `orphanRemoval = true`, while `StayCat` is the explicit owned link entity for the stay-cat relationship. Deleting the stay through `StayRepository` should remove the stay and owned links without deleting cats, owners or vets.

**Alternatives considered**: Adding a dedicated `StayCatRepository` or manual SQL cleanup was rejected unless tests reveal the existing aggregate mapping cannot satisfy the requirement. Adding a Flyway migration was rejected because no schema change is currently required.

## Decision: Keep cancellation untouched and add a separate DELETE endpoint

**Rationale**: Existing cancellation is `PATCH /api/stays/{id}/cancel` and sets `cancelledAt` after modification checks. Issue #195 requires permanent deletion to remain distinct from cancellation and to ignore dynamic stay status when authorization passes.

**Alternatives considered**: Reusing cancellation for mistaken records or introducing soft delete/restore was rejected because cancellation semantics and soft-delete workflows are out of scope.

## Decision: Translate stay-delete persistence conflicts locally

**Rationale**: Existing `GlobalExceptionHandler` maps application `ConflictException` to `409 Conflict`. The issue asks for `409` on integrity or concurrent constraint conflicts if they occur, while also asking to avoid broad shared exception handling unless necessary. Translating relevant delete exceptions in `StayService` keeps the behavior scoped to this stay flow.

**Alternatives considered**: Broadly mapping all Spring data exceptions in global exception handling was rejected as unnecessarily cross-cutting. Letting raw persistence exceptions escape was rejected because it would not guarantee the specified API status.
