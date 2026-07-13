# Tasks: Prepared Child Spec Kit Artifacts

**Input**: Design documents from `specs/027-prepared-child-artifacts/`

**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/prepared-child-artifacts.md`, `quickstart.md`

**Tests**: Required by issue #253, the feature spec, and the validation evidence plan. Evidence is local simulation plus source review; no CatWorld product runtime tests are required because no application runtime behavior changes.

**Organization**: Tasks are grouped by verifiable technical outcome.

## Phase 1: Setup

**Purpose**: Add the local validation surface used by all #253 evidence.

- [X] T001 Create the validation directory `specs/027-prepared-child-artifacts/validation/`
- [X] T002 Add the prepared child artifact simulation script skeleton in `specs/027-prepared-child-artifacts/validation/simulate-prepared-child-artifacts.ps1`

---

## Phase 2: Foundational

**Purpose**: Establish the shared prepared-child artifact contract before outcome-specific workflow text and simulations.

- [X] T003 Update the prepared child artifact contract in `specs/027-prepared-child-artifacts/contracts/prepared-child-artifacts.md` with final path, input, write-gate, scope, blocker, collision, status, and delegation rules
- [X] T004 Update architecture source-of-truth text in `docs/ARCHITECTURE.md` to summarize #253 prepared child artifact generation, write boundaries, status tracking, handoff rules, and stop conditions
- [X] T005 Update sidecar coordinator source text in `.agents/skills/catworld-parallel-coordinator/SKILL.md` to reference issue #253 and the prepared child artifact execution contract without activating sidecar routing before #261
- [X] T006 Update sidecar child implementation source text in `.agents/skills/catworld-parallel-child-implementation/SKILL.md` to require consuming prepared artifacts and prohibit independent artifact regeneration

**Checkpoint**: Shared prepared-child artifact contract and source-of-truth wording are aligned.

---

## Phase 3: Technical Outcome 1 - Prepared Child Artifact Sets Before Delegation (Priority: P1)

**Goal**: A future valid sidecar coordinator run can prepare `spec.md`, `plan.md`, and `tasks.md` for each child before child-agent launch.

**Verification**: The validation script proves a coordinator with three child issues plans the required child artifact paths and files, and the source text blocks fan-out when dependency-ready child artifacts are missing.

### Evidence for Technical Outcome 1

- [X] T007 [TO1] Implement the `valid` scenario in `specs/027-prepared-child-artifacts/validation/simulate-prepared-child-artifacts.ps1` with three child issues, planned artifact paths, planned `spec.md`, `plan.md`, `tasks.md` content, and coordinator artifact preparation statuses
- [X] T008 [TO1] Run `powershell -ExecutionPolicy Bypass -File specs/027-prepared-child-artifacts/validation/simulate-prepared-child-artifacts.ps1 -Scenario valid` and verify generated child artifact paths, planned file content, coordinator status, and handoff readiness output

### Implementation for Technical Outcome 1

- [X] T009 [TO1] Add prepared child artifact path, required file set, source input, preparation-status, and missing-artifact fan-out blocker rules to `.agents/skills/catworld-parallel-coordinator/SKILL.md`
- [X] T010 [TO1] Add prepared artifact consumption and no-regeneration handoff rules to `.agents/skills/catworld-parallel-child-implementation/SKILL.md`
- [X] T011 [TO1] Add prepared child artifact summary and child handoff boundary text to `docs/ARCHITECTURE.md`
- [X] T012 [TO1] Update `specs/027-prepared-child-artifacts/quickstart.md` if command names or expected outputs changed during implementation

**Checkpoint**: Dependency-ready child fan-out requires prepared child `spec.md`, `plan.md`, and `tasks.md` artifacts.

---

## Phase 4: Technical Outcome 2 - Coordinator Branch/Worktree Write Gate and Local Main Safety (Priority: P2)

**Goal**: Child artifact paths and contents may be planned before branch/worktree preparation, but child files are written only after entering the coordinator branch/worktree and never to local `main`.

**Verification**: The validation script proves planning on `main` writes zero files, writing occurs only inside a non-main coordinator context, and simulated local `main` remains clean.

### Evidence for Technical Outcome 2

- [X] T013 [TO2] Implement `plan-on-main`, `write-after-branch`, and `main-cleanliness` scenarios in `specs/027-prepared-child-artifacts/validation/simulate-prepared-child-artifacts.ps1`
- [X] T014 [TO2] Run `powershell -ExecutionPolicy Bypass -File specs/027-prepared-child-artifacts/validation/simulate-prepared-child-artifacts.ps1 -Scenario plan-on-main` and verify no child artifact files are written while simulated checkout is `main`
- [X] T015 [TO2] Run `powershell -ExecutionPolicy Bypass -File specs/027-prepared-child-artifacts/validation/simulate-prepared-child-artifacts.ps1 -Scenario write-after-branch` and verify child artifact writing occurs only after entering a simulated coordinator branch/worktree
- [X] T016 [TO2] Run `powershell -ExecutionPolicy Bypass -File specs/027-prepared-child-artifacts/validation/simulate-prepared-child-artifacts.ps1 -Scenario main-cleanliness` and verify simulated local `main` remains clean after planning

### Implementation for Technical Outcome 2

- [X] T017 [TO2] Strengthen child artifact planning/write separation and coordinator branch/worktree write gate in `.agents/skills/catworld-parallel-coordinator/SKILL.md`
- [X] T018 [TO2] Strengthen local `main` cleanliness and temporary build-out branch distinction in `docs/ARCHITECTURE.md`

**Checkpoint**: Child artifact writes are gated by active coordinator branch/worktree state and local `main` remains clean during planning.

---

## Phase 5: Technical Outcome 3 - Shared Contract, Scope, Collision, and Delegation Stop Gates (Priority: P3)

**Goal**: The coordinator stops before delegation when shared contract state is missing or conflicting, a child artifact includes sibling scope, child issue numbers duplicate, or artifact paths collide without same-run proof.

**Verification**: The validation script proves missing shared contracts, sibling-scope leakage, existing artifact collisions, and duplicate child numbers stop the run before writing or delegation.

### Evidence for Technical Outcome 3

- [X] T019 [TO3] Implement `missing-shared-contract`, `sibling-scope`, and `existing-artifact` scenarios in `specs/027-prepared-child-artifacts/validation/simulate-prepared-child-artifacts.ps1`
- [X] T020 [TO3] Run `powershell -ExecutionPolicy Bypass -File specs/027-prepared-child-artifacts/validation/simulate-prepared-child-artifacts.ps1 -Scenario missing-shared-contract` and verify delegation stops without inventing a seed, foundation, or shared-contract issue
- [X] T021 [TO3] Run `powershell -ExecutionPolicy Bypass -File specs/027-prepared-child-artifacts/validation/simulate-prepared-child-artifacts.ps1 -Scenario sibling-scope` and verify sibling-scope leakage stops before delegation
- [X] T022 [TO3] Run `powershell -ExecutionPolicy Bypass -File specs/027-prepared-child-artifacts/validation/simulate-prepared-child-artifacts.ps1 -Scenario existing-artifact` and verify same-run resume, unproven collision stop, and duplicate child issue number stop behavior

### Implementation for Technical Outcome 3

- [X] T023 [TO3] Add shared-contract blocker, child scope validation, sibling-scope stop, duplicate child number, and child artifact collision rules to `.agents/skills/catworld-parallel-coordinator/SKILL.md`
- [X] T024 [TO3] Add shared-contract, sibling-scope, duplicate number, and collision stop summaries to `docs/ARCHITECTURE.md`
- [X] T025 [TO3] Reconcile `specs/027-prepared-child-artifacts/contracts/prepared-child-artifacts.md` with final workflow wording if any status names or stop conditions changed

**Checkpoint**: Prepared child artifact delegation cannot proceed through missing contract, sibling scope, duplicate issue, or unproven collision blockers.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final validation, source-map review, and task/spec consistency.

- [X] T026 Run all quickstart validation commands from `specs/027-prepared-child-artifacts/quickstart.md`
- [X] T027 Run `git diff --check`
- [X] T028 Run source review `Select-String -Path .agents/skills/catworld-parallel-coordinator/SKILL.md,docs/ARCHITECTURE.md -Pattern 'prepared child','spec.md','plan.md','tasks.md','shared implementation contract','sibling'`
- [X] T029 Run source review `Select-String -Path .agents/skills/catworld-parallel-child-implementation/SKILL.md -Pattern 'prepared child','regenerate','spec.md','plan.md','tasks.md'`
- [X] T030 Review changed files against `specs/027-prepared-child-artifacts/plan.md` source map and confirm no application runtime code, sequential implementation skill, dormant legacy orchestration skill, real sidecar worktree, real sidecar product branch, PR operation, GitHub issue mutation, public comment, normal sequential Spec Kit naming change, or unapproved remote cleanup was added
- [X] T031 Rerun any affected validation after late edits to `.agents/skills/catworld-parallel-coordinator/SKILL.md`, `.agents/skills/catworld-parallel-child-implementation/SKILL.md`, `docs/ARCHITECTURE.md`, `specs/027-prepared-child-artifacts/contracts/prepared-child-artifacts.md`, `specs/027-prepared-child-artifacts/quickstart.md`, or `specs/027-prepared-child-artifacts/validation/simulate-prepared-child-artifacts.ps1`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies.
- **Foundational (Phase 2)**: Depends on Phase 1 for the validation script path and on the completed plan/spec/contract.
- **TO1 (Phase 3)**: Depends on foundational child artifact wording.
- **TO2 (Phase 4)**: Depends on foundational write-gate wording and TO1 artifact-set definitions.
- **TO3 (Phase 5)**: Depends on foundational artifact identity and TO1 child status language.
- **Polish (Phase 6)**: Depends on TO1, TO2, and TO3 completion.

### Technical Outcome Dependencies

- **TO1**: First verifiable increment; establishes prepared child artifact sets and fan-out readiness.
- **TO2**: Builds on TO1 so prepared artifacts are written only in the allowed coordinator context.
- **TO3**: Builds on TO1 and TO2 to prove unsafe child artifact preparation stops before writing or delegation.

### Parallel Opportunities

- T004, T005, and T006 touch different files after T003 defines the final contract and can be reviewed in parallel.
- T009, T010, and T011 touch different files and can be edited in parallel after T007 is complete.
- T017 and T018 touch different files and can be edited in parallel after T013 is complete.
- T023 and T024 touch different files and can be edited in parallel after T019 is complete.

---

## Implementation Strategy

### First Verifiable Increment

1. Complete Phase 1 and Phase 2.
2. Complete TO1 prepared child artifact simulation and source wording.
3. Validate the `valid` scenario.

### Incremental Delivery

1. Deliver TO1 to prove prepared child artifacts exist before fan-out.
2. Add TO2 to prove local `main` safety and coordinator branch/worktree write gating.
3. Add TO3 to prove shared-contract, sibling-scope, duplicate-number, and collision stop behavior.
4. Run all quickstart validation, source reviews, and `git diff --check`.
