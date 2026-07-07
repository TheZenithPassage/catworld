# Tasks: Sidecar PR Target and Closure Rules

**Input**: Design documents from `specs/019-sidecar-pr-rules/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/sidecar-pr-delivery.md, quickstart.md

**Tests**: This workflow-only feature requires local sample PR descriptions, targeted text checks, manual review against issues #224/#229/#220, changed-file scope review, and `git diff --check`. Backend/frontend runtime tests are not required because no product runtime code is in scope.

**Organization**: Tasks are grouped by verifiable technical outcome.

## Phase 1: Setup

**Purpose**: Prepare local validation sample location for issue #230.

- [X] T001 Create local validation sample directory `specs/019-sidecar-pr-rules/samples/`

---

## Phase 2: Foundational Sidecar Source Alignment

**Purpose**: Add shared sidecar PR delivery authority, GitHub mutation approval, public comment approval, and remote cleanup approval language before outcome-specific samples/templates are validated.

- [X] T002 Add issue #230 sidecar PR delivery, user-merge/readiness, GitHub mutation approval, public comment approval, and remote cleanup approval rules in `.agents/skills/catworld-parallel-coordinator/SKILL.md`
- [X] T003 [P] Add child-side sidecar PR delivery boundaries, `Related to` child PR wording, issue mutation/public comment approval, and remote cleanup approval references in `.agents/skills/catworld-parallel-child-implementation/SKILL.md`
- [X] T004 [P] Add sidecar PR delivery rules and approval boundaries to the Codex workflow documentation in `docs/ARCHITECTURE.md`

**Checkpoint**: Shared sidecar source-of-truth files contain the approval-gated delivery rules needed by all technical outcomes.

---

## Phase 3: Technical Outcome 1 - Sidecar Child PR Rules (Priority: P1)

**Goal**: Sidecar child PRs target the coordinator branch, use `Related to` wording only, and cannot close issues prematurely.

**Verification**: Review child template and child samples to confirm coordinator-branch target guidance, `Related to` issue references, no issue-closing keywords, and approval-gated GitHub mutation/public comment wording.

- [X] T005 [TO1] Update child PR target, `Related to` wording, no-closing-keyword, and approval-boundary guidance in `.github/PULL_REQUEST_TEMPLATE/sidecar-child-to-coordinator.md`
- [X] T006 [P] [TO1] Create first child PR sample in `specs/019-sidecar-pr-rules/samples/sidecar-child-pr-231.md`
- [X] T007 [P] [TO1] Create second child PR sample in `specs/019-sidecar-pr-rules/samples/sidecar-child-pr-232.md`
- [X] T008 [TO1] Run child PR text checks from `specs/019-sidecar-pr-rules/quickstart.md` against `.github/PULL_REQUEST_TEMPLATE/sidecar-child-to-coordinator.md`, `specs/019-sidecar-pr-rules/samples/sidecar-child-pr-231.md`, and `specs/019-sidecar-pr-rules/samples/sidecar-child-pr-232.md`

**Checkpoint**: Sidecar child PR examples are objectively reviewable and cannot close child or coordinator issues.

---

## Phase 4: Technical Outcome 2 - Final Coordinator PR Rules (Priority: P1)

**Goal**: The final sidecar coordinator PR targets `main`, may close the coordinator set, and makes merge authority clear.

**Verification**: Review final coordinator template and sample to confirm `main` target guidance, closure-capable wording, integrated child traceability, Codex readiness reporting, user-performed merges, and approval-gated GitHub mutation/public comment wording.

- [X] T009 [TO2] Update final coordinator PR target, closure-capable wording, integrated child traceability, user-merge/readiness, and approval-boundary guidance in `.github/PULL_REQUEST_TEMPLATE/sidecar-final-coordinator-to-main.md`
- [X] T010 [TO2] Create final sidecar coordinator PR sample in `specs/019-sidecar-pr-rules/samples/sidecar-final-coordinator-pr.md`
- [X] T011 [TO2] Run final coordinator PR text checks from `specs/019-sidecar-pr-rules/quickstart.md` against `.github/PULL_REQUEST_TEMPLATE/sidecar-final-coordinator-to-main.md` and `specs/019-sidecar-pr-rules/samples/sidecar-final-coordinator-pr.md`

**Checkpoint**: The final sidecar coordinator PR is the only sidecar PR example that may close the coordinator set.

---

## Phase 5: Technical Outcome 3 - Non-Sidecar PR Boundaries (Priority: P1)

**Goal**: Normal sequential issue work, direct child issue work outside `parallel`, and closed-child coordinator final passes keep normal sequential PR behavior.

**Verification**: Review README guidance and final-pass sample to confirm normal sequential behavior remains unchanged and closed-child coordinator final passes do not use the sidecar child/final PR model.

- [X] T012 [TO3] Update normal sequential, direct child, closed-child coordinator final-pass, and approval-boundary guidance in `.github/PULL_REQUEST_TEMPLATE/README.md`
- [X] T013 [TO3] Create closed-child coordinator final-pass sample in `specs/019-sidecar-pr-rules/samples/coordinator-final-pass-pr.md`
- [X] T014 [TO3] Run non-sidecar boundary checks from `specs/019-sidecar-pr-rules/quickstart.md` against `.github/PULL_REQUEST_TEMPLATE/README.md`, `specs/019-sidecar-pr-rules/samples/coordinator-final-pass-pr.md`, `docs/ARCHITECTURE.md`, and `.agents/skills/catworld-implement-issue/SKILL.md`

**Checkpoint**: Non-sidecar PR behavior is explicitly preserved and the normal sequential implementation skill remains unchanged.

---

## Phase 6: Polish & Cross-Cutting Validation

**Purpose**: Complete required issue validation and scope review after all sidecar delivery text and samples are in place.

- [X] T015 Run the full validation checklist in `specs/019-sidecar-pr-rules/quickstart.md` after the latest edits
- [X] T016 Run `git diff --check`
- [X] T017 Review changed files against the source map in `specs/019-sidecar-pr-rules/plan.md` and justify or remove any unplanned touched surfaces
- [X] T018 Manually review the implemented wording against issues #224, #229, and #220 and record the result in the final implementation report

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies.
- **Foundational (Phase 2)**: Depends on Phase 1; must complete before outcome-specific validation.
- **TO1 Child PR Rules (Phase 3)**: Depends on Phase 2.
- **TO2 Final Coordinator PR Rules (Phase 4)**: Depends on Phase 2; can proceed independently of TO1 except where shared review language changes.
- **TO3 Non-Sidecar PR Boundaries (Phase 5)**: Depends on Phase 2; can proceed independently of TO1/TO2 except where shared README/docs wording changes.
- **Polish (Phase 6)**: Depends on Phases 3-5.

### Technical Outcome Dependencies

- **TO1**: Requires shared sidecar source alignment from Phase 2.
- **TO2**: Requires shared sidecar source alignment from Phase 2.
- **TO3**: Requires shared sidecar source alignment from Phase 2.

### Parallel Opportunities

- T002, T003, and T004 can run in parallel if file ownership is coordinated.
- T006 and T007 can run in parallel after T005.
- T010 and T013 can run in parallel after T009 and T012 are complete.
- TO1, TO2, and TO3 sample creation can be parallelized after shared source alignment when edits avoid the same files.

---

## Parallel Example: Technical Outcome 1

```text
Task: "Create first child PR sample in specs/019-sidecar-pr-rules/samples/sidecar-child-pr-231.md"
Task: "Create second child PR sample in specs/019-sidecar-pr-rules/samples/sidecar-child-pr-232.md"
```

---

## Implementation Strategy

### First Verifiable Increment

1. Complete Phase 1 and Phase 2 shared sidecar source alignment.
2. Complete Phase 3 for sidecar child PR rules.
3. Stop and validate child PR samples contain no closing keywords and target the coordinator branch.

### Incremental Delivery

1. Add child PR safety rules and samples, then validate TO1.
2. Add final coordinator PR target/closure rules and sample, then validate TO2.
3. Add normal sequential and closed-child final-pass boundary guidance and sample, then validate TO3.
4. Run full quickstart, whitespace, changed-file, and issue-alignment reviews after all edits.

### Notes

- Do not open real PRs during validation.
- Do not mutate GitHub issues, labels, assignees, milestones, state, or public comments.
- Do not delete remote branches, prune remotes, or perform remote cleanup.
- Do not change CatWorld backend, frontend, migration, or runtime behavior.
