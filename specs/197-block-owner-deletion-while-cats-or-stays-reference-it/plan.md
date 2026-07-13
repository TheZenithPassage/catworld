# Implementation Plan: Safe Owner Deletion

**GitHub Issue**: #197
**Parent Coordinator**: #148
**Sidecar Run**: sidecar-148-7d6b1d4d638a41fc9cd78df9edc10be6
**Prepared Artifact Path**: specs/197-block-owner-deletion-while-cats-or-stays-reference-it/
**Dependency Layer**: 2; hard dependencies #196 and #198

## Summary

Extend the existing owner deletion path with authorization-first cat and stay
relationship guards, explicit delete/flush race handling, and a full-rule
canDelete response hint. Use only owner-local and stay-local repository queries
to avoid sibling collisions. After both layer 1 children are integrated, update
the architecture source of truth once for the combined coordinator behavior.

## Technical Context

- Java 17, Spring Boot, Spring Web, Spring Data JPA, MySQL, and Flyway.
- Existing layered monolith: controller to service to repository to database.
- Existing DELETE /api/owners/{id}, IOwnerService method, shared deletion
  policy, ResourceNotFoundException, ForbiddenException, ConflictException, and
  global 404/403/409 mappings.
- Existing mandatory Cat.owner and Stay.owner relationships and non-cascading
  cats.owner_id and stays.owner_id foreign keys.
- JUnit 5, Mockito, Spring MVC slice tests, and JPA persistence tests.

## Constitution Check

- I. Domain Focus and Sustainable Evolution: compliant. This is limited to the
  confirmed CatWorld owner/cat/stay integrity rule and adds no generic deletion
  framework.
- II. Layered Monolith Responsibilities: compliant. HTTP remains thin,
  OwnerService owns orchestration and transaction behavior, repositories own
  existence access, and the database owns final integrity.
- III. Backend and Database Authority: compliant. canDelete is advisory and
  DELETE rechecks all rules against persisted state.
- IV. Schema Evolution: compliant. Required foreign keys already exist; no
  migration is needed.
- V. Protected Stay Model: compliant. Cancellation, dates, StayCat history, and
  stay deletion behavior remain unchanged; any direct stay reference blocks.
- VI. Specification and Planning Discipline: compliant. Ordering, errors,
  relationship semantics, concurrency, dependency layer, source map, and
  validation are resolved before implementation.
- VII. Focused Changes and Proportional Validation: compliant. The source map is
  owner-focused, with one explicitly assigned combined architecture summary.
- VIII. Operational Safety and Sources of Truth: compliant. No secrets,
  production data, deployment behavior, or operational configuration changes.

No constitution gate or pending human approval blocks implementation after the
recorded hard dependencies are integrated.

## Architecture and Technology Assessment

Assessment level: minor but required because this changes a destructive API,
two persisted relationships, and an API response field.

### Options Considered

1. Existing layered/JPA pattern with OwnerRepository-local cat existence and
   StayRepository-local owner existence queries (selected).
2. Add owner/vet queries to shared CatRepository (rejected because sibling
   parallel work would collide on a shared source surface).
3. Initialize Owner.cats and invent an inverse Owner.stays collection (rejected
   because it makes query behavior implicit and would expand entity scope).
4. Rely only on database exceptions (rejected because it cannot guarantee
   authorization-first ordering or deliberate relationship conflict behavior).
5. Create a generic deletion framework or new dependency (rejected as
   disproportionate and unapproved).

### Selected Approach and Approval

Use OwnerRepository.existsByIdAndCatsIsNotEmpty(UUID) and
StayRepository.existsByOwner_Id(UUID), then mirror the established transactional
delete/flush and local conflict-translation pattern. Approval is grounded in
#147, #148, #197, and #150, with completed #195 and integrated #196/#198 as
applicable precedents. This is a minor application of approved project patterns,
not a new architecture, technology, persistence strategy, or shared mechanism.
No unresolved approval remains.

### Reversibility and Cost

The two repository methods, service checks, mapper overload, and DTO field are
local and reversible without data migration or dependency removal. Per-owner
existence queries prioritize correctness; speculative bulk optimization is out
of scope.

## Detailed Design

### DELETE Flow

1. OwnerController continues delegating DELETE /api/owners/{id} and returning
   204 on success.
2. OwnerService loads the owner or throws ResourceNotFoundException (404).
3. DeletionAuthorizationPolicy.authorize(createdBy, createdAt) runs before any
   relationship query and may throw ForbiddenException (403).
4. OwnerRepository.existsByIdAndCatsIsNotEmpty(id) blocks with
   ConflictException (409) when any cat references the owner.
5. StayRepository.existsByOwner_Id(id) blocks with ConflictException (409) when
   any direct stay references the owner.
6. In one transaction, OwnerService calls delete(owner) and flush().
7. DataIntegrityViolationException and OptimisticLockingFailureException from
   delete/flush are translated locally to ConflictException (409).

### Response Mapping

- Add primitive boolean canDelete to OwnerResponseDTO.
- Add OwnerMapper.toResponseDTO(Owner, boolean), retaining a conventional
  false-default overload if needed for local compatibility.
- Route list, detail, create, and update responses through one OwnerService
  helper.
- Calculate shared authorization eligibility first and short-circuit false.
  For eligible owners, require both repository relationship checks to be false.
- DELETE never accepts or consumes canDelete from the client.

### Persistence

- Preserve Cat.owner, Stay.owner, Owner.cats, and all Flyway migrations.
- The explicit checks provide stable application conflicts.
- Delete plus flush and both foreign keys handle concurrent insertions after the
  checks.

### Integrated Architecture Summary

After #196 and #198 are integrated, update docs/ARCHITECTURE.md once to record:

- shared authorization plus entity-specific integrity as the effective
  canDelete hint;
- lookup to authorize to relationship check to delete/flush ordering;
- 404/403/409 semantics and final FK protection;
- owner cat/stay, cat StayCat-history, vet cat, and completed stay reference
  rules;
- rendering-only hints and mandatory server-side DELETE rechecks.

Do not copy sibling implementation details or alter their code.

## Source Map

### Planned Production Changes

- src/main/java/com/allegaeon/catworld/service/OwnerService.java
- src/main/java/com/allegaeon/catworld/repository/OwnerRepository.java
- src/main/java/com/allegaeon/catworld/repository/StayRepository.java
- src/main/java/com/allegaeon/catworld/dto/OwnerResponseDTO.java
- src/main/java/com/allegaeon/catworld/mapper/OwnerMapper.java
- docs/ARCHITECTURE.md

### Planned Test Changes

- src/test/java/com/allegaeon/catworld/service/OwnerServiceTest.java
- src/test/java/com/allegaeon/catworld/controller/OwnerControllerTest.java
- src/test/java/com/allegaeon/catworld/OwnerMapperTest.java (new)
- src/test/java/com/allegaeon/catworld/repository/OwnerDeletionPersistenceTest.java (new)

### Verify Without Production Change

- src/main/java/com/allegaeon/catworld/controller/OwnerController.java
- src/main/java/com/allegaeon/catworld/service/IOwnerService.java

### Prohibited and Out-of-Scope Changes

- CatRepository; cat/vet/stay deletion services; shared deletion policy;
  security; global exception handling; entities; migrations; frontend; sibling
  artifacts; application-account behavior; PR/workflow templates.

## Dependency and Conflict Plan

- #197 is layer 2 and must not launch until both #196 and #198 PRs are observed
  user-merged into the remote coordinator branch, the local coordinator is
  safely refreshed, and exact delivered commits are present in ancestry.
- Its hard dependencies serialize the single combined docs/ARCHITECTURE.md
  ownership and let the owner child consume the integrated contract; they do
  not authorize reimplementation of sibling scope.
- OwnerRepository and StayRepository ownership avoids the shared CatRepository
  conflict. No other child in this run may edit docs/ARCHITECTURE.md.
- Stop if current integrated evidence would require editing a sibling-owned or
  prohibited surface.

## Validation Evidence Plan

| Requirement | Evidence |
|---|---|
| Missing owner and ordering | OwnerServiceTest and OwnerControllerTest prove 404 before later work |
| Authorization before relationship exposure | Ordered service verification proves 403 and zero relationship calls |
| Cat and stay references block independently | Service and persistence tests prove 409 and record preservation |
| Authorized unreferenced deletion | Service/controller/persistence tests prove delete plus flush and 204 |
| Concurrent constraint translation | Service tests cover both Spring exceptions as 409 |
| Full-rule canDelete | Service, mapper, and controller tests cover authorization and both relationships |
| Both real foreign keys | JPA persistence tests and serialized clean MySQL/Flyway startup |
| Integrated documentation | Source review against #148 shared contract and integrated code |
| Backend regression | ./mvnw verify |
| Scope containment | Changed-path review against this source map |

Docker startup uses shared fixed ports and must be serialized by the
coordinator. It must not overlap another child validation stack.

## Risks and Mitigations

- Check/delete race: delete plus flush, existing FKs, and local exception
  translation produce a rolled-back 409.
- Authorization information leak: policy authorization precedes both queries.
- Stale rendering hint: DELETE recomputes every rule.
- Sibling collision: owner/stay-local queries and layer-2 docs ownership keep
  changed surfaces disjoint.
- Scope creep into stay history: direct Stay.owner existence is sufficient; no
  StayCat traversal or stay-status logic is added.

## Completion Gate

Implementation is complete only after both hard dependencies are integrated,
all prepared tasks are complete, focused and full validation passes at the
delivered head, coordinator-serialized MySQL/Flyway validation passes, the
changed paths reconcile to this source map, and no blocker remains. Every
non-passing result must retain its explicit status.
