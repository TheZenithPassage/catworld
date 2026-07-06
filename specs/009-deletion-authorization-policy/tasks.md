# Tasks: Shared Deletion Authorization Policy

**Input**: Design documents from `/specs/009-deletion-authorization-policy/`

**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/

**Tests**: Required. This feature changes backend authorization behavior and the issue explicitly requires parameterized tests plus `./mvnw verify`.

**Organization**: Tasks are grouped by verifiable technical outcome.

## Phase 1: Foundational

**Purpose**: Shared backend prerequisites needed before the policy can be wired into delete flows.

- [x] T001 [P] Add production `Clock` bean in `src/main/java/com/allegaeon/catworld/config/ApplicationClockConfig.java`
- [x] T002 [P] Add service-level forbidden exception and `403 Forbidden` mapping in `src/main/java/com/allegaeon/catworld/exception/ForbiddenException.java` and `src/main/java/com/allegaeon/catworld/exception/GlobalExceptionHandler.java`

**Checkpoint**: Shared time source and forbidden response mapping are available for the deletion policy.

---

## Phase 2: Technical Outcome 1 - Centralized Deletion Authorization (Priority: P1)

**Goal**: Provide one reusable backend policy for the `ADMIN` and `STAFF` deletion authorization matrix and apply it to current operational delete flows.

**Verification**: Policy matrix tests cover all role/creator/age rows, service tests prove owner/cat/vet deletes invoke the policy before deletion, and controller/API tests prove denied deletion maps to `403 Forbidden`.

### Evidence for Technical Outcome 1

- [x] T003 [P] [TO1] Add parameterized role/creator/age matrix tests in `src/test/java/com/allegaeon/catworld/service/DeletionAuthorizationPolicyTest.java`
- [x] T004 [P] [TO1] Add denied-delete API mapping tests in `src/test/java/com/allegaeon/catworld/controller/OwnerControllerTest.java`, `src/test/java/com/allegaeon/catworld/controller/CatControllerTest.java`, and `src/test/java/com/allegaeon/catworld/controller/VetControllerTest.java`
- [x] T005 [TO1] Add authorized and denied delete service tests in `src/test/java/com/allegaeon/catworld/service/OwnerServiceTest.java`, `src/test/java/com/allegaeon/catworld/service/CatServiceTest.java`, and `src/test/java/com/allegaeon/catworld/service/VetServiceTest.java`

### Implementation for Technical Outcome 1

- [x] T006 [TO1] Implement shared deletion authorization policy in `src/main/java/com/allegaeon/catworld/service/DeletionAuthorizationPolicy.java`
- [x] T007 [TO1] Invoke the shared policy before repository deletion in `src/main/java/com/allegaeon/catworld/service/OwnerService.java`, `src/main/java/com/allegaeon/catworld/service/CatService.java`, and `src/main/java/com/allegaeon/catworld/service/VetService.java`

**Checkpoint**: Current owner, cat, and vet delete flows enforce the shared policy and expose authorization denial as `403 Forbidden`.

---

## Phase 3: Technical Outcome 2 - Deterministic Time and Boundary Separation (Priority: P1)

**Goal**: Ensure the policy uses deterministic server time and keeps entity relationship/state checks outside the shared authorization decision.

**Verification**: Fixed-clock tests prove exact-boundary behavior, and review confirms the policy accepts only creator and creation-time inputs while entity lookup/state responsibilities remain in services.

### Evidence for Technical Outcome 2

- [x] T008 [P] [TO2] Cover fixed-clock inside-window, exact-boundary, and expired boundary cases in `src/test/java/com/allegaeon/catworld/service/DeletionAuthorizationPolicyTest.java`
- [x] T009 [TO2] Review `src/main/java/com/allegaeon/catworld/service/DeletionAuthorizationPolicy.java`, `src/main/java/com/allegaeon/catworld/service/OwnerService.java`, `src/main/java/com/allegaeon/catworld/service/CatService.java`, and `src/main/java/com/allegaeon/catworld/service/VetService.java` to confirm entity relationship and state checks are not moved into the policy

### Implementation for Technical Outcome 2

- [x] T010 [TO2] Ensure `src/main/java/com/allegaeon/catworld/service/DeletionAuthorizationPolicy.java` uses injected `Clock` and a strict `createdAt + 15 minutes` comparison against server time

**Checkpoint**: Boundary behavior is deterministic and policy scope remains limited to role, creator, and age.

---

## Phase 4: Polish & Cross-Cutting Concerns

**Purpose**: Documentation, scope review, and final validation required by the feature artifacts.

- [x] T011 [P] Update source-of-truth backend authorization documentation in `docs/ARCHITECTURE.md`
- [x] T012 [P] Confirm Angular does not calculate or enforce the policy by reviewing `git diff --name-only` and searching `frontend/src/` for deletion-window authorization logic
- [x] T013 Confirm no schema or Flyway migration changes were introduced by reviewing `git diff --name-only` and `src/main/resources/db/migration/`
- [x] T014 Run backend validation with `./mvnw verify`
- [x] T015 Review changed files against `specs/009-deletion-authorization-policy/plan.md` source map and rerun any validation affected by late changes

---

## Dependencies & Execution Order

### Phase Dependencies

- **Foundational (Phase 1)**: No prerequisites beyond existing branch/spec artifacts.
- **TO1 (Phase 2)**: Depends on Phase 1 exception and clock foundations.
- **TO2 (Phase 3)**: Depends on the shared policy from TO1, but fixed-clock test work can be drafted alongside TO1 policy tests.
- **Polish (Phase 4)**: Depends on TO1 and TO2 implementation being complete.

### Technical Outcome Dependencies

- **Technical Outcome 1 (P1)**: Requires Phase 1.
- **Technical Outcome 2 (P1)**: Requires the policy created for TO1.

### Parallel Opportunities

- T001 and T002 can run in parallel.
- T003 and T004 can be drafted in parallel after Phase 1.
- T011 and T012 can run in parallel after implementation.

---

## Parallel Example: Technical Outcome 1

```bash
Task: "Add parameterized role/creator/age matrix tests in src/test/java/com/allegaeon/catworld/service/DeletionAuthorizationPolicyTest.java"
Task: "Add denied-delete API mapping tests in src/test/java/com/allegaeon/catworld/controller/OwnerControllerTest.java, src/test/java/com/allegaeon/catworld/controller/CatControllerTest.java, and src/test/java/com/allegaeon/catworld/controller/VetControllerTest.java"
```

---

## Implementation Strategy

### First Verifiable Increment

1. Complete T001 and T002.
2. Complete TO1 tests and implementation.
3. Run the focused backend tests touched by TO1.

### Incremental Delivery

1. Add shared foundations.
2. Implement and validate centralized authorization for owner/cat/vet delete flows.
3. Confirm deterministic boundary behavior and policy separation.
4. Update documentation and run `./mvnw verify`.

### Notes

- Do not add frontend enforcement or visibility changes for this issue.
- Do not add Flyway migrations or schema changes unless the creator attribution dependency is unexpectedly absent, which would block the current plan.
- Do not add configurable deletion windows; that is explicitly out of scope.
