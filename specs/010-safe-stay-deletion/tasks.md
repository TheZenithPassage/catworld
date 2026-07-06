# Tasks: Safe Stay Deletion

**Input**: Design documents from `/specs/010-safe-stay-deletion/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/api-stay-deletion.md, quickstart.md

**Tests**: Required by issue #195, the constitution, and the plan because the feature changes backend authorization, API status behavior, API response contract, and persistence side effects.

**Organization**: Tasks are grouped by dependency-driven verifiable technical outcomes from spec.md.

## Format: `[ID] [P?] [Trace] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Trace]**: Technical outcome label from spec.md
- Include exact file paths in descriptions

## Phase 1: Foundational Shared Prerequisites

**Purpose**: Add the narrow shared policy and DTO surfaces used by both DELETE enforcement and response rendering.

- [x] T001 Add a non-throwing `canDelete(UserAccount creator, Instant createdAt)` calculation and make `authorize(...)` delegate to it in `src/main/java/com/allegaeon/catworld/service/DeletionAuthorizationPolicy.java`
- [x] T002 [P] Add the `canDelete` response field to `src/main/java/com/allegaeon/catworld/dto/StayResponseDTO.java`
- [x] T003 [P] Add `canDelete` matrix assertions alongside the existing authorization matrix in `src/test/java/com/allegaeon/catworld/service/DeletionAuthorizationPolicyTest.java`

**Checkpoint**: The shared policy can be used for both enforcement and rendering without duplicating the authorization matrix.

---

## Phase 2: Technical Outcome 1 - Authorized Stay Deletion (Priority: P1)

**Goal**: Authenticated stay deletion is available only to users authorized by the #147 policy, with correct HTTP status behavior.

**Verification**: Service tests prove authorization happens before deletion and denial leaves the stay untouched; controller tests prove DELETE status mapping for success, missing stay, forbidden deletion and conflict.

### Evidence for Technical Outcome 1

- [x] T004 [P] [TO1] Add stay service deletion tests for authorized `ADMIN`, eligible own recent `STAFF`, ineligible `STAFF`, policy-before-delete ordering, and conflict translation in `src/test/java/com/allegaeon/catworld/service/StayServiceTest.java`
- [x] T005 [P] [TO1] Add DELETE `/api/stays/{id}` controller tests for `204`, `404`, `403`, and `409` in `src/test/java/com/allegaeon/catworld/controller/StayControllerTest.java`

### Implementation for Technical Outcome 1

- [x] T006 [TO1] Add `void deleteStay(UUID stayId)` to `src/main/java/com/allegaeon/catworld/service/IStayService.java`
- [x] T007 [TO1] Implement `deleteStay(UUID stayId)` in `src/main/java/com/allegaeon/catworld/service/StayService.java` using stay lookup, `DeletionAuthorizationPolicy.authorize(...)`, repository deletion, flush-backed conflict translation to `ConflictException`, and no dynamic-status modification check
- [x] T008 [TO1] Add DELETE `/api/stays/{id}` returning `204 No Content` to `src/main/java/com/allegaeon/catworld/controller/StayController.java`

**Checkpoint**: DELETE is functional and objectively verifiable at service and API layers.

---

## Phase 3: Technical Outcome 2 - Owned Link Deletion Only (Priority: P2)

**Goal**: Permanent deletion removes the stay and owned `StayCat` links while preserving cancellation behavior and unrelated cat, owner, vet and account records.

**Verification**: Persistence evidence proves owned-link cleanup and unrelated-record preservation; service evidence proves cancelled, reserved, checked-in and checked-out dynamic states do not block authorized deletion.

### Evidence for Technical Outcome 2

- [x] T009 [P] [TO2] Add JPA persistence evidence for stay deletion removing `stay_cat` rows and preserving cats, owners, vets and user accounts in `src/test/java/com/allegaeon/catworld/repository/StayDeletionPersistenceTest.java`
- [x] T010 [P] [TO2] Add stay service tests proving cancelled, reserved, checked-in and checked-out stays can be deleted when authorization passes in `src/test/java/com/allegaeon/catworld/service/StayServiceTest.java`

### Implementation for Technical Outcome 2

- [x] T011 [TO2] Verify the existing `Stay.stayCats` aggregate mapping requires no schema migration or entity refactor by passing the persistence evidence in `src/test/java/com/allegaeon/catworld/repository/StayDeletionPersistenceTest.java`

**Checkpoint**: Persistence side effects and cancellation/deletion boundaries are objectively verifiable.

---

## Phase 4: Technical Outcome 3 - Stay Response `canDelete` (Priority: P3)

**Goal**: Stay API responses expose backend-calculated `canDelete` for rendering while every DELETE request still rechecks authorization server-side.

**Verification**: Policy and service/controller tests prove the serialized field follows the #147 matrix and DELETE enforcement does not trust client-rendered state.

### Evidence for Technical Outcome 3

- [x] T012 [P] [TO3] Add stay service response tests for `canDelete=true` for `ADMIN`, `canDelete=true` for eligible own recent `STAFF`, and `canDelete=false` for ineligible `STAFF` in `src/test/java/com/allegaeon/catworld/service/StayServiceTest.java`
- [x] T013 [P] [TO3] Add stay response serialization coverage for the `canDelete` field in `src/test/java/com/allegaeon/catworld/controller/StayControllerTest.java`
- [x] T014 [P] [TO3] Add mapper unit coverage for a `canDelete` response-mapping path in `src/test/java/com/allegaeon/catworld/StayMapperTest.java`

### Implementation for Technical Outcome 3

- [x] T015 [TO3] Update stay response mapping in `src/main/java/com/allegaeon/catworld/service/StayService.java` and `src/main/java/com/allegaeon/catworld/mapper/StayMapper.java` so list, detail, create and update stay responses include backend-calculated `canDelete`

**Checkpoint**: Stay responses expose `canDelete`, and DELETE enforcement remains independent of rendered state.

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Complete source-of-truth updates, required validation, and delivery readiness checks.

- [x] T016 [P] Update stay deletion and `canDelete` source-of-truth behavior in `docs/ARCHITECTURE.md`
- [x] T017 Run backend validation with `./mvnw verify`
- [x] T018 Run clean MySQL/Flyway startup validation with Docker Compose from `compose.yml`
- [x] T019 Review `git diff --name-only` and `git status --short` against the plan source map; justify or remove unplanned touched surfaces, especially shared policy and `AGENTS.md`
- [x] T020 Restore the temporary `AGENTS.md` `SPECKIT START`/`SPECKIT END` active plan pointer to the `main` version before final delivery if it changed only as local workflow state
- [x] T021 Rerun any validation affected by T016-T020 late changes, or report it as stale/not revalidated

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1**: Required before TO1 and TO3 because both rely on the shared policy/DTO surface.
- **Phase 2 (TO1)**: Depends on Phase 1.
- **Phase 3 (TO2)**: Depends on TO1 deletion implementation.
- **Phase 4 (TO3)**: Depends on Phase 1 and can proceed after TO1 service plumbing is available.
- **Phase 5**: Depends on TO1, TO2 and TO3 completion.

### Technical Outcome Dependencies

- **TO1**: First functional increment after foundational policy/DTO work.
- **TO2**: Depends on TO1 because persistence side effects require a delete operation.
- **TO3**: Depends on foundational policy/DTO work; final service mapping may share code touched by TO1.

### Parallel Opportunities

- T002 and T003 can run in parallel after T001 design is understood because they touch independent DTO/test files.
- T004 and T005 can be authored in parallel.
- T009 and T010 can be authored in parallel after delete implementation shape is known.
- T012, T013 and T014 can be authored in parallel.
- T016 can run in parallel with final validation preparation after behavior is implemented.

---

## Parallel Example: Technical Outcome 1

```bash
Task: "Add stay service deletion tests in src/test/java/com/allegaeon/catworld/service/StayServiceTest.java"
Task: "Add DELETE endpoint controller tests in src/test/java/com/allegaeon/catworld/controller/StayControllerTest.java"
```

---

## Implementation Strategy

### First Verifiable Increment

1. Complete Phase 1 shared policy/DTO prerequisites.
2. Complete Phase 2 TO1 deletion enforcement and API contract.
3. Validate TO1 with the focused service/controller tests.

### Incremental Delivery

1. Add authorized deletion behavior and validate service/API outcomes.
2. Add persistence and dynamic-status evidence for owned-link deletion.
3. Add `canDelete` response calculation and validate serialization/authorization independence.
4. Update source-of-truth documentation and run full validation.

### Notes

- Do not add frontend deletion UI; it is explicitly out of scope.
- Do not add cat, owner, vet or application-account deletion rules.
- Do not add schema migrations unless persistence validation proves existing mapping cannot satisfy the approved requirement.
- Do not broaden global exception handling unless stay-local conflict translation cannot satisfy the contract.
