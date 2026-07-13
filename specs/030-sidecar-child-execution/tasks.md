# Tasks: Sidecar Child Execution and PR Delivery

**Input**: Design documents from `specs/030-sidecar-child-execution/`

**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/

**Tests**: Required by issue #256 and the validation evidence plan. Evidence is focused on local PowerShell simulations, source review, PR wording/target review, changed-file review, and `git diff --check`.

**Organization**: Tasks are grouped by dependency-driven verifiable technical outcomes for technical/enabling workflow work.

## Format: `[ID] [P?] [Trace] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Trace]**: Which technical outcome this task belongs to
- Include exact file paths in descriptions

## Phase 1: Setup

**Purpose**: Add the shared validation fixture used by all #256 outcome checks.

- [X] T001 Create `specs/030-sidecar-child-execution/validation/simulate-sidecar-child-execution.ps1` with shared fixture data, assertion helpers, handoff model, PR body/target helpers, validation-readiness model, and scenario dispatcher

---

## Phase 2: Foundational

**Purpose**: Align the sidecar source-of-truth surfaces before outcome-specific behavior is filled in.

- [X] T002 Update `.agents/skills/catworld-parallel-child-implementation/SKILL.md` introduction, required handoff inputs, validation expectations, delivery boundaries, and final report requirements to include issue #256 child execution and child PR delivery scope while preserving the #261 dormant-routing gate
- [X] T003 Update `.agents/skills/catworld-parallel-coordinator/SKILL.md` handoff, lifecycle, preflight output, and validation expectations so coordinator-generated child handoffs include the #256 execution and PR delivery rules
- [X] T004 Update `docs/ARCHITECTURE.md` sidecar workflow documentation to include issue #256 child execution, coordinator-branch child PR delivery, related-only issue wording, and ready/draft validation freshness behavior
- [X] T005 Update `specs/030-sidecar-child-execution/contracts/sidecar-child-execution.md` if implementation details require wording refinements, without changing approved #256 scope

**Checkpoint**: Source-of-truth surfaces name #256 child execution and preserve existing sequential and dormant-routing boundaries.

---

## Phase 3: Technical Outcome 1 - Prepared Child Handoff Execution (Priority: P1)

**Goal**: A sidecar child implementation agent executes exactly one prepared child handoff from its prepared child checkout and branch.

**Verification**: Run the `valid-handoff` simulation scenario and review sidecar child source text for one-child scope, checkout/branch confirmation, prepared-artifact consumption, and no planning regeneration.

### Evidence for Technical Outcome 1

- [X] T006 [TO1] Add `valid-handoff`, `missing-context`, `wrong-checkout`, and `wrong-branch` scenarios to `specs/030-sidecar-child-execution/validation/simulate-sidecar-child-execution.ps1`

### Implementation for Technical Outcome 1

- [X] T007 [TO1] Update `.agents/skills/catworld-parallel-child-implementation/SKILL.md` to require exactly one prepared child handoff before implementation and to stop on missing, contradictory, or multi-child handoff data
- [X] T008 [TO1] Update `.agents/skills/catworld-parallel-child-implementation/SKILL.md` to require current checkout/worktree and branch confirmation against the prepared child context before any edits
- [X] T009 [TO1] Update `.agents/skills/catworld-parallel-child-implementation/SKILL.md` to prohibit `speckit-specify`, `speckit-plan`, and `speckit-tasks` as replacement artifact generation and to implement only tasks listed in prepared child `tasks.md`
- [X] T010 [TO1] Update `.agents/skills/catworld-parallel-coordinator/SKILL.md` to ensure child handoffs explicitly carry the checkout/branch proof, task-scope limit, and no-regeneration instructions consumed by the child skill
- [X] T011 [TO1] Update `docs/ARCHITECTURE.md` to mirror prepared child execution, task-only scope, and normal direct-child sequential routing boundaries
- [X] T012 [TO1] Run `.\specs\030-sidecar-child-execution\validation\simulate-sidecar-child-execution.ps1 -Scenario valid-handoff` and verify the sample child handoff executes to a focused child branch diff from prepared tasks only
- [X] T013 [TO1] Run `.\specs\030-sidecar-child-execution\validation\simulate-sidecar-child-execution.ps1 -Scenario missing-context`, `.\specs\030-sidecar-child-execution\validation\simulate-sidecar-child-execution.ps1 -Scenario wrong-checkout`, and `.\specs\030-sidecar-child-execution\validation\simulate-sidecar-child-execution.ps1 -Scenario wrong-branch` and verify the child workflow stops before implementation

**Checkpoint**: TO1 is objectively verified by the handoff execution and blocker simulations plus source review.

---

## Phase 4: Technical Outcome 2 - Coordinator-Branch Child PR Delivery (Priority: P2)

**Goal**: Child delivery opens or updates a child PR against the prepared coordinator branch with related-only issue references and readiness status based on validation freshness.

**Verification**: Run the `pr-wording`, `pr-target`, and `readiness` simulation scenarios and review child/coordinator/architecture text for delivery boundaries.

### Evidence for Technical Outcome 2

- [X] T014 [TO2] Add `missing-delivery-permission`, `delivery-denied`, `pr-wording`, `pr-target`, and `readiness` scenarios to `specs/030-sidecar-child-execution/validation/simulate-sidecar-child-execution.ps1`

### Implementation for Technical Outcome 2

- [X] T015 [TO2] Update `.agents/skills/catworld-parallel-child-implementation/SKILL.md` delivery workflow to require explicit delivery permission before scoped commit, normal non-force push, and child PR open/update
- [X] T016 [TO2] Update `.agents/skills/catworld-parallel-child-implementation/SKILL.md` to require child PR targets to be the coordinator branch and to stop on `main` targets
- [X] T017 [TO2] Update `.agents/skills/catworld-parallel-child-implementation/SKILL.md` to require `Related to #<child-issue>` and `Related to #<coordinator-issue>` references only and to reject closing keywords
- [X] T018 [TO2] Update `.agents/skills/catworld-parallel-child-implementation/SKILL.md` to report child PRs as ready only when required validation is fresh and passed with no unresolved blocker, otherwise draft/not-ready when review delivery is allowed
- [X] T019 [TO2] Update `.agents/skills/catworld-parallel-coordinator/SKILL.md` to include child PR delivery results, PR URL, ready/draft status, validation freshness, and blockers in coordinator waiting/resume state
- [X] T020 [TO2] Update `docs/ARCHITECTURE.md` to document child PR coordinator-branch targets, related-only issue wording, and draft/ready readiness rules
- [X] T021 [TO2] Run `.\specs\030-sidecar-child-execution\validation\simulate-sidecar-child-execution.ps1 -Scenario pr-wording` and verify generated child PR text uses related-only references and no closing keywords
- [X] T022 [TO2] Run `.\specs\030-sidecar-child-execution\validation\simulate-sidecar-child-execution.ps1 -Scenario pr-target` and verify coordinator-branch targets pass while `main` targets fail
- [X] T023 [TO2] Run `.\specs\030-sidecar-child-execution\validation\simulate-sidecar-child-execution.ps1 -Scenario missing-delivery-permission`, `.\specs\030-sidecar-child-execution\validation\simulate-sidecar-child-execution.ps1 -Scenario delivery-denied`, and `.\specs\030-sidecar-child-execution\validation\simulate-sidecar-child-execution.ps1 -Scenario readiness` and verify missing delivery permission blocks execution, delivery-denied handoffs skip commit/push/PR operations, and failed, skipped, timed-out, interrupted, partial, stale, blocked, and not-run validation produces draft/not-ready status

**Checkpoint**: TO2 is objectively verified by PR wording, PR target, and readiness simulations plus source review.

---

## Phase 5: Technical Outcome 3 - Final Reports and Prohibited Side Effects (Priority: P3)

**Goal**: Child final reports include complete execution evidence and the workflow avoids prohibited GitHub/Git cleanup operations.

**Verification**: Run the `final-report` and `prohibited-operations` simulation scenarios and review changed files plus source text for the prohibited operations and normal sequential workflow boundary.

### Evidence for Technical Outcome 3

- [X] T024 [TO3] Add `final-report` and `prohibited-operations` scenarios to `specs/030-sidecar-child-execution/validation/simulate-sidecar-child-execution.ps1`

### Implementation for Technical Outcome 3

- [X] T025 [TO3] Update `.agents/skills/catworld-parallel-child-implementation/SKILL.md` final report section to require changed files, validation evidence with explicit statuses, PR URL when available, readiness, blockers, remaining risks, branch names, commit hashes, and current checkout state
- [X] T026 [TO3] Update `.agents/skills/catworld-parallel-child-implementation/SKILL.md` prohibited side effects to cover merge, approval, auto-merge, GitHub issue mutation, public comments, remote branch deletion, rebase, force-push, and local sidecar cleanup
- [X] T027 [TO3] Update `.agents/skills/catworld-parallel-coordinator/SKILL.md` and `docs/ARCHITECTURE.md` if needed so coordinator waiting/resume documentation consumes child final report evidence without implying Codex performs user-owned merges
- [X] T028 [TO3] Run `.\specs\030-sidecar-child-execution\validation\simulate-sidecar-child-execution.ps1 -Scenario final-report` and verify required report fields are present
- [X] T029 [TO3] Run `.\specs\030-sidecar-child-execution\validation\simulate-sidecar-child-execution.ps1 -Scenario prohibited-operations` and verify prohibited operation terms remain blocked

**Checkpoint**: TO3 is objectively verified by final-report/prohibited-operation simulations and source review.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final validation and scope review required by the active workflow.

- [X] T030 Run `Select-String -Path .agents\skills\catworld-parallel-child-implementation\SKILL.md -Pattern "exactly one prepared child handoff|speckit-specify|prepared child tasks.md|Related to|coordinator branch|draft|ready|force-push|GitHub issue"` and confirm child execution and delivery rules are present
- [X] T031 Run `Select-String -Path .agents\skills\catworld-parallel-coordinator\SKILL.md,docs\ARCHITECTURE.md -Pattern "child PR delivery|Related to|coordinator branch|ready|draft|validation"` and confirm coordinator/architecture child delivery rules are present
- [X] T032 Run `git diff --name-only -- .agents/skills/catworld-implement-issue/SKILL.md` and confirm the normal sequential implementation skill is unchanged
- [X] T033 Review changed files against `specs/030-sidecar-child-execution/plan.md` source map and confirm no backend, frontend, migration, real sidecar branch/worktree, real validation PR operation, GitHub issue mutation, normal sequential workflow, or legacy coordinator orchestration file was changed
- [X] T034 Run `git diff --check`
- [X] T035 Rerun affected validation after any late edits to `.agents/skills/catworld-parallel-child-implementation/SKILL.md`, `.agents/skills/catworld-parallel-coordinator/SKILL.md`, `docs/ARCHITECTURE.md`, `specs/030-sidecar-child-execution/contracts/sidecar-child-execution.md`, or `specs/030-sidecar-child-execution/validation/simulate-sidecar-child-execution.ps1`, or report stale/not-revalidated checks explicitly

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies.
- **Foundational (Phase 2)**: Depends on Phase 1.
- **TO1 (Phase 3)**: Depends on foundational source alignment.
- **TO2 (Phase 4)**: Depends on TO1's prepared handoff and task-scope rules.
- **TO3 (Phase 5)**: Depends on TO1 and TO2 execution/delivery status vocabulary.
- **Polish (Phase 6)**: Depends on all technical outcomes.

### Technical Outcome Dependencies

- **TO1 (P1)**: Establishes valid child handoff execution and task-scope boundaries.
- **TO2 (P2)**: Builds on TO1 execution to define child PR delivery and readiness.
- **TO3 (P3)**: Builds on TO1/TO2 results to define final reporting and prohibited side effects.

### Within Each Technical Outcome

- Implement source-of-truth text and simulation behavior before running that outcome's validation command.
- Complete and validate each technical outcome before treating it done.
- Rerun affected evidence after late edits.

### Parallel Opportunities

- Phase 1 and Phase 2 touch shared validation/source-of-truth files and should be sequential.
- TO1, TO2, and TO3 intentionally share `.agents/skills/catworld-parallel-child-implementation/SKILL.md`, `.agents/skills/catworld-parallel-coordinator/SKILL.md`, and `docs/ARCHITECTURE.md`; implement them sequentially to avoid conflicting edits.
- Final source reviews T030, T031, and T032 may run in parallel after implementation is complete.

---

## Parallel Example: Final Reviews

```powershell
Task: "Run child execution and delivery source review in .agents/skills/catworld-parallel-child-implementation/SKILL.md"
Task: "Run coordinator and architecture child delivery source review in .agents/skills/catworld-parallel-coordinator/SKILL.md and docs/ARCHITECTURE.md"
Task: "Run normal sequential skill unchanged check for .agents/skills/catworld-implement-issue/SKILL.md"
```

---

## Implementation Strategy

### First Verifiable Increment

1. Complete Phase 1 and Phase 2.
2. Complete Phase 3 for TO1.
3. Stop and validate `valid-handoff`, `missing-context`, `wrong-checkout`, and `wrong-branch` simulations.

### Incremental Delivery

1. Add TO1 prepared handoff execution and validate.
2. Add TO2 child PR delivery and readiness checks and validate.
3. Add TO3 final reporting and prohibited-operation checks and validate.
4. Run final source reviews, source-map review, and `git diff --check`.

### Parallel Team Strategy

This feature is intentionally sequential because the primary implementation
surface is shared workflow source text. Parallelism is limited to final reviews
after all edits are complete.

---

## Notes

- Do not modify `.agents/skills/catworld-implement-issue/SKILL.md`.
- Do not modify `.agents/skills/catworld-orchestrate-coordinator-issue/SKILL.md`.
- Do not add product backend, frontend, persistence, migration, authorization, security, deployment, or UI behavior changes.
- Do not perform real sidecar child PR operations, GitHub issue mutations, public comments, force-pushes, branch cleanup, remote branch deletion, or remote cleanup as implementation validation tasks.
