# Tasks: Block Cat Deletion When Stay History Exists

**Issue**: #196
**Parent Coordinator**: #148
**Prepared by**: Coordinator run `sidecar-148-7d6b1d4d638a41fc9cd78df9edc10be6`
**Execution rule**: The released child executes only these tasks and must not regenerate `spec.md`, `plan.md`, or `tasks.md`.

## Phase 1: Focused Test Evidence

- [ ] **T001 [TO1, TO2, TO3]** Extend
  `src/test/java/com/allegaeon/catworld/service/CatServiceTest.java` with tests
  that prove missing lookup stops immediately; authorization precedes
  `StayCatRepository.existsByCat_Id`; authorization denial never inspects
  relationships or deletes; an authorized unreferenced cat is deleted and
  flushed; any relationship throws `ConflictException`; and DELETE independently
  rechecks policy and relationship state instead of trusting a response hint.
- [ ] **T002 [TO2]** In the same service test, cover relationship blocking for
  active/future, cancelled, and completed/historical stay links without adding
  a status/date filter, and cover local translation of both
  `DataIntegrityViolationException` and `OptimisticLockingFailureException`
  raised by delete/flush.
- [ ] **T003 [TO3]** Add service response tests for `canDelete=true` only when
  authorization passes and no link exists, `false` when authorization fails,
  and `false` when an authorized cat has history; verify authorization-false
  short-circuiting does not query relationship state.
- [ ] **T004 [TO1, TO2, TO3]** Extend
  `src/test/java/com/allegaeon/catworld/controller/CatControllerTest.java` with
  DELETE response coverage for `204`, `404`, `403`, and `409`, plus cat-response
  JSON coverage for boolean `canDelete` and confirmation that creator/internal
  authorization data is not serialized.
- [ ] **T005 [TO3]** Create
  `src/test/java/com/allegaeon/catworld/CatMapperTest.java` covering both the
  explicit true/false `canDelete` mapping path and the compatibility default
  overload.
- [ ] **T006 [TO1, TO2]** Create
  `src/test/java/com/allegaeon/catworld/repository/CatDeletionPersistenceTest.java`
  proving an unreferenced cat can be deleted while its owner, vet, and creator
  remain; a referenced cat cannot be deleted; and active, cancelled, and
  historical `StayCat` rows and their stays remain after the failed deletion.

## Phase 2: Persistence and Response Contract

- [ ] **T007 [TO2]** Create
  `src/main/java/com/allegaeon/catworld/repository/StayCatRepository.java` as a
  focused `JpaRepository<StayCat, StayCatId>` and add
  `boolean existsByCat_Id(UUID catId)` with no stay-status or date predicate.
- [ ] **T008 [TO3]** Add primitive boolean `canDelete` to
  `src/main/java/com/allegaeon/catworld/dto/CatResponseDTO.java` without exposing
  creator, policy, relationship, or photo-storage internals.
- [ ] **T009 [TO3]** Update
  `src/main/java/com/allegaeon/catworld/mapper/CatMapper.java` with
  `toResponseDTO(Cat, boolean)` that maps `canDelete`, while retaining the
  existing one-argument overload as a false-default compatibility path.

## Phase 3: Cat Service Behavior

- [ ] **T010 [TO3]** Centralize cat response mapping in
  `src/main/java/com/allegaeon/catworld/service/CatService.java` so list,
  detail, create, and update responses calculate `canDelete` as shared policy
  eligibility AND absence of `StayCat` references, short-circuiting the
  relationship query when authorization is false.
- [ ] **T011 [TO1, TO2]** Make `CatService.deleteCat(UUID)` transactional and
  implement the exact lookup → `DeletionAuthorizationPolicy.authorize` →
  `StayCatRepository.existsByCat_Id` → delete → explicit flush order; throw the
  existing `ConflictException` when history exists.
- [ ] **T012 [TO2]** Wrap delete/flush in local translation of
  `DataIntegrityViolationException` and `OptimisticLockingFailureException` to
  the existing `ConflictException`, preserving transaction rollback and the
  unchanged FK as final concurrency protection.
- [ ] **T013 [Scope]** Review `CatController.java` and `ICatService.java` only to
  confirm the existing DELETE endpoint and signature need no production edit;
  do not modify them unless the prepared contract is demonstrably absent, in
  which case stop and report a source-contract blocker.

## Phase 4: Focused and Full Validation

- [ ] **T014 [Validation]** Run the focused backend suite:
  `./mvnw -Dtest=DeletionAuthorizationPolicyTest,CatServiceTest,CatControllerTest,CatMapperTest,CatDeletionPersistenceTest test`.
  Record the exact command, evaluated child head, and result.
- [ ] **T015 [Validation]** Run `./mvnw verify` and record the exact child head
  and result. Any failed, skipped, timed-out, interrupted, partial, stale,
  blocked, or not-run requirement prevents ready status.
- [ ] **T016 [Validation]** After the coordinator grants the serialized Docker
  slot, run a clean MySQL/Flyway Docker Compose startup with an isolated project
  name, verify the database and application become healthy without migration or
  schema-validation errors, and tear down only that isolated validation stack.
  Do not run this concurrently with sibling Docker validation.
- [ ] **T017 [Validation]** Rerun any focused or full validation made stale by
  later code, branch refresh, merge, or conflict-resolution changes.

## Phase 5: Scope and Handoff Review

- [ ] **T018 [Scope]** Review the child diff and confirm production changes are
  limited to `CatService.java`, `CatResponseDTO.java`, `CatMapper.java`, and new
  `StayCatRepository.java`, with tests limited to the four declared test files.
- [ ] **T019 [Scope]** Confirm there are no edits to shared authorization,
  security, exception handler/payloads, migrations, entities, stay/owner/vet
  behavior, frontend code, architecture documentation, issue/PR templates, or
  #153 photo storage.
- [ ] **T020 [Delivery]** Report changed files, explicit current validation
  statuses, remaining risks, branch/commit identity, and child PR readiness.
  The child PR must target the coordinator branch and use only `Related to #196`
  and `Related to #148`; it must instruct the user to use GitHub's **Create a
  merge commit** method and must not close either issue.

## Dependency and Stop Conditions

- Tasks T001–T006 may be authored before implementation but must align with the
  prepared source map and existing test conventions.
- T007–T009 establish the focused persistence and response surfaces required by
  T010–T012.
- T014 follows implementation; T015 follows focused validation; T016 is
  coordinator-serialized; T018–T020 follow all code and current validation.
- Stop without expanding scope if a shared policy, exception, DTO convention,
  entity mapping, migration, photo-storage, or sibling deletion change appears
  necessary or conflicts with these prepared artifacts.
- Do not edit, stage, commit, push, or open/update a PR before the coordinator's
  durable launched-evidence and targeted-release gates grant those permissions.
