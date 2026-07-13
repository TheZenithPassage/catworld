# Tasks: Safe Vet Deletion

**Input**: [spec.md](./spec.md) and [plan.md](./plan.md)
**Parent Coordinator**: #148
**Child Issue**: #198
**Dependency Layer**: 1 (no hard child dependencies)

All tasks are limited to the prepared #198 source map. The child executor must
not regenerate these artifacts or broaden work into sibling/shared surfaces.

## Phase 1: Service and API Evidence

- [ ] T001 [TO-001] Extend
  `src/test/java/com/allegaeon/catworld/service/VetServiceTest.java` with
  missing-vet lookup coverage, successful authorized unreferenced deletion,
  `delete` plus `flush` verification, and repository non-interaction after
  lookup failure.
- [ ] T002 [TO-002] Add ordered service tests proving
  `DeletionAuthorizationPolicy.authorize(...)` runs before the vet relationship
  existence query and that authorization denial performs no relationship
  query, delete, or flush.
- [ ] T003 [TO-001] Add service tests proving any positive
  `VetRepository.existsByIdAndCatsIsNotEmpty(...)` result throws
  `ConflictException` and performs no delete/flush.
- [ ] T004 [TO-002] Add service tests proving
  `DataIntegrityViolationException` and `OptimisticLockingFailureException`
  from delete/flush are each translated to `ConflictException`.
- [ ] T005 [TO-001] Extend
  `src/test/java/com/allegaeon/catworld/controller/VetControllerTest.java` with
  DELETE contract coverage for `204`, delete-specific `404`, `403`, and `409`,
  while retaining thin service delegation.

## Phase 2: Response Contract Evidence

- [ ] T006 [TO-003] Add
  `src/test/java/com/allegaeon/catworld/VetMapperTest.java` proving the boolean
  mapper path sets `canDelete=true` and `canDelete=false` without exposing
  creator data.
- [ ] T007 [TO-003] Extend `VetServiceTest` to prove list, detail, create, and
  update responses calculate `canDelete` as authorization eligibility AND no
  cat reference, including authorized-but-referenced `false`.
- [ ] T008 [TO-003] Extend `VetControllerTest` to prove `canDelete` is
  serialized on vet responses and no creator/authorization internals are
  exposed.

## Phase 3: Persistence Evidence

- [ ] T009 [TO-001] Add
  `src/test/java/com/allegaeon/catworld/repository/VetDeletionPersistenceTest.java`
  using the existing JPA test conventions to prove the current FK rejects
  deletion of a vet referenced by any cat and preserves both records.
- [ ] T010 [TO-001] In the same persistence test, prove an unreferenced vet can
  be deleted and flushed without deleting or updating unrelated cats, owners,
  stays, or user accounts.

## Phase 4: Implementation

- [ ] T011 [TO-001] Add
  `boolean existsByIdAndCatsIsNotEmpty(UUID id)` to
  `src/main/java/com/allegaeon/catworld/repository/VetRepository.java`; do not
  modify `CatRepository` or add a custom/shared repository abstraction.
- [ ] T012 [TO-003] Add primitive boolean `canDelete` to
  `src/main/java/com/allegaeon/catworld/dto/VetResponseDTO.java`.
- [ ] T013 [TO-003] Add a boolean-aware response mapping path to
  `src/main/java/com/allegaeon/catworld/mapper/VetMapper.java`, following the
  established mapper convention and keeping creator fields out of the DTO.
- [ ] T014 [TO-001] Update
  `src/main/java/com/allegaeon/catworld/service/VetService.java` so
  `deleteVet(UUID)` is transactional and executes lookup -> shared
  authorization -> vet-local relationship check -> delete -> flush.
- [ ] T015 [TO-002] In `VetService.deleteVet`, locally translate
  `DataIntegrityViolationException` and `OptimisticLockingFailureException` to
  a vet-specific `ConflictException`; do not broaden the global handler.
- [ ] T016 [TO-003] Route list, detail, create, and update vet responses through
  one service helper that calculates `canDelete` as
  `DeletionAuthorizationPolicy.canDelete(...) &&
  !VetRepository.existsByIdAndCatsIsNotEmpty(...)`.
- [ ] T017 [TO-001] Verify the existing production
  `VetController.deleteVet(...)` and `IVetService.deleteVet(UUID)` already
  satisfy the prepared contract; leave them unchanged unless a focused compile
  correction is strictly necessary and report any such deviation as a source
  map blocker before editing.

## Phase 5: Focused and Full Validation

- [ ] T018 Run focused backend tests:
  `./mvnw -Dtest=VetServiceTest,VetControllerTest,VetMapperTest,VetDeletionPersistenceTest test`.
- [ ] T019 Run the complete backend suite with `./mvnw verify`.
- [ ] T020 Review the changed paths and diff against the prepared source map;
  confirm there are no changes to `CatRepository`, shared policy, security,
  global exception handling, migrations, entities, stays, frontend, docs, or
  sibling artifacts.
- [ ] T021 Confirm through test assertions and code review that a stale
  `canDelete=true` value is never accepted by DELETE and that DELETE repeats
  authorization and relationship checks server-side.
- [ ] T022 Record the clean MySQL/Flyway Docker startup requirement as
  coordinator-serialized validation. The child MUST NOT start the shared Docker
  stack during parallel execution; report this item `not run
  (coordinator-owned)` for the coordinator to execute with
  `docker compose up --build` after safe serialization.

## Dependency Order

- T001-T010 establish the expected behavior and may be prepared in parallel
  where files are disjoint.
- T011-T016 implement the tested contract; T011-T013 may proceed independently,
  then T014-T016 integrate them in `VetService`.
- T017 confirms the existing controller/interface boundary.
- T018-T021 run only after implementation is complete.
- T022 remains coordinator-owned and does not block the child from reporting
  its own validation truthfully; it blocks final integrated readiness until the
  coordinator runs it successfully.

## Stop Conditions

- Stop before editing if satisfying the relationship query would require a
  `CatRepository`, entity, migration, shared-policy, security, global-handler,
  stay, frontend, documentation, or sibling-artifact change.
- Stop if the derived VetRepository query cannot represent the existing
  `Vet.cats` mapping without a shared-contract or schema change.
- Stop on any conflict between these prepared artifacts and current coordinator
  evidence rather than regenerating or redefining the artifacts.
- Preserve every validation result as passed, failed, skipped, timed out,
  interrupted, partial, stale, blocked, or not run; never summarize a
  non-passing result as passed.
