# Tasks: Sidecar Branch Worktree Orchestration

**Input**: Design documents from `specs/028-sidecar-branch-worktree/`

**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/sidecar-branch-worktree-orchestration.md`, `quickstart.md`

**Tests**: Required by issue #254, the feature spec, and the validation evidence plan. Evidence is local temporary Git repository simulation plus source review; no CatWorld product runtime tests are required because no application runtime behavior changes.

**Organization**: Tasks are grouped by verifiable technical outcome.

## Phase 1: Setup

**Purpose**: Add the local validation surface used by all #254 evidence.

- [X] T001 Create the validation directory `specs/028-sidecar-branch-worktree/validation/`
- [X] T002 Add the sidecar branch/worktree simulation script skeleton in `specs/028-sidecar-branch-worktree/validation/simulate-sidecar-branch-worktree.ps1`

---

## Phase 2: Foundational

**Purpose**: Establish the shared #254 Git orchestration contract before outcome-specific workflow text and simulations.

- [X] T003 Update the branch/worktree orchestration contract in `specs/028-sidecar-branch-worktree/contracts/sidecar-branch-worktree-orchestration.md` with final coordinator, child, collision, dirty-state, push-gate, and prohibited-operation rules
- [X] T004 Update architecture source-of-truth text in `docs/ARCHITECTURE.md` to summarize #254 executable coordinator/child branch and worktree orchestration without activating sidecar routing before #261
- [X] T005 Update sidecar coordinator source text in `.agents/skills/catworld-parallel-coordinator/SKILL.md` to reference issue #254 and the executable Git orchestration contract
- [X] T006 Update sidecar child implementation source text in `.agents/skills/catworld-parallel-child-implementation/SKILL.md` to require coordinator-prepared branch/worktree handoff context

**Checkpoint**: Shared branch/worktree orchestration contract and source-of-truth wording are aligned.

---

## Phase 3: Technical Outcome 1 - Coordinator Branch, Worktree, and Push Gate (Priority: P1)

**Goal**: A valid future sidecar coordinator run can create or enter the coordinator branch/worktree, write artifacts only inside that context, and require a normal remote coordinator branch push before child PR delivery.

**Verification**: The validation script proves the coordinator branch starts from current `origin/main`, the coordinator worktree is isolated, local `main` is unchanged, and child PR delivery readiness is blocked until the remote coordinator branch exists.

### Evidence for Technical Outcome 1

- [X] T007 [TO1] Implement the `coordinator` scenario in `specs/028-sidecar-branch-worktree/validation/simulate-sidecar-branch-worktree.ps1` with a temporary remote `origin/main`, coordinator branch creation from `origin/main`, coordinator worktree creation, local `main` cleanliness, and artifact-write-boundary output
- [X] T008 [TO1] Implement the `push-gate` scenario in `specs/028-sidecar-branch-worktree/validation/simulate-sidecar-branch-worktree.ps1` with normal non-force coordinator branch push and child PR readiness depending on the remote coordinator branch
- [X] T009 [TO1] Run `powershell -ExecutionPolicy Bypass -File specs/028-sidecar-branch-worktree/validation/simulate-sidecar-branch-worktree.ps1 -Scenario coordinator` and verify coordinator branch/worktree state and unchanged local `main`
- [X] T010 [TO1] Run `powershell -ExecutionPolicy Bypass -File specs/028-sidecar-branch-worktree/validation/simulate-sidecar-branch-worktree.ps1 -Scenario push-gate` and verify normal coordinator branch push before child PR delivery readiness

### Implementation for Technical Outcome 1

- [X] T011 [TO1] Add executable coordinator branch/worktree preparation steps to `.agents/skills/catworld-parallel-coordinator/SKILL.md`, including `origin/main` fetch, deterministic naming, clean-state checks, collision checks, coordinator branch creation, coordinator worktree entry, artifact write boundary, normal non-force push, and unsafe push stop behavior
- [X] T012 [TO1] Add coordinator branch/worktree and remote coordinator branch push-gate wording to `docs/ARCHITECTURE.md`
- [X] T013 [TO1] Reconcile `specs/028-sidecar-branch-worktree/contracts/sidecar-branch-worktree-orchestration.md` and `specs/028-sidecar-branch-worktree/quickstart.md` with the final scenario names and coordinator Git state wording

**Checkpoint**: Coordinator branch/worktree preparation and remote coordinator branch push gating are objectively verifiable.

---

## Phase 4: Technical Outcome 2 - Child Branches and Isolated Child Worktrees (Priority: P2)

**Goal**: A valid future sidecar coordinator run can create active child branches from the coordinator branch and give each active child an isolated checkout/worktree.

**Verification**: The validation script proves at least two child branches are created from the coordinator branch, no child branch starts from `main`, and each child worktree is isolated from siblings and the coordinator worktree.

### Evidence for Technical Outcome 2

- [X] T014 [TO2] Implement the `children` scenario in `specs/028-sidecar-branch-worktree/validation/simulate-sidecar-branch-worktree.ps1` with at least two child branches created from the coordinator branch, isolated child worktrees, and recorded child branch/worktree state
- [X] T015 [TO2] Run `powershell -ExecutionPolicy Bypass -File specs/028-sidecar-branch-worktree/validation/simulate-sidecar-branch-worktree.ps1 -Scenario children` and verify child branch bases and child worktree isolation

### Implementation for Technical Outcome 2

- [X] T016 [TO2] Add executable child branch/worktree preparation steps to `.agents/skills/catworld-parallel-coordinator/SKILL.md`, including remote coordinator branch existence, dependency-ready layer gating, child branch creation from the coordinator branch, isolated child worktree creation, child PR target plan, and coordinator artifact state recording
- [X] T017 [TO2] Add child handoff validation requirements to `.agents/skills/catworld-parallel-child-implementation/SKILL.md` for coordinator branch, coordinator worktree, child branch base, child worktree path, child PR target branch, and isolation evidence
- [X] T018 [TO2] Add child branch/worktree state and child PR target boundary wording to `docs/ARCHITECTURE.md`

**Checkpoint**: Dependency-ready children receive isolated branch/worktree contexts based on the coordinator branch.

---

## Phase 5: Technical Outcome 3 - Dirty, Collision, Unsafe Push, and Prohibited Operation Stops (Priority: P3)

**Goal**: The sidecar flow stops safely for dirty working trees, unproven resource collisions, unsafe coordinator branch push state, and prohibited history-changing or local-main operations.

**Verification**: The validation script proves dirty, collision, and unsafe-push stop behavior, and source reviews prove prohibited operations remain disallowed.

### Evidence for Technical Outcome 3

- [X] T019 [TO3] Implement the `collision`, `dirty`, and `unsafe-push` scenarios in `specs/028-sidecar-branch-worktree/validation/simulate-sidecar-branch-worktree.ps1`
- [X] T020 [TO3] Run `powershell -ExecutionPolicy Bypass -File specs/028-sidecar-branch-worktree/validation/simulate-sidecar-branch-worktree.ps1 -Scenario collision` and verify same-run resume plus unproven branch/worktree collision stops
- [X] T021 [TO3] Run `powershell -ExecutionPolicy Bypass -File specs/028-sidecar-branch-worktree/validation/simulate-sidecar-branch-worktree.ps1 -Scenario dirty` and verify dirty working-tree paths stop sidecar Git operations before writing or child delivery
- [X] T022 [TO3] Run `powershell -ExecutionPolicy Bypass -File specs/028-sidecar-branch-worktree/validation/simulate-sidecar-branch-worktree.ps1 -Scenario unsafe-push` and verify rejected coordinator branch push stops child PR delivery without force-push or history rewriting

### Implementation for Technical Outcome 3

- [X] T023 [TO3] Add dirty-state, branch/worktree collision, unsafe push, no force-push, no rebase, no history rewrite, no direct child branch from `main`, no local `main` update, and no individual-child-merge cleanup rules to `.agents/skills/catworld-parallel-coordinator/SKILL.md`
- [X] T024 [TO3] Add matching child handoff stop and prohibited side-effect wording to `.agents/skills/catworld-parallel-child-implementation/SKILL.md`
- [X] T025 [TO3] Add collision, dirty-state, unsafe-push, and prohibited-operation summaries to `docs/ARCHITECTURE.md`

**Checkpoint**: Unsafe sidecar Git states block before child delivery, artifact writing, history rewriting, or local `main` mutation.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final validation, source-map review, and task/spec consistency.

- [X] T026 Run all quickstart validation commands from `specs/028-sidecar-branch-worktree/quickstart.md`
- [X] T027 Run prohibited-operation source review `Select-String -Path .agents/skills/catworld-parallel-coordinator/SKILL.md,docs/ARCHITECTURE.md -Pattern 'origin/main','non-force','worktree','dirty','collision','force-push','rebase','main'` and `Select-String -Path .agents/skills/catworld-parallel-child-implementation/SKILL.md -Pattern 'coordinator branch','child branch','worktree','main','force-push','rebase'`
- [X] T028 Run `git diff --check`
- [X] T029 Review changed files against `specs/028-sidecar-branch-worktree/plan.md` source map and confirm no application runtime code, sequential implementation skill, dormant legacy orchestration skill, real sidecar worktree, real sidecar product branch, PR operation, GitHub issue mutation, public comment, normal sequential workflow change, or unapproved remote cleanup was added
- [X] T030 Restore the transient `AGENTS.md` Spec Kit active-plan block before final delivery when it is the only `AGENTS.md` change
- [X] T031 Rerun any affected validation after late edits to `.agents/skills/catworld-parallel-coordinator/SKILL.md`, `.agents/skills/catworld-parallel-child-implementation/SKILL.md`, `docs/ARCHITECTURE.md`, `specs/028-sidecar-branch-worktree/contracts/sidecar-branch-worktree-orchestration.md`, `specs/028-sidecar-branch-worktree/quickstart.md`, or `specs/028-sidecar-branch-worktree/validation/simulate-sidecar-branch-worktree.ps1`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies.
- **Foundational (Phase 2)**: Depends on Phase 1 for the validation script path and on the completed plan/spec/contract.
- **TO1 (Phase 3)**: Depends on foundational coordinator Git wording and validation script setup.
- **TO2 (Phase 4)**: Depends on TO1 coordinator branch/worktree and remote coordinator branch push gate.
- **TO3 (Phase 5)**: Depends on TO1/TO2 Git resource definitions and validation helper functions.
- **Polish (Phase 6)**: Depends on TO1, TO2, and TO3 completion.

### Technical Outcome Dependencies

- **TO1**: First verifiable increment; establishes the coordinator branch/worktree write boundary and remote coordinator branch push gate.
- **TO2**: Builds on TO1 so child branch/worktree preparation starts from a pushed coordinator branch.
- **TO3**: Builds on TO1 and TO2 to prove unsafe states stop before writes, child delivery, or prohibited operations.

### Parallel Opportunities

- T004, T005, and T006 touch different files after T003 defines the final contract and can be reviewed in parallel.
- T011 and T012 touch different files and can be edited in parallel after T007/T008 shape the scenario outputs.
- T016, T017, and T018 touch different files and can be edited in parallel after T014 defines child Git state.
- T023, T024, and T025 touch different files and can be edited in parallel after T019 defines stop scenarios.

---

## Implementation Strategy

### First Verifiable Increment

1. Complete Phase 1 and Phase 2.
2. Complete TO1 coordinator branch/worktree and push-gate simulations.
3. Validate the `coordinator` and `push-gate` scenarios.

### Incremental Delivery

1. Deliver TO1 to prove the coordinator Git boundary and remote push gate.
2. Add TO2 to prove child branches and isolated worktrees derive from the coordinator branch.
3. Add TO3 to prove dirty, collision, unsafe push, and prohibited-operation stops.
4. Run all quickstart validation, source reviews, changed-file review, and `git diff --check`.
