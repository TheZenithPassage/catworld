# Tasks: Dry-run Sidecar Coordinator Workflow

**Input**: Design documents from `specs/023-dry-run-sidecar-workflow/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Evidence is required by issue #234, the specification, and the plan
validation evidence section. Validation uses local dry-run samples, a temporary
Git merge simulation, focused text checks, changed-file review, and
`git diff --check`.

**Organization**: Tasks are grouped by verifiable technical outcome because
this is workflow infrastructure dry-run work.

## Format: `[ID] [P?] [Trace] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Trace]**: Which technical outcome this task belongs to
- Include exact file paths in descriptions

## Phase 1: Setup

**Goal**: Prepare the dry-run evidence workspace and record the live issue
limitation that prevents using a real #220-#234 coordinator as the valid
parallel scenario.

- [X] T001 Create the dry-run sample directory at `specs/023-dry-run-sidecar-workflow/samples/`
- [X] T002 Record local fixture issue numbers, live issue limitations, and source issue references in `specs/023-dry-run-sidecar-workflow/samples/fixture-issues.md`
- [X] T003 Create the top-level dry-run report skeleton in `specs/023-dry-run-sidecar-workflow/dry-run-report.md`

## Phase 2: Foundational Source Review

**Goal**: Establish the source-of-truth evidence used by all dry-run outcomes.

- [X] T004 Review `AGENTS.md`, `.agents/skills/catworld-implement-issue/SKILL.md`, `.agents/skills/catworld-parallel-coordinator/SKILL.md`, `.agents/skills/catworld-parallel-child-implementation/SKILL.md`, `docs/ARCHITECTURE.md`, and sidecar artifacts from `specs/014-sidecar-artifact-paths/` through `specs/022-split-handoff-alignment/`
- [X] T005 Record source-of-truth review results and any conflicts or blockers in `specs/023-dry-run-sidecar-workflow/dry-run-report.md`
- [X] T006 Verify issue #234 remains sequential-only under the #220-#234 guardrail and record that routing evidence in `specs/023-dry-run-sidecar-workflow/dry-run-report.md`

## Phase 3: Technical Outcome 1 - Controlled Dry-run Evidence (Priority: P1)

**Goal**: Produce a reviewable dry-run result with fixture issue numbers,
artifact paths, branch names, PR target expectations, validation statuses,
blockers, and corrections.

**Verification**: The dry-run report and fixture issue sample identify the
controlled evidence set, status vocabulary, source references, blocked live
operation limits, and follow-up corrections without declaring adoption.

### Evidence for Technical Outcome 1

- [X] T007 [TO1] Populate controlled fixture issue data in `specs/023-dry-run-sidecar-workflow/samples/fixture-issues.md`
- [X] T008 [TO1] Populate issue/source references, dry-run status vocabulary, validation summary, blockers, and adoption-gate statement in `specs/023-dry-run-sidecar-workflow/dry-run-report.md`
- [X] T009 [TO1] Record discovered adoption gaps and follow-up corrections, or explicitly record none found, in `specs/023-dry-run-sidecar-workflow/dry-run-report.md`

**Checkpoint**: TO1 is objectively verifiable from the dry-run report and
fixture issue sample.

---

## Phase 4: Technical Outcome 2 - Routing Outcomes (Priority: P1)

**Goal**: Verify and record the five routing outcomes required by issue #234
while preserving the default sequential workflow.

**Verification**: The routing matrix covers valid coordinator `parallel`,
invalid non-coordinator `parallel`, invalid coordinator end-to-end with open
children, valid closed-child coordinator final pass, and direct child
end-to-end.

### Evidence for Technical Outcome 2

- [X] T010 [TO2] Create the five-outcome routing matrix in `specs/023-dry-run-sidecar-workflow/samples/routing-outcomes.md`
- [X] T011 [TO2] Record evidence that closed-child coordinator final pass uses `.agents/skills/catworld-implement-issue/SKILL.md` and does not redo closed child scope in `specs/023-dry-run-sidecar-workflow/samples/routing-outcomes.md`
- [X] T012 [TO2] Record evidence that direct child end-to-end uses the current sequential workflow in `specs/023-dry-run-sidecar-workflow/samples/routing-outcomes.md`
- [X] T013 [TO2] Confirm `.agents/skills/catworld-implement-issue/SKILL.md` has no dry-run diff and record the result in `specs/023-dry-run-sidecar-workflow/dry-run-report.md`

**Checkpoint**: TO2 is objectively verifiable from the routing matrix and
unchanged-normal-skill review.

---

## Phase 5: Technical Outcome 3 - Operational Guardrails and Blockers (Priority: P1)

**Goal**: Verify and record sidecar artifact, handoff, Git, PR, cleanup,
mutation, readiness, validation, and human-only blocker behavior.

**Verification**: Feature-local samples record artifact paths, branch names,
PR target wording, normal merge refresh, cleanup timing, mutation restrictions,
no required `parallel-ready` label, no unapproved seed/foundation issue,
validation status handling, and human-only blockers.

### Evidence for Technical Outcome 3

- [X] T014 [P] [TO3] Create sidecar coordinator and child artifact path evidence in `specs/023-dry-run-sidecar-workflow/samples/sidecar-artifact-map.md`
- [X] T015 [P] [TO3] Create sidecar child handoff evidence in `specs/023-dry-run-sidecar-workflow/samples/child-handoff.md`
- [X] T016 [P] [TO3] Create sidecar child, final coordinator, and closed-child final-pass PR wording evidence in `specs/023-dry-run-sidecar-workflow/samples/pr-wording.md`
- [X] T017 [P] [TO3] Create validation reporting, stale evidence, blocker, conflict, and human-only blocker evidence in `specs/023-dry-run-sidecar-workflow/samples/validation-reporting.md`
- [X] T018 [TO3] Run a temporary local Git simulation for coordinator branch, two child branches, child merge, and active child normal-merge refresh; record transcript and result in `specs/023-dry-run-sidecar-workflow/samples/git-merge-simulation.md`
- [X] T019 [TO3] Record cleanup eligibility, GitHub mutation restrictions, remote cleanup approval, no required `parallel-ready` label, and no unapproved seed/foundation/shared-contract issue evidence in `specs/023-dry-run-sidecar-workflow/dry-run-report.md`
- [X] T020 [TO3] If evidence proves an in-scope workflow-source gap, update only the affected source-of-truth file named in `specs/023-dry-run-sidecar-workflow/plan.md`; otherwise record that no workflow-source corrections were made in `specs/023-dry-run-sidecar-workflow/dry-run-report.md`

**Checkpoint**: TO3 is objectively verifiable from the sidecar samples, Git
simulation transcript, and top-level dry-run report.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final validation and scope review required by the plan.

- [X] T021 Run focused quickstart text checks from `specs/023-dry-run-sidecar-workflow/quickstart.md`
- [X] T022 Run `git diff -- .agents/skills/catworld-implement-issue/SKILL.md` and confirm no unapproved normal sequential workflow internals changed
- [X] T023 Run `git diff --check` from the repository root
- [X] T024 Review `git status --short` and `git diff --name-only` against the source map in `specs/023-dry-run-sidecar-workflow/plan.md`
- [X] T025 Rerun affected quickstart checks after any late workflow-source or dry-run evidence edits, or report stale/not-run checks explicitly in `specs/023-dry-run-sidecar-workflow/dry-run-report.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Starts first because all samples depend on the evidence directory and fixture issue definitions.
- **Foundational Source Review (Phase 2)**: Depends on setup and feeds all technical outcomes.
- **TO1 (Phase 3)**: Depends on setup and source review.
- **TO2 (Phase 4)**: Depends on source review and fixture issue definitions.
- **TO3 (Phase 5)**: Depends on source review and fixture issue definitions; sample files can be drafted in parallel before final report consolidation.
- **Polish (Phase 6)**: Depends on all technical outcomes being complete.

### Technical Outcome Dependencies

- **TO1**: Establishes the dry-run result and adoption-gate framing.
- **TO2**: Uses the fixture issues and source review to prove routing outcomes.
- **TO3**: Uses the fixture issues, source review, and dry-run framing to prove operational guardrails.

### Parallel Opportunities

- T014, T015, T016, and T017 can be drafted in parallel because they create separate sample files.
- T021 and T022 can run in parallel after implementation because they read different evidence surfaces.

---

## Parallel Example: Technical Outcome 3

```bash
Task: "Create sidecar coordinator and child artifact path evidence in specs/023-dry-run-sidecar-workflow/samples/sidecar-artifact-map.md"
Task: "Create sidecar child handoff evidence in specs/023-dry-run-sidecar-workflow/samples/child-handoff.md"
Task: "Create sidecar child, final coordinator, and closed-child final-pass PR wording evidence in specs/023-dry-run-sidecar-workflow/samples/pr-wording.md"
Task: "Create validation reporting, stale evidence, blocker, conflict, and human-only blocker evidence in specs/023-dry-run-sidecar-workflow/samples/validation-reporting.md"
```

---

## Implementation Strategy

### First Verifiable Increment

1. Complete setup and source review.
2. Populate the top-level dry-run report enough to show live issue limitations,
   fixture issue numbers, source references, and status vocabulary.
3. Confirm the report does not declare adoption.

### Incremental Delivery

1. Build TO1 dry-run report framing and fixture issue evidence.
2. Add TO2 routing matrix and unchanged sequential workflow review.
3. Add TO3 sidecar artifact, handoff, Git, PR, cleanup, validation, and blocker evidence.
4. Run quickstart text checks, `git diff --check`, and changed-file scope review.

### Parallel Team Strategy

Sample files under `specs/023-dry-run-sidecar-workflow/samples/` can be drafted
independently, but the top-level dry-run report should be consolidated after
all sample evidence exists.

---

## Notes

- Do not modify GitHub issues or post public comments during implementation.
- Do not add product code changes.
- Do not modify `.agents/skills/catworld-implement-issue/SKILL.md` unless a separately approved correction exists.
- Do not use sidecar parallel mode for issues #220 through #234.
- Do not declare the sidecar workflow ready or default; user review decides readiness after the dry-run.
