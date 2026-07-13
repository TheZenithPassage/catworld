# Feature Specification: Safe Vet Deletion

**Parent Coordinator**: GitHub issue #148
**Child Issue**: GitHub issue #198
**Sidecar Run**: `sidecar-148-7d6b1d4d638a41fc9cd78df9edc10be6`
**Prepared By**: Coordinator artifact preparation
**Dependency Layer**: 1 (no hard child dependencies)

## Goal

Allow an authenticated requester to permanently delete a vet only when the
shared deletion authorization policy permits the correction and no cat still
references that vet. The backend remains authoritative, and the existing
database foreign key remains the final integrity guard.

## Verifiable Technical Outcomes

### TO-001: Authorized deletion succeeds only without cat references

1. **Given** a vet exists, the requester passes the shared #147 deletion
   authorization policy, and no cat references the vet, **when** the requester
   calls `DELETE /api/vets/{id}`, **then** the vet is deleted and the API
   returns `204 No Content`.
2. **Given** any cat references the vet, **when** an otherwise authorized
   requester attempts deletion, **then** the API returns `409 Conflict`, the
   vet remains, and no cat is changed or automatically unlinked.
3. **Given** no vet exists for the requested identifier, **when** deletion is
   requested, **then** the API returns `404 Not Found`.

### TO-002: Authorization is checked before relationship details are exposed

1. **Given** a vet exists but the requester fails the shared deletion policy,
   **when** deletion is requested, **then** the API returns `403 Forbidden`
   before checking or exposing whether cats reference the vet.
2. **Given** the requester is authorized, **when** deletion proceeds, **then**
   the service checks for a blocking cat relationship before issuing the
   delete.
3. **Given** the relationship changes concurrently after the explicit check,
   **when** the database rejects the delete, **then** the service translates
   the integrity or optimistic-concurrency failure to `409 Conflict`.

### TO-003: Vet responses expose an authoritative rendering hint

1. **Given** a vet response is produced, **when** the requester is authorized
   and no cat references the vet, **then** `canDelete` is `true`.
2. **Given** the requester is not authorized or any cat references the vet,
   **when** a vet response is produced, **then** `canDelete` is `false`.
3. `canDelete` is a rendering hint only. Every DELETE request repeats lookup,
   authorization, relationship validation, and database-backed deletion.

## Required Behavior

- `DELETE /api/vets/{id}` remains authenticated and returns an empty `204`
  response after successful deletion.
- Deletion order MUST be:
  1. look up the vet and fail with `404` when absent;
  2. call `DeletionAuthorizationPolicy.authorize(...)` and fail with `403`
     when denied;
  3. check through `VetRepository` whether any cat references the vet and fail
     with `409` when one does;
  4. delete and flush inside a transaction;
  5. locally translate `DataIntegrityViolationException` and
     `OptimisticLockingFailureException` to `ConflictException` (`409`).
- The relationship check MUST use a vet-local repository query such as
  `existsByIdAndCatsIsNotEmpty(UUID id)`; this child MUST NOT modify
  `CatRepository`.
- Every vet response path (list, detail, create, and update) MUST calculate
  `canDelete` as shared authorization eligibility **and** absence of a blocking
  cat relationship.
- The server MUST NOT trust a previously rendered `canDelete` value.
- Deletion MUST NOT clear `Cat.vet`, update cats, cascade-delete cats, or add
  soft-delete/restore behavior.
- The existing `cats.vet_id -> vets.id` foreign key remains the final persisted
  integrity protection. No migration or entity relationship change is needed.

## State and Error Matrix

| Vet exists | Authorized | Cat reference exists at check | Database delete result | API result |
|------------|------------|-------------------------------|------------------------|------------|
| No | N/A | Not checked | Not attempted | `404 Not Found` |
| Yes | No | Not checked | Not attempted | `403 Forbidden` |
| Yes | Yes | Yes | Not attempted | `409 Conflict` |
| Yes | Yes | No | Succeeds | `204 No Content` |
| Yes | Yes | No | Integrity/concurrency rejection | `409 Conflict` |

## Edge Cases

- One cat reference is sufficient to block deletion; the cat's age or other
  operational state does not change the rule.
- A cat may have a nullable vet reference, but deletion must never null that
  reference automatically.
- A stale `canDelete=true` response does not bypass a later relationship or
  authorization change.
- An `ADMIN` still receives `canDelete=false` while a cat reference exists.
- An eligible `STAFF` requester still receives `canDelete=false` while a cat
  reference exists.
- A concurrent cat reference inserted after the explicit check is rejected by
  the foreign key and reported as `409`.

## Scope Boundaries

### In Scope

- Vet service deletion behavior and vet-local repository relationship query.
- Vet response DTO/mapper `canDelete` contract.
- Vet-focused service, controller, mapper, and persistence tests.

### Out of Scope

- Cat, owner, stay, or application-account deletion.
- Changes to `CatRepository`, the shared deletion policy, security
  configuration, the global exception handler, migrations, JPA entities,
  stay behavior, frontend code, or repository documentation.
- Frontend deletion UI, confirmation dialogs, soft delete, restore, or
  automatic cat-reference cleanup.
- Coordinator finalization or sibling-child work.

## Dependencies and Approved Contracts

- #147 is complete and supplies the shared role/creator/correction-window
  authorization policy and `ForbiddenException` behavior.
- #148 and #198 approve the vet-specific relationship rule, error statuses,
  backend recheck, and foreign-key protection.
- #150 establishes that future frontend flows consume backend `canDelete` but
  never recreate backend authorization or integrity policy.
- Completed stay deletion provides the existing delete/flush and local
  conflict-translation precedent; this feature does not change stay scope.
- #196 and #197 are siblings, not hard dependencies. This child is in
  dependency layer 1.

## Success Criteria

- Focused service tests prove lookup, authorization, relationship-check, and
  delete/flush ordering and all `404`/`403`/`409` outcomes.
- Persistence evidence proves the existing foreign key blocks referenced-vet
  deletion and permits unreferenced-vet deletion without changing cats.
- Vet responses serialize the full-rule `canDelete` hint while DELETE always
  rechecks server-side.
- `./mvnw verify` passes.
- Coordinator-serialized clean MySQL/Flyway startup succeeds.

## Open Questions

None. The coordinator has resolved `canDelete` to mean authorization eligibility
AND no blocking relationship, selected the vet-local repository query to avoid
the sibling `CatRepository` collision, and retained existing shared contracts.
