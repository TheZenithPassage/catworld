# Feature Specification: Block Cat Deletion When Stay History Exists

**GitHub Issue**: #196 — `[Backend] Block cat deletion when stay history exists`
**Parent Coordinator**: #148 — `[Backend] Enforce safe deletion rules for owners, cats, vets and stays`
**Sidecar Run**: `sidecar-148-7d6b1d4d638a41fc9cd78df9edc10be6`
**Dependency Layer**: 1
**Preparation Ownership**: Prepared by the coordinator for child execution. The child executor must consume these artifacts without regenerating them.

## Summary

Allow permanent deletion of a cat only when the requester passes the shared
deletion authorization policy and the cat has no `StayCat` history. Any link to
an active, cancelled, completed, historical, or otherwise retained stay blocks
deletion. The database foreign key remains the final integrity guard, and
concurrent delete conflicts map to `409 Conflict`.

Cat responses expose a backend-calculated `canDelete` rendering hint. The hint
is true only when both the shared authorization policy allows deletion and no
blocking `StayCat` reference exists. Every DELETE request independently repeats
lookup, authorization, relationship, and persistence checks.

## Verifiable Technical Outcomes

### TO-001: Authorized deletion succeeds only without stay history

An authenticated requester can permanently delete an existing cat only when
the shared #147 authorization policy allows the operation and no `StayCat`
record references the cat.

Acceptance scenarios:

1. Given an existing cat with no stay history and an authorized `ADMIN`, when
   `DELETE /api/cats/{id}` is requested, then the cat is deleted and the API
   returns `204 No Content`.
2. Given an existing cat with no stay history and an eligible `STAFF` creator
   inside the strict correction window, when deletion is requested, then the
   cat is deleted and the API returns `204 No Content`.
3. Given a missing cat, when deletion is requested, then the API returns
   `404 Not Found`.
4. Given a requester that fails the shared role, creator, or correction-window
   policy, when deletion is requested, then the API returns `403 Forbidden`,
   performs no relationship query, and does not delete the cat.

### TO-002: Every retained stay relationship blocks deletion

Any `StayCat` row is protected history. Cancellation and elapsed stay dates do
not weaken that rule, and the implementation must not delete or detach links to
make cat deletion succeed.

Acceptance scenarios:

1. Given an authorized requester and a cat referenced by an active or future
   stay, when deletion is requested, then the API returns `409 Conflict` and
   preserves the cat, stay, and `StayCat` link.
2. Given an authorized requester and a cat referenced only by a cancelled stay,
   when deletion is requested, then the API returns `409 Conflict` and
   preserves all records.
3. Given an authorized requester and a cat referenced only by a completed or
   historical stay, when deletion is requested, then the API returns
   `409 Conflict` and preserves all records.
4. Given no reference was observed by the application check but a concurrent
   constraint or optimistic-locking conflict prevents deletion, when the delete
   is flushed, then the API returns `409 Conflict` without partial deletion.

### TO-003: Cat responses expose an advisory `canDelete`

Every cat response calculates `canDelete` on the backend as:

```text
shared authorization eligibility AND no StayCat reference exists
```

Acceptance scenarios:

1. Given an authorized requester and a cat with no stay history, when a cat
   response is produced, then `canDelete` is `true`.
2. Given an unauthorized requester, when a cat response is produced, then
   `canDelete` is `false` regardless of relationship state.
3. Given an authorized requester and a cat with any stay history, when a cat
   response is produced, then `canDelete` is `false`.
4. Given a previously rendered or stale `canDelete=true`, when DELETE is later
   requested after authorization or relationship state changes, then the
   backend rechecks all rules and rejects the operation when appropriate.

## Input and State Matrix

| Target and requester state | Relationship state | Result | HTTP status | Persisted effect |
|---|---|---|---|---|
| Cat missing | Unknown and not inspected | Rejected | `404` | None |
| Existing cat; authorization denied | Must not be inspected by DELETE flow | Rejected | `403` | None |
| Existing cat; authorized | Any `StayCat` reference, including cancelled/historical | Rejected | `409` | Cat, stay, and link preserved |
| Existing cat; authorized | No reference | Deleted | `204` | Cat removed |
| Existing cat; authorized | No reference observed, concurrent constraint conflict at flush | Rejected | `409` | Transaction rolled back |

## Functional Requirements

- **FR-001**: The existing authenticated `DELETE /api/cats/{id}` endpoint MUST
  remain the cat deletion API and return `204 No Content` on success.
- **FR-002**: A missing cat MUST return `404 Not Found`.
- **FR-003**: The service MUST apply #147 authorization before inspecting
  `StayCat` relationships.
- **FR-004**: Role, creator, and correction-window authorization failures MUST
  return `403 Forbidden`.
- **FR-005**: Any `StayCat` reference MUST block cat deletion, including links
  to cancelled or historical stays.
- **FR-006**: Relationship, integrity, and concurrent deletion conflicts MUST
  return `409 Conflict`.
- **FR-007**: The implementation MUST NOT cascade-delete stays, delete
  `StayCat` links, or modify a stay to make cat deletion succeed.
- **FR-008**: Cat responses MUST expose boolean `canDelete`, calculated as
  shared authorization eligibility and absence of blocking history.
- **FR-009**: `canDelete` MUST remain advisory; every DELETE request MUST
  recheck authorization, relationships, and persistence constraints.
- **FR-010**: The existing `fk_stay_cat_cat` database foreign key MUST remain
  the final integrity protection layer.

## Technical Requirements

- **TR-001**: Keep the existing controller → service → repository → database
  responsibility split.
- **TR-002**: Implement relationship existence access through a focused
  `StayCatRepository` query named `existsByCat_Id(UUID catId)`.
- **TR-003**: Execute deletion transactionally in this order: cat lookup,
  `DeletionAuthorizationPolicy.authorize`, `StayCat` existence check,
  repository delete, and explicit flush.
- **TR-004**: Translate `DataIntegrityViolationException` and
  `OptimisticLockingFailureException` raised by delete/flush into the existing
  `ConflictException` locally in `CatService`.
- **TR-005**: Reuse the existing `ResourceNotFoundException`,
  `ForbiddenException`, `ConflictException`, `GlobalExceptionHandler`, and
  `DeletionAuthorizationPolicy` without changing their contracts.
- **TR-006**: No Flyway migration or entity relationship change is required or
  permitted by this child scope.
- **TR-007**: Tests MUST prove relationship checks are not reached after
  authorization denial.
- **TR-008**: Tests MUST prove cancelled and historical links block deletion,
  successful deletion works without links, and the database FK still rejects
  a referenced-cat deletion.

## Dependencies and Shared Contract

- #147 is complete and supplies the shared authorization policy.
- #195 is complete and its stay deletion behavior is preserved without edits.
- #148 supplies coordinator integration and the cross-child contract.
- #150 confirms that frontend rendering consumes backend-authoritative
  `canDelete`; frontend implementation remains out of scope here.
- #196 has no hard dependency on sibling children #197 or #198 and belongs to
  dependency layer 1.
- The shared response convention is a boolean field named `canDelete`, computed
  in the service and passed to the entity mapper. DELETE enforcement never
  consumes client-rendered state.
- The shared error convention is the existing plain exception message with
  `404`, `403`, or `409` selected by the existing global handler.

## Explicit Exclusions

- Owner, vet, stay, application-account, or frontend deletion work.
- Reimplementation or modification of #195 stay deletion.
- Changes to the shared authorization policy, security configuration, global
  exception handler, exception payload convention, Flyway migrations, entity
  mappings, stay code, frontend code, or architecture documentation.
- Soft delete, restore, retention workflows, ownership transfer, or cascade
  cleanup of valid stay history.
- Durable cat photo storage. Issue #153 has not landed in the prepared source,
  so there is no owned-photo cleanup behavior to preserve or implement here.

## Success Criteria

- Authorized deletion of an unreferenced cat returns `204` and removes it.
- Missing cats return `404`.
- Authorization denial returns `403` before relationship-state inspection.
- Every active, cancelled, completed, or historical `StayCat` reference returns
  `409` and remains intact.
- Concurrent constraint conflicts return `409` and roll back.
- Cat responses expose the correct advisory `canDelete` value.
- Focused tests, `./mvnw verify`, and serialized clean MySQL/Flyway startup all
  pass on the final child head.

## Assumptions and Open Questions

The prepared coordinator source contains #147 and #195 and does not contain
#153 photo storage. The existing controller endpoint and service interface are
already present. There are no unresolved product, architecture, security,
persistence, or approval questions for this child scope.
