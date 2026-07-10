# Tasks: Merge-Aware Sidecar Resume and Next-Layer Progression

**Input**: Design documents from `specs/031-merge-aware-sidecar-resume/`

**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/

**Tests**: Required by issue #257 and the validation evidence plan. Evidence is focused on local PowerShell/Git simulations, resume state simulations, source review, changed-file review, and `git diff --check`.

**Organization**: Tasks are grouped by dependency-driven verifiable technical outcomes for technical/enabling workflow work.

## Format: `[ID] [P?] [Trace] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Trace]**: Which technical outcome this task belongs to
- Include exact file paths in descriptions

## Phase 1: Setup

**Purpose**: Add the shared validation fixture used by all #257 outcome checks.

- [X] T001 Create `specs/031-merge-aware-sidecar-resume/validation/simulate-merge-aware-sidecar-resume.ps1` with temporary Git fixture setup, assertion helpers, resume evidence model, coordinator refresh helpers, child refresh helpers, validation freshness model, dependency-layer status model, and scenario dispatcher

---

## Phase 2: Foundational

**Purpose**: Align the sidecar source-of-truth surfaces before outcome-specific behavior is filled in.

- [X] T002 Update `.agents/skills/catworld-parallel-coordinator/SKILL.md` introduction, lifecycle, Git execution, resume state, preflight output, and validation expectations to include issue #257 merge-aware resume and next-layer progression scope while preserving the #261 dormant-routing gate
- [X] T003 Update `.agents/skills/catworld-parallel-child-implementation/SKILL.md` required handoff inputs, handoff validation, implementation workflow, validation reporting, stop conditions, and validation expectations so child handoffs consume refreshed coordinator state and stale-validation evidence from #257
- [X] T004 Update `docs/ARCHITECTURE.md` sidecar workflow documentation to include issue #257 remote coordinator refresh, local coordinator refresh, active child refresh, integration marking, validation staleness, and next-layer progression rules
- [X] T005 Update `specs/031-merge-aware-sidecar-resume/contracts/merge-aware-sidecar-resume.md` if implementation details require wording refinements, without changing approved #257 scope

**Checkpoint**: Source-of-truth surfaces name #257 resume behavior and preserve existing sequential and dormant-routing boundaries.

---

## Phase 3: Technical Outcome 1 - Current Evidence Resume (Priority: P1)

**Goal**: A resumed sidecar coordinator run rebuilds its source of truth from current evidence and stops on evidence mismatch or missing evidence.

**Verification**: Run the `evidence-mismatch` simulation scenario and review sidecar coordinator source text for full evidence re-read, private-context prohibition, and mismatch stops.

### Evidence for Technical Outcome 1

- [X] T006 [TO1] Add resume evidence completeness, missing evidence, and `evidence-mismatch` assertions to `specs/031-merge-aware-sidecar-resume/validation/simulate-merge-aware-sidecar-resume.ps1`

### Implementation for Technical Outcome 1

- [X] T007 [TO1] Update `.agents/skills/catworld-parallel-coordinator/SKILL.md` to require re-reading coordinator issue, child issues, child PRs, remote coordinator branch, local coordinator branch/worktree, active child branch, artifacts, validation freshness, blockers, and cleanup approval before any resume decision
- [X] T008 [TO1] Update `.agents/skills/catworld-parallel-coordinator/SKILL.md` to prohibit private conversation context as resume source of truth and to stop when current evidence conflicts with recorded coordinator artifact state
- [X] T009 [TO1] Update `.agents/skills/catworld-parallel-coordinator/SKILL.md` preflight output and blocker reporting so missing artifacts, missing branch state, stale evidence, unresolved human-only decisions, and unsafe dependency state are reported before continuation
- [X] T010 [TO1] Update `.agents/skills/catworld-parallel-child-implementation/SKILL.md` to require child handoffs to include the coordinator's current re-read evidence and to stop when child resume evidence conflicts with current GitHub or repository state
- [X] T011 [TO1] Update `docs/ARCHITECTURE.md` to mirror current-evidence resume, artifact mismatch stops, and private-context boundaries for sidecar coordinator and child handoffs
- [X] T012 [TO1] Run `.\specs\031-merge-aware-sidecar-resume\validation\simulate-merge-aware-sidecar-resume.ps1 -Scenario evidence-mismatch` and verify conflicting or missing current evidence blocks resume before refresh, integration marking, child launch, PR merge, issue mutation, or cleanup

**Checkpoint**: TO1 is objectively verified by the evidence mismatch simulation plus source review.

---

## Phase 4: Technical Outcome 2 - Remote Coordinator and Active Child Refresh (Priority: P2)

**Goal**: Resume refreshes local coordinator state from the remote coordinator branch before active child refresh, using fast-forward or normal merge only.

**Verification**: Run `remote-refresh-order`, `active-child-refresh`, `unexpected-local-changes`, and `unsafe-divergence` simulation scenarios and review source text for prohibited Git operations.

### Evidence for Technical Outcome 2

- [X] T013 [TO2] Add `remote-refresh-order`, `active-child-refresh`, `unexpected-local-changes`, and `unsafe-divergence` scenarios to `specs/031-merge-aware-sidecar-resume/validation/simulate-merge-aware-sidecar-resume.ps1`

### Implementation for Technical Outcome 2

- [X] T014 [TO2] Update `.agents/skills/catworld-parallel-coordinator/SKILL.md` Git execution rules so resume fetches the remote coordinator branch and updates local coordinator branch/worktree from that remote branch before child integration marking, active child refresh, or next-layer launch
- [X] T015 [TO2] Update `.agents/skills/catworld-parallel-coordinator/SKILL.md` to allow local coordinator refresh by fast-forward or normal merge only and to stop on unexpected local changes, unsafe divergence, missing branch state, stale evidence, or conflicts
- [X] T016 [TO2] Update `.agents/skills/catworld-parallel-coordinator/SKILL.md` to require still-active child branches/worktrees to refresh from the updated local coordinator branch by normal merge only when needed
- [X] T017 [TO2] Update `.agents/skills/catworld-parallel-child-implementation/SKILL.md` to consume refreshed coordinator state, last incorporated coordinator branch state, and active-child refresh status in handoff validation and final reporting
- [X] T018 [TO2] Update `docs/ARCHITECTURE.md` to document remote coordinator fetch, local coordinator refresh, active child normal-merge refresh, and prohibited rebase/force/history-rewrite behavior after child PR merges
- [X] T019 [TO2] Run `.\specs\031-merge-aware-sidecar-resume\validation\simulate-merge-aware-sidecar-resume.ps1 -Scenario remote-refresh-order` and `.\specs\031-merge-aware-sidecar-resume\validation\simulate-merge-aware-sidecar-resume.ps1 -Scenario active-child-refresh` and verify coordinator refresh precedes child refresh and child refresh uses normal merge only
- [X] T020 [TO2] Run `.\specs\031-merge-aware-sidecar-resume\validation\simulate-merge-aware-sidecar-resume.ps1 -Scenario unexpected-local-changes` and `.\specs\031-merge-aware-sidecar-resume\validation\simulate-merge-aware-sidecar-resume.ps1 -Scenario unsafe-divergence` and verify unsafe coordinator state blocks refresh without rebase, force-push, force-with-lease, history rewriting, local `main` updates, PR merges, or GitHub issue mutation

**Checkpoint**: TO2 is objectively verified by refresh-order, active-child-refresh, and blocker simulations plus source review.

---

## Phase 5: Technical Outcome 3 - Integration State and Next-Layer Progression (Priority: P3)

**Goal**: Resume recomputes child integration and dependency-layer state, marks affected validation stale, and continues only with dependency-ready next-layer children.

**Verification**: Run `resume-states`, `validation-staleness`, and `prohibited-operations` simulation scenarios and review coordinator artifact/status text for integrated, active, blocked, pending, and ready-next-layer states.

### Evidence for Technical Outcome 3

- [X] T021 [TO3] Add `resume-states`, `validation-staleness`, and `prohibited-operations` scenarios to `specs/031-merge-aware-sidecar-resume/validation/simulate-merge-aware-sidecar-resume.ps1`

### Implementation for Technical Outcome 3

- [X] T022 [TO3] Update `.agents/skills/catworld-parallel-coordinator/SKILL.md` to detect child PRs merged into the remote coordinator branch and mark children integrated only after local coordinator state is refreshed from that remote branch
- [X] T023 [TO3] Update `.agents/skills/catworld-parallel-coordinator/SKILL.md` dependency-layer rules to recompute completed, active, blocked, pending, waiting-for-dependency-merge, and ready-next-layer child states after observed merges and refresh
- [X] T024 [TO3] Update `.agents/skills/catworld-parallel-coordinator/SKILL.md` to launch a next dependency-ready layer only after hard dependencies are integrated into the updated local coordinator branch and no shared-contract, validation, human-only, conflict, unsafe dependency, or child-agent capability blocker remains
- [X] T025 [TO3] Update `.agents/skills/catworld-parallel-coordinator/SKILL.md` and `.agents/skills/catworld-parallel-child-implementation/SKILL.md` validation reporting so evidence affected by coordinator refresh or active child refresh is stale until rerun and cannot support ready status
- [X] T026 [TO3] Update `docs/ARCHITECTURE.md` to document child integration marking, dependency-layer recomputation, validation staleness, ready-next-layer states, and no sequential fallback when resume is unsafe
- [X] T027 [TO3] Run `.\specs\031-merge-aware-sidecar-resume\validation\simulate-merge-aware-sidecar-resume.ps1 -Scenario resume-states` and verify completed, active, blocked, pending, waiting-for-dependency-merge, and ready-next-layer child states are recorded with reasons
- [X] T028 [TO3] Run `.\specs\031-merge-aware-sidecar-resume\validation\simulate-merge-aware-sidecar-resume.ps1 -Scenario validation-staleness` and verify affected validation is marked stale until rerun and is not summarized as passed
- [X] T029 [TO3] Run `.\specs\031-merge-aware-sidecar-resume\validation\simulate-merge-aware-sidecar-resume.ps1 -Scenario prohibited-operations` and verify rebase, force-push, force-with-lease, history rewriting, local `main` updates, GitHub issue mutation, PR merges, resource deletion, cleanup execution, and silent sequential fallback remain prohibited

**Checkpoint**: TO3 is objectively verified by resume-state, validation-staleness, and prohibited-operation simulations plus source review.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final validation and scope review required by the active workflow.

- [X] T030 Run `Select-String -Path .agents\skills\catworld-parallel-coordinator\SKILL.md -Pattern "remote coordinator branch|local coordinator|active child|integrated|ready-next-layer|private conversation|stale|force-with-lease|sequential fallback"` and confirm merge-aware resume rules are present
- [X] T031 Run `Select-String -Path .agents\skills\catworld-parallel-child-implementation\SKILL.md,docs\ARCHITECTURE.md -Pattern "re-read|refresh|remote coordinator|active child|stale|integrated|Related to|coordinator branch"` and confirm child handoff and architecture resume rules are present
- [X] T032 Run `git diff --name-only -- .agents/skills/catworld-implement-issue/SKILL.md` and confirm the normal sequential implementation skill is unchanged
- [X] T033 Review changed files against `specs/031-merge-aware-sidecar-resume/plan.md` source map and confirm no backend, frontend, migration, real sidecar branch/worktree, real PR merge, GitHub issue mutation, normal sequential workflow, or legacy coordinator orchestration file was changed
- [X] T034 Run `git diff --check`
- [X] T035 Rerun affected validation after any late edits to `.agents/skills/catworld-parallel-coordinator/SKILL.md`, `.agents/skills/catworld-parallel-child-implementation/SKILL.md`, `docs/ARCHITECTURE.md`, `specs/031-merge-aware-sidecar-resume/contracts/merge-aware-sidecar-resume.md`, or `specs/031-merge-aware-sidecar-resume/validation/simulate-merge-aware-sidecar-resume.ps1`, or report stale/not-revalidated checks explicitly

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies.
- **Foundational (Phase 2)**: Depends on Phase 1.
- **TO1 (Phase 3)**: Depends on foundational source alignment.
- **TO2 (Phase 4)**: Depends on TO1's current-evidence resume and mismatch blockers.
- **TO3 (Phase 5)**: Depends on TO1 evidence safety and TO2 coordinator/child refresh ordering.
- **Polish (Phase 6)**: Depends on all technical outcomes.

### Technical Outcome Dependencies

- **TO1 (P1)**: Establishes current evidence as the resume source of truth and blocks mismatches.
- **TO2 (P2)**: Builds on TO1 to refresh local coordinator and active child state safely after observed child PR merges.
- **TO3 (P3)**: Builds on TO1 and TO2 to mark integrated children, stale validation, and ready-next-layer state.

### Within Each Technical Outcome

- Implement source-of-truth text and simulation behavior before running that outcome's validation command.
- Complete and validate each technical outcome before treating it done.
- Rerun affected evidence after late edits.

### Parallel Opportunities

- Phase 1 and Phase 2 touch shared validation/source-of-truth files and should be sequential.
- TO1, TO2, and TO3 intentionally share `.agents/skills/catworld-parallel-coordinator/SKILL.md`, `.agents/skills/catworld-parallel-child-implementation/SKILL.md`, and `docs/ARCHITECTURE.md`; implement them sequentially to avoid conflicting edits.
- Final source reviews T030, T031, and T032 may run in parallel after implementation is complete.

---

## Parallel Example: Final Reviews

```powershell
Task: "Run coordinator merge-aware resume source review in .agents/skills/catworld-parallel-coordinator/SKILL.md"
Task: "Run child handoff and architecture resume source review in .agents/skills/catworld-parallel-child-implementation/SKILL.md and docs/ARCHITECTURE.md"
Task: "Run normal sequential skill unchanged check for .agents/skills/catworld-implement-issue/SKILL.md"
```

---

## Implementation Strategy

### First Verifiable Increment

1. Complete Phase 1 and Phase 2.
2. Complete Phase 3 for TO1.
3. Stop and validate the `evidence-mismatch` simulation.

### Incremental Delivery

1. Add TO1 current-evidence resume and validate.
2. Add TO2 remote coordinator and active child refresh ordering and validate.
3. Add TO3 integration state, validation staleness, and next-layer progression and validate.
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
- Do not perform real sidecar child PR operations, PR merges, GitHub issue mutations, public comments, force-pushes, branch cleanup, remote branch deletion, or remote cleanup as implementation validation tasks.

---

## Phase 7: PR Blocker Validation Follow-Up

**Purpose**: Complete blocker validation coverage required by issue #257 and PR #269 review.

- [X] T036 [TO1] Add `missing-branch-state` to `specs/031-merge-aware-sidecar-resume/validation/simulate-merge-aware-sidecar-resume.ps1` to prove missing or unreadable remote coordinator, local coordinator, and active-child branch/worktree state blocks before fetch, refresh, integration marking, active-child refresh, next-layer launch, issue mutation, cleanup, PR merge, or sequential fallback
- [X] T037 [TO3] Add `human-only-blocker` to `specs/031-merge-aware-sidecar-resume/validation/simulate-merge-aware-sidecar-resume.ps1` to prove unresolved human-only decisions preserve blocker category, evidence, affected scope, and required human decision while preventing next-layer launch and sequential fallback
- [X] T038 [TO3] Add `unsafe-dependency-state` to `specs/031-merge-aware-sidecar-resume/validation/simulate-merge-aware-sidecar-resume.ps1` to prove dependent child readiness requires each hard dependency commit to be integrated into the refreshed local coordinator branch, not merely represented by issue or PR metadata
- [X] T039 Update `specs/031-merge-aware-sidecar-resume/spec.md`, `specs/031-merge-aware-sidecar-resume/contracts/merge-aware-sidecar-resume.md`, and `specs/031-merge-aware-sidecar-resume/quickstart.md` so scenario and evidence lists match the implemented blocker validation
- [X] T040 Run every existing scenario plus `missing-branch-state`, `human-only-blocker`, `unsafe-dependency-state`, `git diff --check`, and `git diff --cached --check`, then manually confirm no issue mutation, PR merge, retargeting, cleanup, product change, sequential fallback, or protected workflow file change occurred
