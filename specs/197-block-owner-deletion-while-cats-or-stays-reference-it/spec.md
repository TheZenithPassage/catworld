# Feature Specification: Safe Owner Deletion

**GitHub Issue**: #197 - [Backend] Block owner deletion while cats or stays reference it
**Parent Coordinator**: #148
**Sidecar Run**: sidecar-148-7d6b1d4d638a41fc9cd78df9edc10be6
**Dependency Layer**: 2; hard dependencies #196 and #198
**Preparation Ownership**: Prepared by the coordinator. The child executor must consume these artifacts without regenerating them.

## Goal

Allow permanent deletion of an owner only when the shared deletion
authorization policy permits the correction and neither a cat nor a direct stay
references that owner. Preserve all relationship data and existing foreign keys,
return stable 404/403/409 outcomes, and expose a backend-calculated canDelete
rendering hint.

## Verifiable Technical Outcomes

### TO-001: Authorized unreferenced owners can be deleted

1. Given an existing owner, an authorized requester, and no cat or stay
   reference, DELETE /api/owners/{id} returns 204 and removes the owner.
2. Given a missing owner, DELETE returns 404 and performs no authorization,
   relationship, or delete operation.
3. Given an existing owner but a requester denied by the shared policy, DELETE
   returns 403 before either relationship is queried.

### TO-002: Every cat or direct stay reference blocks deletion

1. Any cat whose owner_id references the owner produces 409, even if that cat
   has no stay history.
2. Any stay whose owner_id directly references the owner produces 409,
   including cancelled, historical, active, or future stays.
3. When both relationships exist, the owner and all related records remain
   unchanged.
4. No cat, stay, or link may be deleted, detached, reassigned, or updated to
   make owner deletion succeed.

### TO-003: Database races remain stable conflicts

1. The application checks relationships only after authorization.
2. Delete and explicit flush execute inside the service transaction.
3. A DataIntegrityViolationException or OptimisticLockingFailureException from
   delete/flush is translated locally to ConflictException and returns 409.
4. Existing cats.owner_id and stays.owner_id foreign keys remain the final
   integrity protection.

### TO-004: Owner responses expose an advisory canDelete

1. canDelete is true only when the shared authorization policy returns true AND
   neither a cat nor a stay references the owner.
2. Authorization failure short-circuits relationship checks and produces false.
3. Any blocking reference produces false for an otherwise eligible requester.
4. DELETE never trusts a rendered or client-provided value and recomputes all
   rules.

## State and Error Matrix

| Owner exists | Authorized | Cat reference | Stay reference | Result |
|---|---|---|---|---|
| No | not checked | not checked | not checked | 404 Not Found |
| Yes | No | not checked | not checked | 403 Forbidden |
| Yes | Yes | Yes | any | 409 Conflict |
| Yes | Yes | No | Yes | 409 Conflict |
| Yes | Yes | No | No | 204 No Content |
| Yes | Yes | No at check | No at check, FK/concurrency rejection at flush | 409 Conflict |

## Functional Requirements

- FR-001: Preserve the existing authenticated DELETE /api/owners/{id}
  endpoint and its empty 204 success response.
- FR-002: Enforce lookup, shared authorization, cat-reference check,
  stay-reference check, delete, and flush in that order.
- FR-003: Return 404 for a missing owner, 403 for shared-policy denial, and 409
  for known relationship or persistence/concurrency conflicts.
- FR-004: Use an OwnerRepository-local cat existence query and
  StayRepository.existsByOwner_Id so this child does not edit CatRepository or
  sibling deletion code.
- FR-005: Add primitive boolean canDelete to every owner response and calculate
  it in the service from authorization plus both relationship checks.
- FR-006: Keep existing foreign keys, entity mappings, exception payloads, and
  global HTTP mappings unchanged.
- FR-007: Add an integrated architecture summary for the full #148 safe
  deletion contract after layer 1 is present; do not reimplement layer 1.

## Edge Cases

- One reference of either kind is sufficient to block deletion.
- A direct owner-to-stay reference blocks deletion independently of StayCat
  rows and independently of stay cancellation or dates.
- A cat reference blocks deletion even when the cat has a nullable vet and no
  stay history.
- A stale canDelete=true does not bypass a later relationship or authorization
  change.
- Authorization denial must not reveal whether either relationship exists.
- A concurrent cat or stay insertion after explicit checks is rejected by the
  foreign key and reported as 409.

## Scope Boundaries

### In Scope

- Owner service deletion and response behavior.
- OwnerRepository-local cat-reference access.
- StayRepository owner-reference access.
- Owner response DTO/mapper canDelete support.
- Owner-focused service, controller, mapper, and persistence tests.
- One combined docs/ARCHITECTURE.md summary of the integrated #148 safe
  owner/cat/vet/stay deletion contract.

### Out of Scope

- Reimplementation or modification of #195, #196, or #198 behavior.
- CatRepository changes or any cat, vet, stay-deletion, application-account, or
  frontend behavior change.
- Shared DeletionAuthorizationPolicy, security configuration, global exception
  handler, exception payload, entity mapping, Flyway migration, cascade,
  soft-delete, restore, or automatic cleanup changes.
- GitHub issue mutation, public comments, PR merge, or workflow changes.

## Dependencies and Approved Contracts

- #147 supplies the completed role/creator/correction-window authorization
  policy and remains unchanged.
- #195 supplies completed safe stay deletion and is preserved.
- #196 and #198 are hard workflow dependencies for this layer: their PRs must
  first be user-merged into the coordinator branch so this child consumes the
  integrated contract and owns the single combined architecture summary.
- #148 and #197 approve the owner relationship rules, statuses, FK protection,
  and server-side recheck.
- #150 establishes that future frontend actions consume backend canDelete and
  remain subject to entity integrity.

## Success Criteria

- Unreferenced authorized owner deletion returns 204.
- Missing and unauthorized owners return 404 and 403 with the required ordering.
- Any cat or direct stay reference returns 409 and all records remain intact.
- Delete/flush races return 409.
- Owner responses serialize the full-rule advisory canDelete.
- Focused tests and ./mvnw verify pass.
- Coordinator-serialized clean MySQL/Flyway startup proves both real foreign-key
  paths and schema compatibility.
- docs/ARCHITECTURE.md accurately describes the integrated owner, cat, vet, and
  stay deletion contract without duplicating implementation details.

## Open Questions

None. Product, authorization, persistence, API, dependency, source ownership,
architecture-summary ownership, and validation decisions are resolved.
