# Tasks: Harden Spec Kit Validation Workflow

**Input**: Design documents from `specs/003-harden-spec-kit-validation/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/workflow-validation-evidence.md, quickstart.md

**Tests**: This workflow-only feature requires text review and `git diff --check`; it must not add or change CatWorld application behavior tests.

**Organization**: Tasks are grouped by the three verifiable technical outcomes from `spec.md`.

## Format: `[ID] [P?] [Trace] Description`

- **[P]**: Can run in parallel (different files, no dependency on incomplete tasks)
- **[Trace]**: Technical outcome label from `spec.md` (`TO1`, `TO2`, `TO3`)
- Include exact file paths in descriptions

## Phase 1: Setup

**Purpose**: Confirm the issue contract and workflow scope before editing.

- [X] T001 [TO1/TO2/TO3] Review issue #189 scope, `AGENTS.md`, `.specify/memory/constitution.md`, and current Spec Kit skill/template files listed in the issue
- [X] T002 [TO1/TO2/TO3] Confirm no existing generated feature directory under `specs/001-*` or `specs/002-*` is needed for implementation changes

---

## Phase 2: Specification Generation Hardening

**Goal**: Generated specs require observable behavior and validation detail where needed while preserving technical/enabling feature support.

**Verification**: Text review confirms `speckit-specify` and `spec-template.md` address TR-001, TR-002, and TR-003.

- [X] T003 [TO1] Add observable-state and correctness-sensitive behavior guidance to `.agents/skills/speckit-specify/SKILL.md`
- [X] T004 [TO1] Add proportional validation matrix and observable-state placeholders to `.specify/templates/spec-template.md`

**Checkpoint**: Specs can no longer satisfy visible or validation-sensitive work with generic behavior statements alone.

---

## Phase 3: Planning Hardening

**Goal**: Generated plans identify semantic-equivalence risk and responsible-layer validation evidence before implementation.

**Verification**: Text review confirms `speckit-plan` and `plan-template.md` address TR-004 and TR-005.

- [X] T005 [TO2] Add semantic-equivalence and responsible-layer validation planning guidance to `.agents/skills/speckit-plan/SKILL.md`
- [X] T006 [TO2] Add semantic-equivalence and validation evidence sections to `.specify/templates/plan-template.md`

**Checkpoint**: Plans record replacement/migration mismatch risk and proof when behavior-preserving changes can alter semantics.

---

## Phase 4: Task, Analysis, and Convergence Hardening

**Goal**: Generated tasks and quality checks require layer-appropriate evidence and flag missing qualitative coverage or scope drift.

**Verification**: Text review confirms task/analyze/converge guidance addresses TR-006 through TR-010.

- [X] T007 [TO3] Add layer-appropriate evidence and validation-matrix task generation rules to `.agents/skills/speckit-tasks/SKILL.md`
- [X] T008 [TO3] Add visible-behavior and correctness-sensitive evidence examples to `.specify/templates/tasks-template.md`
- [X] T009 [TO3] Add qualitative coverage-gap detection to `.agents/skills/speckit-analyze/SKILL.md`
- [X] T010 [TO3] Add missing-verification and unplanned touched-surface convergence checks to `.agents/skills/speckit-converge/SKILL.md`

**Checkpoint**: Frontend-visible, contract, authorization, persistence, migration, security, mobile, i18n, shared component, and global-style requirements require appropriate evidence language.

---

## Phase 5: Implementation and Final Reporting Hardening

**Goal**: Validation freshness and task completion rules prevent stale, partial, or implementation-detail-only evidence from being reported as passed.

**Verification**: Text review confirms implementation/final orchestration guidance addresses TR-011 and TR-012.

- [X] T011 [TO3] Add fresh-evidence task completion rules to `.agents/skills/speckit-implement/SKILL.md`
- [X] T012 [TO3] Add final validation freshness, status taxonomy, and scope-drift reporting rules to `.agents/skills/catworld-implement-issue/SKILL.md`
- [X] T013 [TO1/TO2/TO3] Review `AGENTS.md` and `.specify/memory/constitution.md`; update only if a stable project-wide rule cannot live in skill/template files

**Checkpoint**: Final reports distinguish passed, failed, skipped, timed out, interrupted, partial, stale, and not revalidated checks.

---

## Phase 6: Validation

**Purpose**: Prove the workflow-only change is focused, coherent, and clean.

- [X] T014 [TO1/TO2/TO3] Run `git diff --check` from repository root
- [X] T015 [TO1/TO2/TO3] Review every changed Spec Kit skill/template file for stale contradictions
- [X] T016 [TO1/TO2/TO3] Review every changed Spec Kit skill/template file for duplicated rules that could drift
- [X] T017 [TO1/TO2/TO3] Confirm no generated example feature directory was added and no existing feature directory under `specs/001-*` or `specs/002-*` was modified
- [X] T018 [TO1] Confirm updated workflow still supports technical/enabling features without artificial user stories
- [X] T019 [TO2/TO3] Confirm updated workflow still blocks unresolved major decisions instead of allowing implementation agents to invent them
- [X] T020 [TO1/TO2/TO3] Confirm no CatWorld application behavior code was changed
- [X] T021 [TO3] Confirm `speckit-analyze` and `speckit-converge` explicitly load, inventory, map, and report TR-### and TO-### coverage
- [X] T022 [TO1] Confirm `speckit-specify` preserves unresolved material decisions as blockers instead of guessing them into assumptions

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Must complete before workflow edits.
- **Specification Generation (Phase 2)**: Can be reviewed independently for TO-001.
- **Planning (Phase 3)**: Depends on setup and can proceed alongside Phase 2 if coordinated.
- **Task, Analysis, and Convergence (Phase 4)**: Depends on understanding the new spec/plan evidence expectations.
- **Implementation and Final Reporting (Phase 5)**: Depends on the task/convergence evidence model.
- **Validation (Phase 6)**: Depends on all intended workflow edits.

### Parallel Opportunities

- T003 and T004 affect different files but should be reviewed together for consistency.
- T005 and T006 affect different files but should be reviewed together for consistency.
- T007, T008, T009, and T010 affect different workflow stages and can be drafted independently after the evidence model is stable.

## Implementation Strategy

1. Complete setup review.
2. Harden generation stages first: specify, spec template, plan, plan template.
3. Harden enforcement stages next: tasks, tasks template, analyze, converge.
4. Harden execution/final reporting: implement and CatWorld issue orchestration.
5. Run validation and update this task list only after evidence is fresh.

## Notes

- Do not change application code.
- Do not modify `specs/001-*` or `specs/002-*`.
- Do not commit, push, create issues, create pull requests, or post public comments.
