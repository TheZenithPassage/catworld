# Tasks: Sidecar Validation Reporting

**Input**: Design documents from `specs/020-sidecar-validation-reporting/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Evidence is required by issue #231, the specification, and the plan
validation evidence section. Validation uses local sample reports, focused text
checks, changed-file review, and `git diff --check`.

**Organization**: Tasks are grouped by verifiable technical outcome because
this is workflow infrastructure work.

## Format: `[ID] [P?] [Trace] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Trace]**: Which technical outcome this task belongs to
- Include exact file paths in descriptions

## Phase 1: Technical Outcome 1 - Explicit Validation Evidence (Priority: P1)

**Goal**: Sidecar child and coordinator reports list required evidence with
explicit statuses and freshness, and never summarize incomplete or failed
validation as passed.

**Verification**: Success, failure, and stale-validation samples demonstrate
fresh passed evidence, non-passed evidence, and stale evidence after a branch
update; sidecar skills and architecture docs contain the same rules.

### Evidence for Technical Outcome 1

- [X] T001 [P] [TO1] Add success sample report with fresh passed evidence in specs/020-sidecar-validation-reporting/samples/sidecar-success-report.md
- [X] T002 [P] [TO1] Add failure sample report with failed and not-run evidence in specs/020-sidecar-validation-reporting/samples/sidecar-failure-report.md
- [X] T003 [P] [TO1] Add stale validation sample report in specs/020-sidecar-validation-reporting/samples/sidecar-stale-validation-report.md

### Implementation for Technical Outcome 1

- [X] T004 [TO1] Update sidecar coordinator validation reporting, status vocabulary, freshness, and coordinator readiness rules in .agents/skills/catworld-parallel-coordinator/SKILL.md
- [X] T005 [TO1] Update sidecar child validation reporting, status vocabulary, freshness, and child PR ready/draft readiness rules in .agents/skills/catworld-parallel-child-implementation/SKILL.md
- [X] T006 [TO1] Document sidecar validation report evidence, status, stale-validation, and readiness rules in docs/ARCHITECTURE.md

**Checkpoint**: TO1 is objectively verifiable with local success, failure, and
stale-validation samples plus sidecar workflow text.

---

## Phase 2: Technical Outcome 2 - Blocker and Conflict Reporting (Priority: P1)

**Goal**: Sidecar reporting distinguishes child-specific, coordinator-wide,
shared-contract, conflict, and human-only blockers, and stops affected sidecar
work for user guidance when required.

**Verification**: Blocker, conflict, and human-only blocker samples cover the
required categories; sidecar skills and architecture docs require user guidance
for non-trivial conflicts and human-only decisions.

### Evidence for Technical Outcome 2

- [X] T007 [P] [TO2] Add blocker sample distinguishing child-specific, coordinator-wide, and shared-contract blockers in specs/020-sidecar-validation-reporting/samples/sidecar-blocker-report.md
- [X] T008 [P] [TO2] Add conflict sample that stops for user guidance on contract, scope, persistence, security, authorization, UX, or domain behavior in specs/020-sidecar-validation-reporting/samples/sidecar-conflict-report.md
- [X] T009 [P] [TO2] Add human-only blocker sample covering a material architecture, production exposure, deployment, secrets, or Git/GitHub workflow issue in specs/020-sidecar-validation-reporting/samples/sidecar-human-only-blocker-report.md

### Implementation for Technical Outcome 2

- [X] T010 [TO2] Update sidecar coordinator blocker, conflict, shared-contract, human-only blocker, issue mutation, and public comment rules in .agents/skills/catworld-parallel-coordinator/SKILL.md
- [X] T011 [TO2] Update sidecar child blocker, conflict, shared-contract, human-only blocker, issue mutation, and public comment rules in .agents/skills/catworld-parallel-child-implementation/SKILL.md
- [X] T012 [TO2] Document sidecar blocker, conflict, human-only decision, issue mutation, and public comment reporting rules in docs/ARCHITECTURE.md

**Checkpoint**: TO2 is objectively verifiable with local blocker/conflict
samples and sidecar workflow text.

---

## Phase 3: Technical Outcome 3 - Readiness and Non-Sidecar Boundaries (Priority: P1)

**Goal**: Sidecar readiness reporting stays explicit, while normal sequential
reporting and closed-child coordinator final-pass reporting remain unchanged.

**Verification**: The closed-child coordinator final-pass sample uses normal
sequential reporting, sidecar text says normal sequential reports are
unchanged, and the normal sequential implementation skill has no diff.

### Evidence for Technical Outcome 3

- [X] T013 [P] [TO3] Add closed-child coordinator final-pass sample using normal sequential reporting in specs/020-sidecar-validation-reporting/samples/coordinator-final-pass-report.md
- [X] T014 [TO3] Verify .agents/skills/catworld-implement-issue/SKILL.md has no diff after sidecar reporting changes

### Implementation for Technical Outcome 3

- [X] T015 [TO3] Add normal sequential reporting and closed-child coordinator final-pass boundaries to .agents/skills/catworld-parallel-coordinator/SKILL.md
- [X] T016 [TO3] Add normal sequential reporting and closed-child coordinator final-pass boundaries to .agents/skills/catworld-parallel-child-implementation/SKILL.md
- [X] T017 [TO3] Document normal sequential reporting and closed-child coordinator final-pass boundaries in docs/ARCHITECTURE.md

**Checkpoint**: TO3 is objectively verifiable with the final-pass sample,
changed-file review, and boundary text.

---

## Phase 4: Polish & Cross-Cutting Concerns

**Purpose**: Final validation and scope review required by the plan.

- [X] T018 Run quickstart text checks from specs/020-sidecar-validation-reporting/quickstart.md
- [X] T019 Run git diff --check from the repository root
- [X] T020 Review changed files against specs/020-sidecar-validation-reporting/plan.md source map and confirm no unplanned product code, Git automation, PR automation, GitHub issue mutation, public comment, or normal sequential workflow implementation changes
- [X] T021 Rerun affected quickstart checks after any late sidecar workflow or sample-report edits, or report stale/not-revalidated checks explicitly

---

## Dependencies & Execution Order

### Phase Dependencies

- **Technical Outcome 1 (Phase 1)**: Starts first because validation status and
  freshness language is the base for blocker and readiness reporting.
- **Technical Outcome 2 (Phase 2)**: Depends on TO1 reporting vocabulary in the
  shared sidecar workflow files.
- **Technical Outcome 3 (Phase 3)**: Depends on TO1 and TO2 sidecar reporting
  language so normal-sequential boundaries can be reviewed against the final
  sidecar text.
- **Polish (Phase 4)**: Depends on all technical outcomes being complete.

### Technical Outcome Dependencies

- **TO1**: No feature-internal dependency.
- **TO2**: Depends on TO1 status and freshness vocabulary.
- **TO3**: Depends on TO1 and TO2 sidecar reporting text.

### Parallel Opportunities

- T001, T002, and T003 can be drafted in parallel because they create separate
  sample files.
- T007, T008, and T009 can be drafted in parallel because they create separate
  sample files.
- T013 can be drafted in parallel with T014 because the sample file and
  unchanged normal skill review do not overlap.

---

## Parallel Example: Technical Outcome 1

```bash
Task: "Add success sample report with fresh passed evidence in specs/020-sidecar-validation-reporting/samples/sidecar-success-report.md"
Task: "Add failure sample report with failed and not-run evidence in specs/020-sidecar-validation-reporting/samples/sidecar-failure-report.md"
Task: "Add stale validation sample report in specs/020-sidecar-validation-reporting/samples/sidecar-stale-validation-report.md"
```

---

## Implementation Strategy

### First Verifiable Increment

1. Complete Phase 1 for explicit validation evidence.
2. Validate success, failure, and stale report samples.
3. Confirm sidecar workflow text contains status, freshness, and readiness
   rules.

### Incremental Delivery

1. Add TO1 validation evidence reporting and validate samples.
2. Add TO2 blocker/conflict reporting and validate samples.
3. Add TO3 readiness/non-sidecar boundaries and validate final-pass sample.
4. Run quickstart checks, `git diff --check`, and changed-file scope review.

### Parallel Team Strategy

Sample reports in separate files can be drafted independently, but edits to the
two sidecar skill files and `docs/ARCHITECTURE.md` should be sequenced to avoid
overwriting adjacent reporting rules.

---

## Notes

- Do not modify `.agents/skills/catworld-implement-issue/SKILL.md`.
- Do not modify GitHub issues or post public comments during implementation.
- Do not add branch cleanup, branch deletion, remote pruning, force-push, merge,
  auto-merge, issue mutation, or public comment tasks.
