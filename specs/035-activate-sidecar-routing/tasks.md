# Tasks: Activate Controlled Sidecar Routing

**Input**: Design documents from `/specs/035-activate-sidecar-routing/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Required. Issue #261 and the plan require the complete manual routing matrix, all applicable #252-#259 focused sidecar regressions, stale-wording searches, sequential-skill isolation review, historical-path review, and Git whitespace checks.

**Organization**: Tasks are grouped by the three verifiable technical outcomes. TO1 owns the active routing implementation, TO2 aligns active sources and removes stale gates, and TO3 proves the sequential workflow remains isolated. Real dependencies are preserved even where file edits can be performed in parallel.

## Format: `[ID] [P?] [Trace] Description`

- **[P]**: Can run in parallel because it touches a different file and has no incomplete dependency.
- **[Trace]**: Maps the task to TO1, TO2, or TO3 from the feature specification.
- Every task names the exact repository path or validation path.

---

## Phase 1: Technical Outcome 1 - Controlled Active Routing (Priority: P1)

**Goal**: Activate explicit safe coordinator `parallel` routing while preserving every sequential and stop row.

**Verification**: All eight rows in `specs/035-activate-sidecar-routing/contracts/active-sidecar-routing.md` agree across active routing authorities; safe coordinator requests enter the sidecar coordinator skill, unsafe requests stop before downstream mutation, and protected guard cases remain unchanged.

- [X] T001 [P] [TO1] Replace the temporary #260/#272 gate with the exact controlled routing matrix and safe/unsafe coordinator outcomes in `AGENTS.md`, retaining the #220-#234 exclusion and general routing-authorized worktree boundary
- [X] T002 [P] [TO1] Replace fixture/future routing text with an outward explicit-coordinator `parallel` boundary only in `.agents/skills/catworld-implement-issue/SKILL.md`, without changing sequential workflow internals
- [X] T003 [P] [TO1] Activate the current general authorization predicate, metadata, classification, lifecycle wording, and fail-before-mutation unsafe stop in `.agents/skills/catworld-parallel-coordinator/SKILL.md` while preserving the accepted #260 two-phase barrier and lifecycle internals
- [X] T004 [P] [TO1] Remove the fixture-only handoff gate, align current prepared-child authorization/metadata, and preserve the permanent #220-#234 exclusion in `.agents/skills/catworld-parallel-child-implementation/SKILL.md`
- [X] T005 [P] [TO1] Generate current controlled coordinator execution-model wording rather than post-#261 future wording in `.agents/skills/speckit-taskstoissues/SKILL.md`
- [X] T006 [P] [TO1] Activate explicit safe coordinator routing and remove before/after-#261 gates in `.github/ISSUE_TEMPLATE/coordinator-parallel-planning.md`
- [X] T007 [TO1] Replace the obsolete dormant-activation assertion with current controlled-explicit and fail-closed routing assertions in `specs/032-final-coordinator-delivery/validation/simulate-final-coordinator-delivery.ps1`
- [X] T008 [TO1] Review and record all eight routing outcomes plus the #220-#234, ambiguous/multiple-issue, explicit-sequential, and unavailable-child-agent guard cases against `specs/035-activate-sidecar-routing/contracts/active-sidecar-routing.md` and the active sources named in `specs/035-activate-sidecar-routing/quickstart.md`

**Checkpoint**: Explicit safe coordinator `parallel` requests route to the sidecar coordinator; all other matrix rows and protected guards produce their required sequential or stop outcomes.

---

## Phase 2: Technical Outcome 2 - Coherent Active Sources (Priority: P2)

**Goal**: Remove fixture/future/adoption blockers from active workflow documentation while keeping accepted history historical.

**Verification**: The issue-required search and broader activation/fixture searches contain no operative future-only or #260/#272 gate; architecture and templates describe current controlled opt-in use; `specs/034-live-sidecar-dry-run/` remains unchanged.

- [X] T009 [P] [TO2] Rewrite current routing, lifecycle, historical-stage, child-delivery, and accepted-#260 wording in `docs/ARCHITECTURE.md` so general controlled sidecar use is active and pre-activation statements are clearly historical
- [X] T010 [P] [TO2] Replace future-activated runtime wording with current sidecar runtime guidance and make #258 build-out references historical in `.github/PULL_REQUEST_TEMPLATE/README.md`
- [X] T011 [TO2] Run the exact required stale-wording search and the broader fixture/activation searches from `specs/035-activate-sidecar-routing/quickstart.md`, then remove or make historical every operative match in `AGENTS.md`, `.agents/skills`, `docs/ARCHITECTURE.md`, and `.github`
- [X] T012 [TO2] Prove the temporary #260/#272/run-ID predicate is absent from all active paths and `specs/034-live-sidecar-dry-run/` has no diff against `origin/workflow/sidecar-buildout`

**Checkpoint**: Active sources are coherent for current controlled opt-in sidecar use, and historical dry-run evidence remains untouched.

---

## Phase 3: Technical Outcome 3 - Sequential Workflow Isolation (Priority: P1)

**Goal**: Prove `catworld-implement-issue` changed only at its routing boundary and retains its existing sequential implementation workflow byte-for-byte where required.

**Verification**: Base-relative unified and word diffs contain only routing/current-capability wording; all protected sequential sections compare equal after newline normalization; the legacy coordinator skill remains unchanged.

- [X] T013 [TO3] Review both base-relative diff forms for `.agents/skills/catworld-implement-issue/SKILL.md` and confirm every changed hunk is routing-boundary/current-capability wording only
- [X] T014 [TO3] Run the section-equivalence check from `specs/035-activate-sidecar-routing/quickstart.md` for Required Inputs, Repository Boundaries, Branch Preparation, Workflow, Stop Conditions, Completion Report, and Done When in `.agents/skills/catworld-implement-issue/SKILL.md`
- [X] T015 [TO3] Confirm `.agents/skills/catworld-orchestrate-coordinator-issue/SKILL.md` is unchanged and no sidecar lifecycle, artifacts, Git/worktree orchestration, fan-out, child execution, PR delivery, resume, finalization, or cleanup internals were added to `.agents/skills/catworld-implement-issue/SKILL.md`

**Checkpoint**: Sequential normal/direct-child/final-pass implementation remains unchanged; only explicit coordinator `parallel` routing leaves the skill.

---

## Phase 4: Polish & Cross-Cutting Validation

**Purpose**: Run all required fresh evidence, remove temporary plan-pointer state, and verify the final source map before delivery.

- [X] T016 [P] Parse all nine PowerShell validator/verifier files listed in `specs/035-activate-sidecar-routing/quickstart.md` and require zero AST errors
- [X] T017 [P] Run all #252 coordinator-artifact scenarios in both prescribed shells and all #253/#254 scenarios in Windows PowerShell using `specs/026-sidecar-coordinator-artifacts/validation/simulate-coordinator-artifact.ps1`, `specs/027-prepared-child-artifacts/validation/simulate-prepared-child-artifacts.ps1`, and `specs/028-sidecar-branch-worktree/validation/simulate-sidecar-branch-worktree.ps1`
- [X] T018 [P] Run every #255/#256 scenario in PowerShell 7 using `specs/029-dependency-layer-fanout/validation/simulate-dependency-layer-fanout.ps1` and `specs/030-sidecar-child-execution/validation/simulate-sidecar-child-execution.ps1`
- [X] T019 [P] Run every #257/#258 scenario in PowerShell 7 using `specs/031-merge-aware-sidecar-resume/validation/simulate-merge-aware-sidecar-resume.ps1` and `specs/032-final-coordinator-delivery/validation/simulate-final-coordinator-delivery.ps1`
- [X] T020 [P] Run the #259 seven-case temporary-fixture regression with `specs/033-sidecar-local-cleanup/validation/simulate-sidecar-cleanup.ps1` and confirm no real cleanup resource was touched
- [X] T021 Rerun the complete routing matrix, stale-wording searches, sequential-skill diff/equivalence checks, legacy-skill check, and historical `specs/034-live-sidecar-dry-run/` check after the latest relevant change using `specs/035-activate-sidecar-routing/quickstart.md`
- [X] T022 Remove only the temporary `SPECKIT START` / `SPECKIT END` managed plan pointer from `AGENTS.md` while preserving permanent #261 routing instructions
- [X] T023 Review `git status --short`, base-relative changed paths, and diff statistics against the source map in `specs/035-activate-sidecar-routing/plan.md`; justify or remove every unplanned surface and confirm no CatWorld product path changed
- [X] T024 Run `.specify/scripts/powershell/check-prerequisites.ps1 -Json -RequireTasks -IncludeTasks`, `git diff --check`, and the branch-base ancestry check from `specs/035-activate-sidecar-routing/quickstart.md`
- [X] T025 Rerun any evidence affected by late changes or mark it stale/not revalidated; require every issue-mandated check to be freshly passed before delivery

---

## Dependencies & Execution Order

### Phase Dependencies

- **TO1 (Phase 1)**: Begins immediately after approved planning; T008 depends on T001-T007.
- **TO2 (Phase 2)**: T009-T010 may start alongside independent TO1 file edits, but T011-T012 depend on all active-source wording edits.
- **TO3 (Phase 3)**: Depends on T002 and all later edits to the sequential skill; it must complete before final validation.
- **Polish (Phase 4)**: Depends on all implementation outcomes. T016-T020 may run in parallel on final source bytes; T021-T025 are ordered final gates.

### Technical Outcome Dependencies

- **TO1 (P1)**: Primary activation outcome; requires the accepted #260 baseline and approved #261 contract only.
- **TO2 (P2)**: Shares active sources with TO1 and completes after routing semantics are stable.
- **TO3 (P1)**: Verifies the bounded part of TO1 that changes the sequential skill; no additional implementation mechanism is introduced.

### Parallel Opportunities

- T001-T006 edit different active routing files and may run in parallel before T007-T008 integration.
- T009 and T010 edit different documentation/template files and may run in parallel.
- T016-T020 run independent validator groups against final bytes and may run in parallel if their temporary Git fixtures do not share paths.
- No search, scope, freshness, or final delivery gate is parallelized past a relevant late change.

---

## Parallel Example: Active Routing Sources

```text
Task: "Update top-level routing in AGENTS.md"
Task: "Update routing boundary only in .agents/skills/catworld-implement-issue/SKILL.md"
Task: "Activate authorization and fail-closed preflight in .agents/skills/catworld-parallel-coordinator/SKILL.md"
Task: "Align prepared child authorization in .agents/skills/catworld-parallel-child-implementation/SKILL.md"
Task: "Update generated coordinator wording in .agents/skills/speckit-taskstoissues/SKILL.md"
Task: "Update .github/ISSUE_TEMPLATE/coordinator-parallel-planning.md"
```

---

## Implementation Strategy

### First Verifiable Increment

1. Complete T001-T007 across the active routing authorities and affected regression assertion.
2. Complete T008 and verify all eight routing rows plus protected guards.
3. Stop on any mismatch before documentation convergence.

### Incremental Delivery

1. Activate the route and verify the exact matrix (TO1).
2. Align architecture/templates and eliminate stale active gates while preserving history (TO2).
3. Prove sequential implementation isolation (TO3).
4. Run all 82 current regression scenarios/cases, required searches, scope review, and final freshness gates.

## Notes

- [P] tasks operate on different files or independent temporary validation fixtures.
- Historical issue artifacts may describe their issue-time future state; `specs/034-live-sidecar-dry-run/` is explicitly immutable.
- Current safety restrictions, the #260 two-phase barrier, user-owned merges, and fail-closed preflight remain authoritative.
- Do not add tasks for live dry-run execution, cleanup, branch deletion, issue mutation, merge, auto-merge, force-push, or public comments.
- Commit, push, and the one ready PR are handled by the active CatWorld delivery workflow after every task and validation gate completes.
