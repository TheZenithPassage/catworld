# Tasks: Sidecar Run Lifecycle

**Input**: Design documents from `specs/025-sidecar-run-lifecycle/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: No application tests are required because this feature changes workflow documentation only. Required evidence is the issue-required search, manual routing matrix, manual lifecycle matrices, inactive/adoption-gate wording review, changed-file/source-map review, and `git diff --check`.

**Organization**: Tasks are grouped by verifiable technical outcome.

## Phase 1: Technical Outcome 1 - Executable Sidecar Lifecycle (Priority: P1)

**Goal**: Sidecar workflow sources describe a complete executable coordinator `parallel` lifecycle from new run through final coordinator PR and cleanup eligibility.

**Verification**: Manual review against `specs/025-sidecar-run-lifecycle/contracts/sidecar-lifecycle.md` confirms each lifecycle state has entry conditions, stop conditions, allowed next states, operation ownership, and dependency-layer preservation.

- [X] T001 [TO1] Add an executable sidecar run lifecycle section covering all 18 issue-required states in `.agents/skills/catworld-parallel-coordinator/SKILL.md`
- [X] T002 [P] [TO1] Add the maintainer-facing lifecycle summary and operation ownership boundaries in `docs/ARCHITECTURE.md`
- [X] T003 [P] [TO1] Align child handoff, child implementation, child PR delivery, waiting, resume, refresh, and cleanup eligibility language with the lifecycle in `.agents/skills/catworld-parallel-child-implementation/SKILL.md`
- [X] T004 [TO1] Validate TO1 manually against `specs/025-sidecar-run-lifecycle/contracts/sidecar-lifecycle.md`, `.agents/skills/catworld-parallel-coordinator/SKILL.md`, `.agents/skills/catworld-parallel-child-implementation/SKILL.md`, and `docs/ARCHITECTURE.md`

**Checkpoint**: The future sidecar lifecycle is executable as documented behavior, with no child execution launched by this issue.

---

## Phase 2: Technical Outcome 2 - Artifact Planning and Write Boundary (Priority: P1)

**Goal**: Sidecar artifact path/content planning is separate from artifact writing, and artifact writing occurs only after entering the coordinator branch/worktree.

**Verification**: Manual lifecycle matrix proves artifact planning/write separation, coordinator branch/worktree write boundaries, and local `main` cleanliness.

- [X] T005 [TO2] Update artifact preparation and Git execution rules to separate path/content planning from file writing and to stop before modifying files when the coordinator branch/worktree cannot be entered in `.agents/skills/catworld-parallel-coordinator/SKILL.md`
- [X] T006 [P] [TO2] Update sidecar artifact preparation, artifact path, and Git execution documentation with the local `main` cleanliness and coordinator branch/worktree write boundary in `docs/ARCHITECTURE.md`
- [X] T007 [P] [TO2] Update child handoff validation to require prepared coordinator branch/worktree context and forbid child execution from repairing or inventing artifact write state in `.agents/skills/catworld-parallel-child-implementation/SKILL.md`
- [X] T008 [TO2] Validate the artifact boundary matrix in `specs/025-sidecar-run-lifecycle/quickstart.md` against `.agents/skills/catworld-parallel-coordinator/SKILL.md`, `.agents/skills/catworld-parallel-child-implementation/SKILL.md`, and `docs/ARCHITECTURE.md`

**Checkpoint**: The documented lifecycle cannot be read as writing sidecar artifacts to local `main`.

---

## Phase 3: Technical Outcome 3 - Routing States and Dormant Activation Boundary (Priority: P1)

**Goal**: Routing guidance distinguishes current build-out behavior from post-#261 activated sidecar behavior while preserving the sequential default workflow.

**Verification**: Manual routing matrix covers normal issue, direct child issue, non-coordinator `parallel`, valid coordinator `parallel`, blocked coordinator `parallel`, coordinator waiting for user merge, resumed coordinator, all-child-integrated coordinator, and closed-child coordinator final-pass states.

- [X] T009 [TO3] Review and update current/post-#261 routing state language for normal issues, direct child issues, coordinator `parallel`, non-coordinator `parallel`, and closed-child coordinator final passes in `AGENTS.md`
- [X] T010 [TO3] Review and update current/post-#261 routing state language for the sequential workflow boundary in `.agents/skills/catworld-implement-issue/SKILL.md`
- [X] T011 [TO3] Update sidecar coordinator routing, waiting, resume, all-child-integrated, final PR, and dormant build-out state language in `.agents/skills/catworld-parallel-coordinator/SKILL.md`
- [X] T012 [P] [TO3] Update coordinator issue template execution-model guidance for current build-out and post-#261 sidecar lifecycle states in `.github/ISSUE_TEMPLATE/coordinator-parallel-planning.md`
- [X] T013 [P] [TO3] Update sidecar PR template guidance for user-owned merges, final coordinator PR delivery, and non-activation boundaries in `.github/PULL_REQUEST_TEMPLATE/README.md`
- [X] T014 [P] [TO3] Update child and final sidecar PR template notes for waiting/resume and user-owned merge boundaries in `.github/PULL_REQUEST_TEMPLATE/sidecar-child-to-coordinator.md` and `.github/PULL_REQUEST_TEMPLATE/sidecar-final-coordinator-to-main.md`
- [X] T015 [TO3] Validate the routing matrix in `specs/025-sidecar-run-lifecycle/quickstart.md` against `AGENTS.md`, `.agents/skills/catworld-implement-issue/SKILL.md`, `.agents/skills/catworld-parallel-coordinator/SKILL.md`, `.agents/skills/catworld-parallel-child-implementation/SKILL.md`, `docs/ARCHITECTURE.md`, and `.github/ISSUE_TEMPLATE/coordinator-parallel-planning.md`

**Checkpoint**: The sequential workflow remains the active default and sidecar product use remains dormant until #261.

---

## Phase 4: Polish & Cross-Cutting Concerns

**Purpose**: Final validation and scope review required by issue #251 and the implementation plan.

- [X] T016 Run `rg -n "not implemented yet|future sidecar|after adoption|Stop after preflight|do not launch child execution" AGENTS.md .agents/skills docs/ARCHITECTURE.md` and manually classify remaining inactive/adoption-gate wording
- [X] T017 Confirm remaining inactive/adoption-gate wording is intentional until #261 and not readable as early sidecar activation in `AGENTS.md`, `.agents/skills/catworld-parallel-coordinator/SKILL.md`, `.agents/skills/catworld-parallel-child-implementation/SKILL.md`, and `docs/ARCHITECTURE.md`
- [X] T018 Confirm the dormant legacy coordinator skill remains unmodified with `git diff -- .agents/skills/catworld-orchestrate-coordinator-issue/SKILL.md`
- [X] T019 Run `git diff --check` from the repository root
- [X] T020 Review `git status --short` and `git diff --name-only` against the source map in `specs/025-sidecar-run-lifecycle/plan.md`
- [X] T021 Rerun or re-review any validation affected by late changes to `AGENTS.md`, `.agents/skills`, `docs/ARCHITECTURE.md`, `.github`, or `specs/025-sidecar-run-lifecycle`

---

## Dependencies & Execution Order

### Phase Dependencies

- **TO1 (Phase 1)**: Start first because the lifecycle state model drives the remaining wording.
- **TO2 (Phase 2)**: Depends on TO1 state naming and updates the write-safety boundary inside that lifecycle.
- **TO3 (Phase 3)**: Depends on TO1 and TO2 so routing can refer to the completed current/post-#261 lifecycle states.
- **Polish (Phase 4)**: Depends on all technical outcomes being complete.

### Technical Outcome Dependencies

- **TO1**: No dependencies.
- **TO2**: Depends on TO1 lifecycle state structure.
- **TO3**: Depends on TO1 lifecycle state structure and TO2 artifact-write boundary.

### Parallel Opportunities

- T002 and T003 can run in parallel after T001 defines the lifecycle structure.
- T006 and T007 can run in parallel after T005 defines the artifact write boundary.
- T012, T013, and T014 can run in parallel after T011 defines the routing wording.
- T016 and T018 can run in parallel after all text edits are complete.

## Parallel Example: Technical Outcome 3

```text
Task: "Update coordinator issue template execution-model guidance in .github/ISSUE_TEMPLATE/coordinator-parallel-planning.md"
Task: "Update sidecar PR template guidance in .github/PULL_REQUEST_TEMPLATE/README.md"
Task: "Update child/final PR template notes in .github/PULL_REQUEST_TEMPLATE/sidecar-child-to-coordinator.md and .github/PULL_REQUEST_TEMPLATE/sidecar-final-coordinator-to-main.md"
```

## Implementation Strategy

### First Verifiable Increment

1. Complete TO1 lifecycle state documentation.
2. Validate against `specs/025-sidecar-run-lifecycle/contracts/sidecar-lifecycle.md`.
3. Confirm no real sidecar child execution, branch/worktree command implementation, or PR operation was introduced.

### Incremental Delivery

1. Complete TO1 and validate the full lifecycle state model.
2. Complete TO2 and validate artifact planning/write boundaries.
3. Complete TO3 and validate current/post-#261 routing states.
4. Run final search, manual review, diff, and whitespace validation.

## Notes

- Do not implement branch/worktree commands, launch child agents, open PRs, mutate GitHub issues, or activate sidecar routing for real product use.
- Do not remove inactive/adoption-gate wording merely because this issue defines future lifecycle behavior.
- Keep changes focused on workflow source-of-truth files and the #251 Spec Kit artifacts.

## Phase 5: Convergence

- [X] T022 Update active child branch/worktree refresh wording to allow fast-forward or normal merge only in `.agents/skills/catworld-parallel-coordinator/SKILL.md`, `.agents/skills/catworld-parallel-child-implementation/SKILL.md`, and `docs/ARCHITECTURE.md` per TR-009 (partial)
