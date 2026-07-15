# Tasks: Safe Owner Deletion

**Issue**: #197
**Parent Coordinator**: #148
**Prepared by**: Coordinator run sidecar-148-7d6b1d4d638a41fc9cd78df9edc10be6
**Dependency Layer**: 2; hard dependencies #196 and #198
**Execution rule**: Consume these tasks without regenerating spec.md, plan.md, or tasks.md.

## Phase 0: Dependency and Scope Gate

- [ ] T001 Confirm current remote evidence shows both #196 and #198 child PRs
  were merged into the coordinator branch with Create a merge commit, the
  local coordinator branch was safely refreshed, and each exact delivered
  child commit is present in ancestry.
- [ ] T002 Re-read the integrated shared contract and changed paths; stop if
  owner work would need to redo sibling code or edit a prohibited shared
  surface.

## Phase 1: Focused Test Evidence

- [ ] T003 Extend OwnerServiceTest with missing-owner, authorized unreferenced
  success, delete-plus-flush, and no-later-interaction assertions.
- [ ] T004 Add ordered OwnerServiceTest coverage proving shared authorization
  precedes both relationship queries and denial performs no query, delete, or
  flush.
- [ ] T005 Add OwnerServiceTest cases proving a cat reference and a direct stay
  reference independently throw ConflictException, preserve ordering, and
  perform no delete/flush.
- [ ] T006 Add OwnerServiceTest cases translating DataIntegrityViolationException
  and OptimisticLockingFailureException from delete/flush to ConflictException.
- [ ] T007 Extend OwnerControllerTest with DELETE 204, delete-specific 404, 403,
  and 409 response contracts.
- [ ] T008 Add OwnerMapperTest for explicit true/false canDelete mapping and any
  retained false-default mapper overload.
- [ ] T009 Extend service/controller response tests for list, detail, create,
  and update canDelete values across authorization, cat-reference, and
  stay-reference cases, including authorization-false short-circuiting.
- [ ] T010 Add OwnerDeletionPersistenceTest proving an unreferenced owner can be
  deleted while unrelated data remains and proving each cats.owner_id and
  stays.owner_id FK independently blocks deletion and preserves records.

## Phase 2: Repository and Response Contract

- [ ] T011 Add boolean existsByIdAndCatsIsNotEmpty(UUID id) to OwnerRepository;
  do not modify CatRepository or entity mappings.
- [ ] T012 Add boolean existsByOwner_Id(UUID ownerId) to StayRepository without
  adding stay-status, cancellation, date, or StayCat predicates.
- [ ] T013 Add primitive boolean canDelete to OwnerResponseDTO without exposing
  creator, authorization, or relationship internals.
- [ ] T014 Add OwnerMapper.toResponseDTO(Owner, boolean), following the existing
  mapper convention and retaining a false-default overload if required for
  compatibility.

## Phase 3: Owner Service Behavior

- [ ] T015 Centralize list, detail, create, and update owner response mapping in
  OwnerService. Compute canDelete as shared authorization eligibility AND no cat
  reference AND no direct stay reference, short-circuiting when authorization
  is false.
- [ ] T016 Make OwnerService.deleteOwner(UUID) transactional and implement the
  exact lookup -> shared authorization -> owner-local cat check -> stay-local
  owner check -> delete -> explicit flush order.
- [ ] T017 Throw ConflictException for either known relationship and locally
  translate DataIntegrityViolationException and
  OptimisticLockingFailureException from delete/flush to ConflictException.
- [ ] T018 Verify OwnerController and IOwnerService already satisfy the
  production endpoint/signature contract. Leave them unchanged unless a
  focused compile correction is strictly necessary; report a source-map
  blocker before any deviation.

## Phase 4: Integrated Architecture Source of Truth

- [ ] T019 Update docs/ARCHITECTURE.md once with the integrated #148 contract:
  rendering-only full-rule canDelete, server-side recheck, ordered
  lookup/authorization/relationship/delete-flush enforcement, 404/403/409,
  owner cat/stay, cat history, vet cat, and completed stay relationship rules,
  plus final FK protection.
- [ ] T020 Review the documentation against integrated #195/#196/#198 behavior;
  remove no existing architectural decision and do not duplicate sibling
  implementation details.

## Phase 5: Focused and Full Validation

- [ ] T021 Run ./mvnw -Dtest=DeletionAuthorizationPolicyTest,OwnerServiceTest,OwnerControllerTest,OwnerMapperTest,OwnerDeletionPersistenceTest test and record the exact evaluated head and result.
- [ ] T022 Run ./mvnw verify and record the exact evaluated head and result.
- [ ] T023 After the coordinator grants the serialized Docker slot, run clean
  MySQL/Flyway Docker Compose startup with an isolated project name, verify the
  application/schema start cleanly and both real FK paths, then tear down only
  that isolated validation stack. Do not overlap sibling Docker validation.
- [ ] T024 Review the diff against the source map and confirm there are no
  CatRepository, sibling service, shared policy/security/handler, entity,
  migration, frontend, application-account, or sibling-artifact changes.
- [ ] T025 Confirm a stale canDelete=true is never accepted by DELETE and that
  authorization denial cannot reveal relationship state.
- [ ] T026 Rerun any evidence made stale by code changes, coordinator refresh,
  merge, or conflict resolution.

## Phase 6: Delivery Report

- [ ] T027 Report changed files, explicit current validation statuses,
  remaining risks, exact branch/commit identity, and PR readiness.
- [ ] T028 Deliver only after the durable release gate permits it. The child PR
  must target the coordinator branch, use exactly Related to #197 and Related
  to #148 as its only issue-reference lines, close neither issue, and instruct
  the user to choose Create a merge commit.

## Dependency Order and Stop Conditions

- T001-T002 are mandatory before implementation.
- T003-T010 establish evidence; T011-T014 add repository/response surfaces;
  T015-T018 implement service behavior; T019-T020 update the assigned shared
  documentation; T021-T026 validate; T027-T028 report and deliver.
- Stop if a hard dependency is not integrated, if the coordinator branch is
  stale or dirty, or if a shared contract conflicts with these artifacts.
- Stop rather than editing CatRepository, shared policy, security, global
  exception handling, entities, migrations, sibling deletion code, frontend,
  application-account behavior, sibling artifacts, or workflow templates.
- Preserve validation results as passed, failed, skipped, timed out,
  interrupted, partial, stale, blocked, or not run. Never summarize a
  non-passing result as passed.
