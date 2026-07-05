# Tasks: Creator Attribution for Operational Records

**Input**: Design documents from `specs/008-creator-attribution/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Required by issue #146, the constitution, the validation matrix, and the plan because this feature touches security, persistence, migrations, shared API contracts, and operational deployment.

**Organization**: Tasks are grouped by verifiable technical outcome.

## Format: `[ID] [P?] [Trace] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Trace]**: Technical outcome trace from spec.md (`TO1`, `TO2`, `TO3`)
- Include exact file paths in descriptions

## Phase 1: Foundational Schema and Model Prerequisites

**Purpose**: Add the shared internal persistence shape required before service assignment and persistence enforcement can be implemented.

- [X] T001 Add required `createdBy` relation to `src/main/java/com/allegaeon/catworld/model/Owner.java`
- [X] T002 [P] Add required `createdBy` relation to `src/main/java/com/allegaeon/catworld/model/Cat.java`
- [X] T003 [P] Add required `createdBy` relation to `src/main/java/com/allegaeon/catworld/model/Vet.java`
- [X] T004 [P] Add required `createdBy` relation to `src/main/java/com/allegaeon/catworld/model/Stay.java`
- [X] T005 Add current authenticated account resolver in `src/main/java/com/allegaeon/catworld/security/CurrentUserAccountService.java`
- [X] T006 Add required `created_by_id` columns and foreign keys in `src/main/resources/db/migration/V3__add_creator_attribution.sql`

**Checkpoint**: JPA model, current-user lookup, and Flyway schema prerequisites exist for all implementation phases.

---

## Phase 2: TO1 - Assign Authenticated Creator During Operational Record Creation

**Goal**: New owner, cat, vet, and stay records persist the authenticated `UserAccount` as creator.

**Verification**: Service tests capture saved entities and prove `createdBy` matches the current authenticated account for each create path.

### Evidence for TO1

- [X] T007 [P] [TO1] Add owner creator-assignment service test in `src/test/java/com/allegaeon/catworld/service/OwnerServiceTest.java`
- [X] T008 [P] [TO1] Add cat creator-assignment service test in `src/test/java/com/allegaeon/catworld/service/CatServiceTest.java`
- [X] T009 [P] [TO1] Add vet creator-assignment service test in `src/test/java/com/allegaeon/catworld/service/VetServiceTest.java`
- [X] T010 [TO1] Extend stay creator-assignment coverage in `src/test/java/com/allegaeon/catworld/service/StayServiceTest.java`

### Implementation for TO1

- [X] T011 [TO1] Inject `CurrentUserAccountService` and assign creator during owner creation in `src/main/java/com/allegaeon/catworld/service/OwnerService.java`
- [X] T012 [TO1] Inject `CurrentUserAccountService` and assign creator during cat creation in `src/main/java/com/allegaeon/catworld/service/CatService.java`
- [X] T013 [TO1] Inject `CurrentUserAccountService` and assign creator during vet creation in `src/main/java/com/allegaeon/catworld/service/VetService.java`
- [X] T014 [TO1] Inject `CurrentUserAccountService` and assign creator during stay creation without changing stay invariants in `src/main/java/com/allegaeon/catworld/service/StayService.java`

**Checkpoint**: TO1 is objectively verifiable through service tests.

---

## Phase 3: TO2 - Enforce Required Creator Relation in Persistence

**Goal**: The schema and persistence layer reject missing or invalid creator references for owner, cat, vet, and stay rows.

**Verification**: Persistence tests prove required relations, and Docker Compose MySQL startup proves Flyway and Hibernate validation agree.

### Evidence for TO2

- [X] T015 [TO2] Add persistence tests for required creator relations in `src/test/java/com/allegaeon/catworld/repository/OperationalCreatorPersistenceTest.java`
- [X] T016 [TO2] Ensure `src/test/java/com/allegaeon/catworld/repository/OperationalCreatorPersistenceTest.java` covers owner, cat, vet, stay, missing creator rejection, invalid creator FK rejection, and valid creator persistence

### Implementation for TO2

- [X] T017 [TO2] Verify JPA mappings in `src/main/java/com/allegaeon/catworld/model/Owner.java`, `src/main/java/com/allegaeon/catworld/model/Cat.java`, `src/main/java/com/allegaeon/catworld/model/Vet.java`, and `src/main/java/com/allegaeon/catworld/model/Stay.java` align with `src/main/resources/db/migration/V3__add_creator_attribution.sql` and `src/main/java/com/allegaeon/catworld/model/UserAccount.java` remains without a creator self-reference

**Checkpoint**: TO2 is objectively verifiable through persistence tests and later MySQL startup validation.

---

## Phase 4: TO3 - Preserve Client Creation Contracts

**Goal**: Existing owner, cat, vet, and stay creation requests stay creator-free and client behavior remains unchanged.

**Verification**: DTO/controller contract checks prove creator fields are not added to client payloads or visible responses for this issue.

### Evidence for TO3

- [X] T018 [P] [TO3] Add no-creator response assertions for owner creation in `src/test/java/com/allegaeon/catworld/controller/OwnerControllerTest.java`
- [X] T019 [P] [TO3] Add no-creator response assertions for cat creation in `src/test/java/com/allegaeon/catworld/controller/CatControllerTest.java`
- [X] T020 [P] [TO3] Add no-creator response assertions for vet creation in `src/test/java/com/allegaeon/catworld/controller/VetControllerTest.java`
- [X] T021 [P] [TO3] Add no-creator response assertions for stay creation in `src/test/java/com/allegaeon/catworld/controller/StayControllerTest.java`

### Implementation for TO3

- [X] T022 [TO3] Confirm creator fields remain absent from `src/main/java/com/allegaeon/catworld/dto/OwnerRequestDTO.java`, `src/main/java/com/allegaeon/catworld/dto/CatRequestDTO.java`, `src/main/java/com/allegaeon/catworld/dto/VetRequestDTO.java`, and `src/main/java/com/allegaeon/catworld/dto/StayRequestDTO.java`
- [X] T023 [TO3] Confirm creator display remains absent from owner, cat, vet, and stay response mapping in `src/main/java/com/allegaeon/catworld/mapper/OwnerMapper.java`, `src/main/java/com/allegaeon/catworld/mapper/CatMapper.java`, `src/main/java/com/allegaeon/catworld/mapper/VetMapper.java`, and `src/main/java/com/allegaeon/catworld/mapper/StayMapper.java`

**Checkpoint**: TO3 is objectively verifiable through controller contract tests and DTO/mapper review.

---

## Phase 5: Source-of-Truth Documentation and Validation

**Purpose**: Update source-of-truth docs/diagrams and run required validation after implementation.

- [X] T024 [P] Update creator attribution behavior in `docs/ARCHITECTURE.md`
- [X] T025 [P] Update pre-deployment empty-table recheck guidance in `docs/OPERATIONS.md`
- [X] T026 [P] Update creator relationships in `docs/uml/01-domain-classes.puml`
- [X] T027 [P] Update creator columns and foreign keys in `docs/uml/02-db-schema.puml`
- [X] T028 Run `./mvnw verify` from the repository root and record the result
- [X] T029 Run clean MySQL Flyway startup validation with Docker Compose from `specs/008-creator-attribution/quickstart.md` and record the result or report if Docker is unavailable
- [X] T030 Review changed files against the plan source map and justify or remove any unplanned surfaces
- [X] T031 Rerun affected validation after any late relevant change, or report stale/not-revalidated checks explicitly

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1**: Must complete before TO1, TO2, and TO3 implementation can be fully validated.
- **Phase 2 (TO1)**: Depends on Phase 1 current-account resolver and model fields.
- **Phase 3 (TO2)**: Depends on Phase 1 model and migration work.
- **Phase 4 (TO3)**: Can run after Phase 1; it must remain consistent with TO1 implementation.
- **Phase 5**: Depends on TO1, TO2, and TO3 implementation.

### Technical Outcome Dependencies

- **TO1**: Requires foundational model fields and current-account resolver.
- **TO2**: Requires foundational model fields and migration.
- **TO3**: Requires DTOs/mappers to remain creator-free while TO1 adds service-side assignment.

### Parallel Opportunities

- T002, T003, and T004 can run in parallel after T001 is understood because they touch different entity files.
- T007, T008, and T009 can run in parallel because they create or update different service test files.
- T018, T019, T020, and T021 can run in parallel because they touch different controller test files.
- T024, T025, T026, and T027 can run in parallel after implementation behavior is final.

---

## Parallel Example: TO1

```text
Task: "Add owner creator-assignment service test in src/test/java/com/allegaeon/catworld/service/OwnerServiceTest.java"
Task: "Add cat creator-assignment service test in src/test/java/com/allegaeon/catworld/service/CatServiceTest.java"
Task: "Add vet creator-assignment service test in src/test/java/com/allegaeon/catworld/service/VetServiceTest.java"
```

## Parallel Example: TO3

```text
Task: "Add no-creator response assertions for owner creation in src/test/java/com/allegaeon/catworld/controller/OwnerControllerTest.java"
Task: "Add no-creator response assertions for cat creation in src/test/java/com/allegaeon/catworld/controller/CatControllerTest.java"
Task: "Add no-creator response assertions for vet creation in src/test/java/com/allegaeon/catworld/controller/VetControllerTest.java"
Task: "Add no-creator response assertions for stay creation in src/test/java/com/allegaeon/catworld/controller/StayControllerTest.java"
```

---

## Implementation Strategy

### First Verifiable Increment

1. Complete Phase 1 foundational model, resolver, and migration work.
2. Complete Phase 2 TO1 service tests and service assignment.
3. Run focused service tests or `./mvnw verify` to prove creator assignment.

### Incremental Delivery

1. Complete foundational entity, resolver, and migration tasks.
2. Deliver TO1 creator assignment and validate service behavior.
3. Deliver TO2 persistence enforcement and validate JPA/schema behavior.
4. Deliver TO3 contract preservation checks.
5. Update source-of-truth docs and run full validation.

### Validation Freshness

All validation commands and manual checks must be rerun after late changes that affect the evidence. Any check that cannot be rerun must be reported as skipped, stale, partial, or not revalidated rather than passed.

## Notes

- Do not add creator attribution to `UserAccount`.
- Do not expose creator fields in client request payloads or response DTOs.
- Do not change stay status persistence or protected stay invariants.
- Do not add deletion authorization, creator display, `updatedBy`, or activity logs for this issue.
