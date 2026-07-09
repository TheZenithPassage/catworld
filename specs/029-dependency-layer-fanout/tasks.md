# Tasks: Dependency-Layer Fan-Out and Child Handoffs

**Input**: Design documents from `specs/029-dependency-layer-fanout/`

**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/

**Tests**: Required by issue #255 and the validation evidence plan. Evidence is focused on local PowerShell simulations, source review, handoff content review, changed-file review, and `git diff --check`.

**Organization**: Tasks are grouped by dependency-driven verifiable technical outcomes for technical/enabling workflow work.

## Format: `[ID] [P?] [Trace] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Trace]**: Which technical outcome this task belongs to
- Include exact file paths in descriptions

## Phase 1: Setup

**Purpose**: Add the shared validation fixture used by all #255 outcome checks.

- [X] T001 Create `specs/029-dependency-layer-fanout/validation/simulate-dependency-layer-fanout.ps1` with shared fixture data, assertion helpers, dependency-layer model, launch-status model, and handoff-content helpers

---

## Phase 2: Foundational

**Purpose**: Align the sidecar source-of-truth surfaces before outcome-specific behavior is filled in.

- [X] T002 Update `.agents/skills/catworld-parallel-coordinator/SKILL.md` introduction, lifecycle summary, artifact status expectations, and validation expectations to include issue #255 fan-out and child handoff scope while preserving the #261 dormant-routing gate
- [X] T003 Update `docs/ARCHITECTURE.md` sidecar workflow documentation to include issue #255, one-layer fan-out readiness, child-agent capability stopping, and coordinator artifact launch-status vocabulary
- [X] T004 Update `specs/029-dependency-layer-fanout/contracts/dependency-layer-fanout.md` if implementation details require wording refinements, without changing approved #255 scope

**Checkpoint**: Source-of-truth surfaces name #255 fan-out and preserve existing sequential and dormant-routing boundaries.

---

## Phase 3: Technical Outcome 1 - First Dependency-Ready Layer Fan-Out (Priority: P1)

**Goal**: A valid future sidecar coordinator run launches only the first dependency-ready layer and records later layers as pending or waiting for dependency merges.

**Verification**: Run the `independent` and `hard-dependencies` simulation scenarios and review coordinator source text for one-layer launch rules.

### Evidence for Technical Outcome 1

- [X] T005 [TO1] Add `independent` and `hard-dependencies` scenarios to `specs/029-dependency-layer-fanout/validation/simulate-dependency-layer-fanout.ps1`

### Implementation for Technical Outcome 1

- [X] T006 [TO1] Update `.agents/skills/catworld-parallel-coordinator/SKILL.md` dependency-layer planning and child launch state to build layers from child dependencies, conflict risks, shared contract state, prepared artifact state, branch/worktree state, and current coordinator branch state
- [X] T007 [TO1] Update `.agents/skills/catworld-parallel-coordinator/SKILL.md` to launch at most the first dependency-ready layer and keep hard-dependent later layers waiting until dependency child PRs are merged into the coordinator branch
- [X] T008 [TO1] Update `docs/ARCHITECTURE.md` to mirror the first-layer-only fan-out rule and dependency-merge wait behavior
- [X] T009 [TO1] Run `.\specs\029-dependency-layer-fanout\validation\simulate-dependency-layer-fanout.ps1 -Scenario independent` and verify three child handoffs are produced for one layer
- [X] T010 [TO1] Run `.\specs\029-dependency-layer-fanout\validation\simulate-dependency-layer-fanout.ps1 -Scenario hard-dependencies` and verify only the first layer is launched while later children are pending or waiting for dependency merges

**Checkpoint**: TO1 is objectively verified by the two fan-out simulations and source review.

---

## Phase 4: Technical Outcome 2 - Blocker And Capability Stops (Priority: P2)

**Goal**: Fan-out stops or blocks affected children when prerequisites, shared-contract readiness, conflict-risk resolution, worktree state, or child-agent capability is missing.

**Verification**: Run the `shared-contract-blocker` and `unavailable-child-agent` simulation scenarios and review coordinator text for no sequential fallback.

### Evidence for Technical Outcome 2

- [X] T011 [TO2] Add `shared-contract-blocker` and `unavailable-child-agent` scenarios to `specs/029-dependency-layer-fanout/validation/simulate-dependency-layer-fanout.ps1`

### Implementation for Technical Outcome 2

- [X] T012 [TO2] Update `.agents/skills/catworld-parallel-coordinator/SKILL.md` launch readiness rules to require prepared child artifacts, shared contract, branch/worktree context, validation requirements, PR target rules, and out-of-scope boundaries before child launch
- [X] T013 [TO2] Update `.agents/skills/catworld-parallel-coordinator/SKILL.md` to stop on unavailable child-agent/subagent capability and explicitly prohibit sequential fallback
- [X] T014 [TO2] Update `docs/ARCHITECTURE.md` to document shared-contract blockers, non-mechanical conflict blockers, missing-prerequisite blockers, and unavailable child-agent capability behavior
- [X] T015 [TO2] Run `.\specs\029-dependency-layer-fanout\validation\simulate-dependency-layer-fanout.ps1 -Scenario shared-contract-blocker` and verify affected fan-out stops without unsafe launch
- [X] T016 [TO2] Run `.\specs\029-dependency-layer-fanout\validation\simulate-dependency-layer-fanout.ps1 -Scenario unavailable-child-agent` and verify the workflow reports a capability blocker without sequential fallback

**Checkpoint**: TO2 is objectively verified by blocker/capability simulations and source review.

---

## Phase 5: Technical Outcome 3 - Exact Prepared Child Handoffs (Priority: P3)

**Goal**: Each launched child agent receives exactly one child issue and a complete prepared handoff that matches the sidecar child skill requirements.

**Verification**: Run the `handoff-content` simulation scenario and review child/coordinator skill text for one-child scope and prohibited child actions.

### Evidence for Technical Outcome 3

- [X] T017 [TO3] Add `handoff-content` scenario to `specs/029-dependency-layer-fanout/validation/simulate-dependency-layer-fanout.ps1`

### Implementation for Technical Outcome 3

- [X] T018 [TO3] Update `.agents/skills/catworld-parallel-coordinator/SKILL.md` child handoff and child-agent launch section to construct exactly one prepared handoff per launched child with coordinator context, child issue body, prepared `spec.md`, `plan.md`, `tasks.md`, shared contract, dependency layer, branch/worktree context, validation requirements, PR target rules, and out-of-scope boundaries
- [X] T019 [TO3] Update `.agents/skills/catworld-parallel-coordinator/SKILL.md` to record launched, blocked, pending, and waiting-for-dependency-merge child statuses with clear non-launch reasons in the coordinator artifact
- [X] T020 [TO3] Update `.agents/skills/catworld-parallel-child-implementation/SKILL.md` if needed so required handoff inputs explicitly match the #255 prepared handoff and continue to forbid regeneration, sibling scope, issue mutation, and `main` targets
- [X] T021 [TO3] Update `docs/ARCHITECTURE.md` to document exact prepared child handoff contents and one-child scope
- [X] T022 [TO3] Run `.\specs\029-dependency-layer-fanout\validation\simulate-dependency-layer-fanout.ps1 -Scenario handoff-content` and verify required handoff fields and child prohibitions are present
- [X] T023 [TO3] Review `.agents/skills/catworld-parallel-child-implementation/SKILL.md` against the sample handoff output to confirm the handoff satisfies required sidecar child inputs

**Checkpoint**: TO3 is objectively verified by handoff simulation and sidecar child skill review.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final validation and scope review required by the active workflow.

- [X] T024 Run `Select-String -Path .agents\skills\catworld-parallel-coordinator\SKILL.md,docs\ARCHITECTURE.md -Pattern "first dependency-ready layer|waiting-for-dependency-merge|child-agent|sequential fallback|shared-contract blocker"` and confirm the expected fan-out, blocker, and capability rules are present
- [X] T025 Run `Select-String -Path .agents\skills\catworld-parallel-child-implementation\SKILL.md -Pattern "exactly one child issue|regenerate|target .*main|GitHub issue mutation"` and confirm child handoff boundaries remain present
- [X] T026 Review changed files against `specs/029-dependency-layer-fanout/plan.md` source map and confirm no backend, frontend, migration, real sidecar branch/worktree, PR operation, GitHub issue mutation, normal sequential workflow, or legacy coordinator orchestration file was changed
- [X] T027 Run `git diff --check`
- [X] T028 Rerun affected validation after any late edits to `.agents/skills/catworld-parallel-coordinator/SKILL.md`, `.agents/skills/catworld-parallel-child-implementation/SKILL.md`, `docs/ARCHITECTURE.md`, `specs/029-dependency-layer-fanout/contracts/dependency-layer-fanout.md`, or `specs/029-dependency-layer-fanout/validation/simulate-dependency-layer-fanout.ps1`, or report stale/not-revalidated checks explicitly

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies.
- **Foundational (Phase 2)**: Depends on Phase 1.
- **TO1 (Phase 3)**: Depends on foundational source alignment.
- **TO2 (Phase 4)**: Depends on TO1's launch-status and dependency-layer vocabulary.
- **TO3 (Phase 5)**: Depends on TO1 and TO2 readiness/status vocabulary.
- **Polish (Phase 6)**: Depends on all technical outcomes.

### Technical Outcome Dependencies

- **TO1 (P1)**: Establishes dependency-layer launch behavior and status vocabulary.
- **TO2 (P2)**: Builds on TO1 launch readiness to define stop and blocker behavior.
- **TO3 (P3)**: Builds on TO1/TO2 launch eligibility to define exact child handoffs.

### Within Each Technical Outcome

- Implement source-of-truth text and simulation behavior before running that outcome's validation command.
- Complete and validate each technical outcome before treating it done.
- Rerun affected evidence after late edits.

### Parallel Opportunities

- Phase 1 and Phase 2 touch overlapping source-of-truth files and should be sequential.
- TO1, TO2, and TO3 intentionally share `.agents/skills/catworld-parallel-coordinator/SKILL.md` and `docs/ARCHITECTURE.md`; implement them sequentially to avoid conflicting edits.
- Final source reviews T024 and T025 may run in parallel after implementation is complete.

---

## Parallel Example: Final Reviews

```powershell
Task: "Run coordinator/architecture fan-out source review in .agents/skills/catworld-parallel-coordinator/SKILL.md and docs/ARCHITECTURE.md"
Task: "Run child handoff boundary source review in .agents/skills/catworld-parallel-child-implementation/SKILL.md"
```

---

## Implementation Strategy

### First Verifiable Increment

1. Complete Phase 1 and Phase 2.
2. Complete Phase 3 for TO1.
3. Stop and validate `independent` and `hard-dependencies` simulations.

### Incremental Delivery

1. Add TO1 first-layer fan-out and validate.
2. Add TO2 blocker/capability stops and validate.
3. Add TO3 exact handoffs and validate.
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
- Do not perform real child-agent launches, PR operations, GitHub issue mutations, public comments, force-pushes, branch cleanup, or remote cleanup as implementation tasks.
