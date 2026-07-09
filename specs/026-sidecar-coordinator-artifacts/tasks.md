# Tasks: Sidecar Coordinator Artifacts

**Input**: Design documents from `specs/026-sidecar-coordinator-artifacts/`

**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/sidecar-coordinator-artifact.md`, `quickstart.md`

**Tests**: Required by issue #252, the feature spec, and the validation evidence plan. Evidence is local simulation plus source review; no CatWorld product runtime tests are required because no application runtime behavior changes.

**Organization**: Tasks are grouped by verifiable technical outcome.

## Phase 1: Setup

**Purpose**: Add the local validation surface used by all #252 evidence.

- [X] T001 Create the validation directory `specs/026-sidecar-coordinator-artifacts/validation/`
- [X] T002 Add the coordinator artifact simulation script skeleton in `specs/026-sidecar-coordinator-artifacts/validation/simulate-coordinator-artifact.ps1`

---

## Phase 2: Foundational

**Purpose**: Establish the shared artifact contract before outcome-specific workflow text and simulations.

- [X] T003 Update the coordinator artifact contract in `specs/026-sidecar-coordinator-artifacts/contracts/sidecar-coordinator-artifact.md` with final section names, write-gate rules, existing-artifact identity rules, factual update states, blocked-state behavior, and validation expectations
- [X] T004 Update architecture source-of-truth text in `docs/ARCHITECTURE.md` to summarize the #252 coordinator artifact write gate, required content, factual state updates, and same-run resume/collision behavior
- [X] T005 Update sidecar coordinator source text in `.agents/skills/catworld-parallel-coordinator/SKILL.md` to reference issue #252 and the coordinator artifact execution contract without activating sidecar routing before #261

**Checkpoint**: Shared artifact contract and source-of-truth wording are aligned.

---

## Phase 3: Technical Outcome 1 - Write-Gated Coordinator Artifact Creation (Priority: P1)

**Goal**: A future valid sidecar coordinator run can plan artifact paths/content before branch preparation but writes coordinator artifact files only after the coordinator branch/worktree is active.

**Verification**: The validation script proves planning on `main` writes zero files and writing after coordinator branch/worktree entry writes the coordinator artifact in the allowed context.

### Evidence for Technical Outcome 1

- [X] T006 [TO1] Implement `valid`, `plan-on-main`, `write-after-branch`, and `main-cleanliness` scenarios in `specs/026-sidecar-coordinator-artifacts/validation/simulate-coordinator-artifact.ps1`
- [X] T007 [TO1] Run `powershell -ExecutionPolicy Bypass -File specs/026-sidecar-coordinator-artifacts/validation/simulate-coordinator-artifact.ps1 -Scenario plan-on-main` and verify no files are written while the simulated checkout is `main`
- [X] T008 [TO1] Run `powershell -ExecutionPolicy Bypass -File specs/026-sidecar-coordinator-artifacts/validation/simulate-coordinator-artifact.ps1 -Scenario write-after-branch` and verify artifact writing occurs only after entering a non-main coordinator branch/worktree
- [X] T009 [TO1] Run `powershell -ExecutionPolicy Bypass -File specs/026-sidecar-coordinator-artifacts/validation/simulate-coordinator-artifact.ps1 -Scenario main-cleanliness` and verify the temporary `main` branch remains clean after planning

### Implementation for Technical Outcome 1

- [X] T010 [TO1] Strengthen the artifact path/content planning and branch/worktree write boundary in `.agents/skills/catworld-parallel-coordinator/SKILL.md`
- [X] T011 [TO1] Strengthen the local `main` cleanliness and write-gate documentation in `docs/ARCHITECTURE.md`
- [X] T012 [TO1] Update `specs/026-sidecar-coordinator-artifacts/quickstart.md` if command names or expected outputs changed during implementation

**Checkpoint**: Coordinator artifact writes are gated by active coordinator branch/worktree state and local `main` remains clean during planning.

---

## Phase 4: Technical Outcome 2 - Durable Artifact Content and Factual State Updates (Priority: P2)

**Goal**: The coordinator artifact contains enough durable context and status for a later Codex session to continue without private conversation context.

**Verification**: The validation script proves the artifact includes all required sections and that blocked/future state updates are factual rather than implied.

### Evidence for Technical Outcome 2

- [X] T013 [TO2] Implement required-section inspection and blocked coordinator state output in `specs/026-sidecar-coordinator-artifacts/validation/simulate-coordinator-artifact.ps1`
- [X] T014 [TO2] Run `powershell -ExecutionPolicy Bypass -File specs/026-sidecar-coordinator-artifacts/validation/simulate-coordinator-artifact.ps1 -Scenario valid` and verify the artifact path and required content sections
- [X] T015 [TO2] Run `powershell -ExecutionPolicy Bypass -File specs/026-sidecar-coordinator-artifacts/validation/simulate-coordinator-artifact.ps1 -Scenario blocked` and verify the blocker is recorded without child work launch

### Implementation for Technical Outcome 2

- [X] T016 [TO2] Add required coordinator artifact sections, resume/status table expectations, factual state labels, and blocked-state update rules to `.agents/skills/catworld-parallel-coordinator/SKILL.md`
- [X] T017 [TO2] Add durable artifact and factual update summary to `docs/ARCHITECTURE.md`
- [X] T018 [TO2] Reconcile `specs/026-sidecar-coordinator-artifacts/contracts/sidecar-coordinator-artifact.md` with the final skill wording if any section names changed

**Checkpoint**: Coordinator artifacts are sufficient for resumable state without implying nonexistent branches, worktrees, PRs, validation, merges, or cleanup.

---

## Phase 5: Technical Outcome 3 - Safe Existing Artifact Resume or Collision Stop (Priority: P3)

**Goal**: Repeated sidecar coordinator runs detect existing artifacts and either resume the same run safely or stop before writing on collision.

**Verification**: The validation script includes both same-run resume and collision-stop results for an existing same-number coordinator artifact.

### Evidence for Technical Outcome 3

- [X] T019 [TO3] Implement same-run resume and collision-stop simulation in `specs/026-sidecar-coordinator-artifacts/validation/simulate-coordinator-artifact.ps1`
- [X] T020 [TO3] Run `powershell -ExecutionPolicy Bypass -File specs/026-sidecar-coordinator-artifacts/validation/simulate-coordinator-artifact.ps1 -Scenario existing-artifact` and verify both safe resume and collision stop behavior

### Implementation for Technical Outcome 3

- [X] T021 [TO3] Add existing same-number artifact identity and collision-stop rules to `.agents/skills/catworld-parallel-coordinator/SKILL.md`
- [X] T022 [TO3] Add same-run resume and collision-stop summary to `docs/ARCHITECTURE.md`

**Checkpoint**: Repeated runs can resume only proven same-run artifacts and otherwise stop before modifying files.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final validation, source-map review, and task/spec consistency.

- [X] T023 Run all quickstart validation commands from `specs/026-sidecar-coordinator-artifacts/quickstart.md`
- [X] T024 Run `git diff --check`
- [X] T025 Review changed files against `specs/026-sidecar-coordinator-artifacts/plan.md` source map and confirm no application runtime code, sequential implementation skill, dormant legacy orchestration skill, real sidecar worktree, real sidecar product branch, PR operation, GitHub issue mutation, or public comment was added
- [X] T026 Rerun any affected validation after late edits to `.agents/skills/catworld-parallel-coordinator/SKILL.md`, `docs/ARCHITECTURE.md`, `specs/026-sidecar-coordinator-artifacts/contracts/sidecar-coordinator-artifact.md`, `specs/026-sidecar-coordinator-artifacts/quickstart.md`, or `specs/026-sidecar-coordinator-artifacts/validation/simulate-coordinator-artifact.ps1`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies.
- **Foundational (Phase 2)**: Depends on Phase 1 for the validation script path and on the completed plan/spec/contract.
- **TO1 (Phase 3)**: Depends on foundational write-gate wording.
- **TO2 (Phase 4)**: Depends on foundational artifact contract; can be implemented after TO1 source wording is stable.
- **TO3 (Phase 5)**: Depends on foundational artifact identity language and TO2 factual metadata expectations.
- **Polish (Phase 6)**: Depends on TO1, TO2, and TO3 completion.

### Technical Outcome Dependencies

- **TO1**: First verifiable increment; establishes the write gate and local `main` safety.
- **TO2**: Builds on the artifact write gate so durable status updates happen in the allowed context.
- **TO3**: Builds on TO2 metadata so repeated runs can prove same-run identity or stop on collision.

### Parallel Opportunities

- T004 and T005 touch different files after T003 defines the final contract and can be reviewed in parallel.
- T010 and T011 touch different files and can be edited in parallel after T006 is complete.
- T016 and T017 touch different files and can be edited in parallel after T013 is complete.
- T021 and T022 touch different files and can be edited in parallel after T019 is complete.

---

## Implementation Strategy

### First Verifiable Increment

1. Complete Phase 1 and Phase 2.
2. Complete TO1 write-gate simulation and source wording.
3. Validate `plan-on-main`, `write-after-branch`, and `main-cleanliness`.

### Incremental Delivery

1. Deliver TO1 to prove local `main` safety.
2. Add TO2 to prove durable artifact content and factual updates.
3. Add TO3 to prove safe same-run resume versus collision stop.
4. Run all quickstart validation and `git diff --check`.
