# Tasks: Sidecar Resume State

**Input**: Design documents from `specs/021-sidecar-resume-state/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/sidecar-resume-state.md, quickstart.md

**Tests**: Evidence is required by issue #232, the specification validation
matrix, the semantic-equivalence review, and the plan validation evidence
section. Validation uses local resume-state samples, a temporary Git
normal-merge simulation, focused text checks, changed-file scope review, manual
review against #229 and #231, and `git diff --check`.

**Organization**: Tasks are grouped by verifiable technical outcome because
this is workflow/enabling work.

## Phase 1: Technical Outcome 1 - Coordinator Resume State (Priority: P1)

**Goal**: Sidecar coordinator artifacts record enough child-level state for a
later session to identify completed, active, blocked, and pending child work
without private conversation context.

**Verification**: The local coordinator resume-state sample identifies
completed, active, blocked, and pending children with artifact path, branch,
local checkout/worktree, PR, validation state, workflow status, blocker,
refresh state, and cleanup eligibility fields; sidecar coordinator skill and
architecture docs contain the same required fields.

### Evidence for Technical Outcome 1

- [X] T001 [P] [TO1] Add completed/active/blocked/pending coordinator resume-state sample in specs/021-sidecar-resume-state/samples/coordinator-resume-state.md

### Implementation for Technical Outcome 1

- [X] T002 [TO1] Add sidecar coordinator artifact resume status table fields, child workflow statuses, and private-context-free resume requirements in .agents/skills/catworld-parallel-coordinator/SKILL.md
- [X] T003 [P] [TO1] Document sidecar coordinator resume-state fields and child status meanings in docs/ARCHITECTURE.md
- [X] T004 [TO1] Verify TO1 requirements against specs/021-sidecar-resume-state/contracts/sidecar-resume-state.md and record any missing field or status wording in .agents/skills/catworld-parallel-coordinator/SKILL.md

**Checkpoint**: TO1 is objectively verifiable with the coordinator resume-state
sample and sidecar coordinator/docs wording.

---

## Phase 2: Technical Outcome 2 - Resume Re-Read and Refresh State (Priority: P1)

**Goal**: Sidecar resume guidance defines what GitHub and repository evidence
must be re-read before continuing, and marks stale branch or validation state
explicitly after child PR merges or pauses.

**Verification**: The active-branch refresh sample demonstrates a merged child
PR, an active child branch needing normal-merge refresh, stale validation until
rerun, and a blocked child issue; sidecar skills and architecture docs require
re-reading current GitHub/repository evidence before resume.

### Evidence for Technical Outcome 2

- [X] T005 [P] [TO2] Add active branch refresh and stale validation sample in specs/021-sidecar-resume-state/samples/active-branch-refresh-report.md

### Implementation for Technical Outcome 2

- [X] T006 [TO2] Add sidecar resume re-read requirements, refresh state after user merges, paused-work updates, failed-validation updates, and stale validation handling in .agents/skills/catworld-parallel-coordinator/SKILL.md
- [X] T007 [P] [TO2] Add child handoff and reporting requirements for refresh status, stale validation after refresh, blockers, and resume-needed state in .agents/skills/catworld-parallel-child-implementation/SKILL.md
- [X] T008 [P] [TO2] Document sidecar resume re-read requirements, normal-merge refresh state, and stale validation behavior in docs/ARCHITECTURE.md

**Checkpoint**: TO2 is objectively verifiable with the refresh sample,
sidecar workflow text, and the temporary Git simulation in quickstart.md.

---

## Phase 3: Technical Outcome 3 - Cleanup and Non-Sidecar Boundaries (Priority: P1)

**Goal**: Sidecar resume rules preserve approved Git cleanup boundaries and keep
normal sequential state handling unchanged for direct child work and
closed-child coordinator final passes.

**Verification**: Cleanup and closed-child final-pass samples show local
cleanup ineligible after individual child PR merges, eligible only after final
coordinator PR merge into `main`, remote cleanup blocked without explicit user
approval, and closed-child coordinator final passes using normal sequential
state handling.

### Evidence for Technical Outcome 3

- [X] T009 [P] [TO3] Add cleanup eligibility sample in specs/021-sidecar-resume-state/samples/cleanup-eligibility-report.md
- [X] T010 [P] [TO3] Add closed-child coordinator final-pass state sample using normal sequential handling in specs/021-sidecar-resume-state/samples/coordinator-final-pass-state.md

### Implementation for Technical Outcome 3

- [X] T011 [TO3] Add local cleanup timing, local-only cleanup scope, remote cleanup approval, direct child sequential state, and closed-child coordinator final-pass exclusions in .agents/skills/catworld-parallel-coordinator/SKILL.md
- [X] T012 [P] [TO3] Add child-side cleanup, remote cleanup approval, and normal sequential state boundary language in .agents/skills/catworld-parallel-child-implementation/SKILL.md
- [X] T013 [P] [TO3] Document cleanup eligibility and normal workflow state exclusions in docs/ARCHITECTURE.md

**Checkpoint**: TO3 is objectively verifiable with cleanup/final-pass samples,
sidecar workflow text, and normal sequential workflow scope review.

---

## Phase 4: Polish & Cross-Cutting Concerns

**Purpose**: Final validation, scope review, and freshness checks required by
the active plan.

- [X] T014 Run the temporary Git refresh simulation from specs/021-sidecar-resume-state/quickstart.md and confirm active child refresh uses normal merge only
- [X] T015 Run the required text checks from specs/021-sidecar-resume-state/quickstart.md for specs/021-sidecar-resume-state/samples/*.md, .agents/skills/catworld-parallel-coordinator/SKILL.md, .agents/skills/catworld-parallel-child-implementation/SKILL.md, docs/ARCHITECTURE.md, and .agents/skills/catworld-implement-issue/SKILL.md
- [X] T016 Run git diff --name-only -- .agents/skills/catworld-implement-issue/SKILL.md and confirm the normal sequential implementation skill has no diff
- [X] T017 Run git diff --check from the repository root
- [X] T018 Review changed files against specs/021-sidecar-resume-state/plan.md source map and confirm no unplanned product code, Git automation, PR automation, GitHub issue mutation, public comment, local cleanup, remote cleanup, or normal sequential workflow implementation changes
- [X] T019 Manually review the implementation against GitHub issues #229 and #231 and record any mismatch before final delivery
- [X] T020 Rerun affected quickstart checks after any late sidecar workflow or sample edits, or report stale/not-run checks explicitly

---

## Dependencies & Execution Order

### Phase Dependencies

- **Technical Outcome 1 (Phase 1)**: Starts first because child resume-state
  fields and status vocabulary are the base for resume and cleanup behavior.
- **Technical Outcome 2 (Phase 2)**: Depends on TO1 state vocabulary and child
  status fields.
- **Technical Outcome 3 (Phase 3)**: Depends on TO1 state vocabulary and TO2
  refresh/freshness behavior.
- **Polish (Phase 4)**: Depends on all technical outcomes being complete.

### Technical Outcome Dependencies

- **TO1**: No feature-internal dependency beyond completed issues #227, #229,
  and #231.
- **TO2**: Depends on TO1 coordinator resume-state fields.
- **TO3**: Depends on TO1 resume-state fields and TO2 refresh/stale-validation
  state.

### Parallel Opportunities

- T001 can run in parallel with T003 because they edit separate files.
- T005, T007, and T008 can run in parallel after T006 establishes coordinator
  resume wording, because they edit separate files.
- T009 and T010 can run in parallel because they create separate sample files.
- T012 and T013 can run in parallel after T011 because they edit separate
  files.
- T017 can run in parallel with T018 after all edits are complete.

---

## Parallel Example: Technical Outcome 2

```text
Task: "Add active branch refresh and stale validation sample in specs/021-sidecar-resume-state/samples/active-branch-refresh-report.md"
Task: "Add child handoff and reporting requirements for refresh status, stale validation after refresh, blockers, and resume-needed state in .agents/skills/catworld-parallel-child-implementation/SKILL.md"
Task: "Document sidecar resume re-read requirements, normal-merge refresh state, and stale validation behavior in docs/ARCHITECTURE.md"
```

---

## Implementation Strategy

### First Verifiable Increment

1. Complete TO1 sidecar coordinator resume-state fields across the coordinator
   skill, architecture docs, and sample artifact.
2. Validate TO1 against `contracts/sidecar-resume-state.md`.
3. Stop and confirm a later session can identify completed, active, blocked,
   and pending child work from recorded state.

### Incremental Delivery

1. Add TO1 coordinator resume-state fields and status vocabulary.
2. Add TO2 resume re-read and refresh/freshness rules, then run the temporary
   Git simulation.
3. Add TO3 cleanup eligibility and non-sidecar state boundaries.
4. Run quickstart text checks, `git diff --check`, manual review against #229
   and #231, and changed-file scope review after final edits.

### Parallel Team Strategy

Sample reports in separate files can be drafted independently, but edits to the
two sidecar skill files and `docs/ARCHITECTURE.md` should be sequenced to avoid
overwriting adjacent sidecar workflow rules.

---

## Notes

- Do not modify `.agents/skills/catworld-implement-issue/SKILL.md`.
- Do not modify GitHub issues or post public comments during implementation.
- Do not create or delete real CatWorld sidecar branches or worktrees during
  implementation.
- Do not add branch cleanup, branch deletion, remote pruning, force-push,
  merge, auto-merge, issue mutation, or public comment tasks.
