# Tasks: Sidecar Artifact Paths

**Input**: Design documents from `specs/014-sidecar-artifact-paths/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md

**Tests**: No application tests are required because this feature changes repository workflow documentation only. Required evidence is manual documentation review, PowerShell path simulation, repeated-run collision simulation, duplicate child issue simulation, and `git diff --check`.

**Organization**: Tasks are grouped by dependency-driven verifiable technical outcomes.

## Phase 1: Technical Outcome 1 - Sidecar Artifact Path Contract (Priority: P1)

**Goal**: Document coordinator and child sidecar artifact path shapes that map directly to GitHub issue numbers while preserving normal sequential behavior.

**Verification**: `docs/ARCHITECTURE.md` includes the coordinator and child path patterns, issue-number uniqueness rule, slug rule, sidecar-only boundary, and closed-child coordinator final-pass boundary.

### Implementation for Technical Outcome 1

- [X] T001 [TO1] Add sidecar coordinator and child artifact path patterns, issue-number uniqueness, and slug guidance to `docs/ARCHITECTURE.md`
- [X] T002 [TO1] Add sidecar-only scope, unchanged normal sequential Spec Kit behavior, and closed-child coordinator final-pass boundary language to `docs/ARCHITECTURE.md`

### Evidence for Technical Outcome 1

- [X] T003 [TO1] Run the quickstart path-pattern and boundary checks against `docs/ARCHITECTURE.md` from `specs/014-sidecar-artifact-paths/quickstart.md`

**Checkpoint**: Sidecar artifact path naming is documented and independently reviewable.

---

## Phase 2: Technical Outcome 2 - Collision Stop Rules (Priority: P1)

**Goal**: Document safe collision detection and stop rules for future sidecar artifact preparation.

**Verification**: `docs/ARCHITECTURE.md` requires future sidecar artifact preparation to check paths before creation, stop on existing target paths, stop on duplicate child issue numbers, and avoid overwriting, merging, deleting, or silently reusing artifacts.

### Implementation for Technical Outcome 2

- [X] T004 [TO2] Add target-path preflight and existing-path collision stop rules to `docs/ARCHITECTURE.md`
- [X] T005 [TO2] Add duplicate child issue number stop rules and non-collision guidance for same slug with different issue numbers to `docs/ARCHITECTURE.md`

### Evidence for Technical Outcome 2

- [X] T006 [TO2] Run the one-coordinator/three-child path simulation, repeated-run collision simulation, and duplicate child issue simulation from `specs/014-sidecar-artifact-paths/quickstart.md`

**Checkpoint**: Collision behavior is documented and objectively validated by local simulation.

---

## Phase 3: Polish & Cross-Cutting Concerns

**Purpose**: Final validation, scope review, and freshness checks required by the plan.

- [X] T007 Review `docs/ARCHITECTURE.md` and `specs/014-sidecar-artifact-paths/` against GitHub issues #220, #221, #222, and #225
- [X] T008 Run `git diff --check` from the repository root
- [X] T009 Review `git status --short` and `git diff --name-only` to confirm changed files stay within the source map in `specs/014-sidecar-artifact-paths/plan.md`, excluding temporary Spec Kit active-plan pointer state in `AGENTS.md`
- [X] T010 Rerun any affected quickstart checks after relevant late wording changes in `docs/ARCHITECTURE.md` or `specs/014-sidecar-artifact-paths/`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (TO1)**: No prerequisites beyond generated Spec Kit artifacts.
- **Phase 2 (TO2)**: Depends on Phase 1 context because collision rules reference the same sidecar path contract.
- **Phase 3 (Polish)**: Depends on TO1 and TO2 implementation and evidence tasks.

### Technical Outcome Dependencies

- **TO-001**: No implementation dependencies.
- **TO-002**: Depends on TO-001 because collision checks operate on the documented path shapes.

### Parallel Opportunities

- T001 and T002 both edit `docs/ARCHITECTURE.md`; do not run them in parallel.
- T004 and T005 both edit `docs/ARCHITECTURE.md`; do not run them in parallel.
- T007 and T008 can run in parallel after T001-T006 are complete because one is manual review and the other is a whitespace check.

---

## Implementation Strategy

### First Verifiable Increment

1. Complete Phase 1 (TO1).
2. Run T003.
3. Stop and confirm sidecar artifact path naming is documented before adding collision rules.

### Incremental Delivery

1. Add sidecar path naming and boundary wording.
2. Validate TO1.
3. Add collision and duplicate child issue stop rules.
4. Validate TO2.
5. Run final review, whitespace, and scope checks.
