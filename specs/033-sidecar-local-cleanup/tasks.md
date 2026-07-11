# Tasks: Sidecar Local Cleanup

**Input**: Design documents from `/specs/033-sidecar-local-cleanup/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/sidecar-cleanup-journal.md, quickstart.md

**Tests**: Required by issue #259 and the approved plan. Use exactly one focused PowerShell validation script, one shared temporary-Git fixture, and table-driven cases for the seven approved scenarios. Complete end-to-end and cross-workflow validation remains in #260.

**Organization**: Tasks are grouped by the three verifiable technical outcomes in the specification.

## Phase 1: Foundational Validation Shape

**Purpose**: Establish the one compact fixture and journal primitives shared by all seven cases.

- [X] T001 Create `specs/033-sidecar-local-cleanup/validation/simulate-sidecar-cleanup.ps1` with one reusable temporary-Git fixture, a table-driven case dispatcher, compact assertion/Git helpers, exact eight-field journal serialization, and guaranteed temporary-directory cleanup

**Checkpoint**: One script and one fixture can support all outcome-specific cases without copying #254, #257, or #258 harnesses.

---

## Phase 2: Technical Outcome 1 - Final-Merge Eligibility Gate (Priority: P1)

**Goal**: Cleanup is blocked until current evidence confirms the same-run final coordinator PR merged into `main`.

**Verification**: Run the script's `blocked-before-final-merge` and `eligible-after-final-merge` cases; the first records `ineligible/ineligible`, and the second records `eligible/not_started` with no attempted operation because cleanup authority is absent.

- [X] T002 [TO1] Implement exact journal-state table cases `blocked-before-final-merge` (`ineligible/ineligible`) and `eligible-after-final-merge` (`eligible/not_started`, no attempts) in `specs/033-sidecar-local-cleanup/validation/simulate-sidecar-cleanup.ps1`
- [X] T003 [TO1] Replace report-only cleanup eligibility guidance with the unique same-run final-PR/source/H2/`main` evidence gate, exact stable run-ID requirement, explicit current cleanup-authority gate, and exact eligibility/result transitions in `.agents/skills/catworld-parallel-coordinator/SKILL.md`
- [X] T004 [P] [TO1] Document the final-merge eligibility gate and explicit pre-merge retention boundary in `docs/ARCHITECTURE.md`

**Checkpoint**: Eligibility behavior is independently reviewable and simulated without duplicating #258 final-delivery evidence machinery.

---

## Phase 3: Technical Outcome 2 - Safe Same-Run Local Cleanup (Priority: P2)

**Goal**: A fully preflighted batch removes only clean, same-run-owned worktrees before associated non-force local branches and reports partial failure honestly.

**Verification**: Run the dirty-worktree, unknown-ownership, successful-cleanup, and partial-failure cases; blocked cases perform no deletion, success proves worktree-before-branch order, and failure records only attempted work.

- [X] T005 [TO2] Implement table cases `dirty-worktree-blocks`, `unknown-ownership-blocks`, `successful-local-cleanup`, and `partial-failure-recorded` in `specs/033-sidecar-local-cleanup/validation/simulate-sidecar-cleanup.ps1`
- [X] T006 [TO2] Add explicit-authority enforcement, complete-batch ownership and clean-worktree preflight, non-target control-checkout validation, worktree-first removal, standard non-force local branch deletion, immediate stop-on-failure, and truthful partial-result rules to `.agents/skills/catworld-parallel-coordinator/SKILL.md`
- [X] T007 [P] [TO2] Document same-run ownership, all-worktree cleanliness, operation ordering, failure handling, and retained-branch behavior in `docs/ARCHITECTURE.md`

**Checkpoint**: The local destructive boundary is fail-closed and the focused temporary fixture proves both blocked and successful/partial paths.

---

## Phase 4: Technical Outcome 3 - Minimal Local Journal and Prohibited Boundaries (Priority: P3)

**Goal**: Cleanup state persists under the Git common directory with exactly eight top-level fields while H2, repository history, remotes, and GitHub state remain untouched.

**Verification**: Run the prohibited-operations case and the full table; assert the journal path/schema, operation history, results, H2 protection, and absent remote/GitHub commands.

- [X] T008 [TO3] Add Git-common-directory path assertions, exact top-level schema checks, journal-before/after-attempt checks, and the `prohibited-operations-absent` table case to `specs/033-sidecar-local-cleanup/validation/simulate-sidecar-cleanup.ps1`
- [X] T009 [TO3] Add `git rev-parse --git-common-dir` resolution, safe run-ID path-component validation, exact journal schema/state updates, journal-write failure stop, H2/finalization immutability, no-H3/H4, and prohibited remote/GitHub operation rules to `.agents/skills/catworld-parallel-coordinator/SKILL.md`
- [X] T010 [P] [TO3] Document the local journal path/schema, evidence authority, update timing, H2 immutability, and prohibited-operation boundary in `docs/ARCHITECTURE.md`
- [X] T011 [TO3] Run all seven table-driven cases in `specs/033-sidecar-local-cleanup/validation/simulate-sidecar-cleanup.ps1` and confirm every case passes with one shared fixture

**Checkpoint**: The minimal local journal is durable outside worktrees and the workflow contains no tracked post-H2 or remote cleanup side effect.

---

## Phase 5: Polish & Cross-Cutting Validation

**Purpose**: Produce fresh, proportional evidence and restore temporary workflow state before delivery.

- [X] T012 Review `.agents/skills/catworld-parallel-coordinator/SKILL.md` and `docs/ARCHITECTURE.md` against `specs/033-sidecar-local-cleanup/contracts/sidecar-cleanup-journal.md`; confirm the journal never substitutes for final-merge or ownership evidence and the previous report-only cleanup wording no longer conflicts with the approved local journal
- [X] T013 Verify `specs/032-final-coordinator-delivery/finalization.md` is unchanged and source review finds no H3/H4, remote branch deletion/pruning, remote-tracking ref deletion, GitHub issue/comment mutation, PR merge/approval, or auto-merge operation in the #259 cleanup path
- [X] T014 Confirm changed paths match `specs/033-sidecar-local-cleanup/plan.md`, only one validation script exists, added lines remain below the user stop threshold, and no #260 end-to-end or cross-workflow harness was added
- [X] T015 Restore the temporary managed Spec Kit block in `AGENTS.md` to its build-out-base state without changing permanent instructions
- [X] T016 Run `git diff --check` for `.agents/skills/catworld-parallel-coordinator/SKILL.md`, `docs/ARCHITECTURE.md`, `specs/033-sidecar-local-cleanup/`, and restored `AGENTS.md`, then record the result after all planned edits
- [X] T017 Rerun the complete `specs/033-sidecar-local-cleanup/validation/simulate-sidecar-cleanup.ps1` suite after the latest relevant change, then record `git status --short` and `git diff --name-only` for final scope/freshness review

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1** is required before any table case is implemented.
- **TO1 (Phase 2)** depends on Phase 1.
- **TO2 (Phase 3)** depends on Phase 1 and uses the eligibility state established by TO1.
- **TO3 (Phase 4)** depends on TO1 and TO2 because the journal records their states and operations.
- **Polish (Phase 5)** depends on all three outcomes.

### Technical Outcome Dependencies

- **TO1**: First verifiable increment; no dependency beyond the shared fixture.
- **TO2**: Requires TO1 eligibility semantics before destructive execution is allowed.
- **TO3**: Records TO1 eligibility and TO2 execution, so it follows both.

### Parallel Opportunities

- T004 can run in parallel with T003 after T002 establishes the eligibility vocabulary.
- T007 can run in parallel with T006 after T005 establishes the local-cleanup cases.
- T010 can run in parallel with T009 after T008 establishes the journal assertions.
- Core validation-script tasks remain sequential because they intentionally share one compact file and fixture.

---

## Parallel Example: Technical Outcome 2

```text
Task: "Add safe local cleanup procedure to .agents/skills/catworld-parallel-coordinator/SKILL.md"
Task: "Document the same approved procedure in docs/ARCHITECTURE.md"
```

---

## Implementation Strategy

### First Verifiable Increment

1. Build the shared temporary-Git fixture and table dispatcher.
2. Implement TO1's blocked/eligible cases and coordinator eligibility gate.
3. Run those two cases before adding destructive local behavior.

### Incremental Delivery

1. TO1 proves the final-merge gate.
2. TO2 adds ownership/cleanliness preflight and ordered local cleanup.
3. TO3 adds the durable local journal and prohibited-operation proof.
4. Final validation restores `AGENTS.md`, reruns all seven cases, checks scope/size, and runs `git diff --check`.

## Notes

- Do not create a runtime cleanup framework or second validation script.
- Do not copy prior sidecar end-to-end fixtures; consume their recorded evidence contracts.
- Do not mutate H2, `specs/032-final-coordinator-delivery/finalization.md`, remotes, PRs, issues, or comments.
- Delivery commit, push, and PR creation are handled by the active CatWorld issue workflow after every task and fresh validation pass.
