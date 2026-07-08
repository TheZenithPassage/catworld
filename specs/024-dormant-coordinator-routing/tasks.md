# Tasks: Dormant Coordinator Routing

**Input**: Design documents from `specs/024-dormant-coordinator-routing/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: No application tests are required because this feature changes workflow documentation only. Required evidence is targeted search, manual routing review, legacy-file diff confirmation, and whitespace validation.

**Organization**: Tasks are grouped by verifiable technical outcome.

## Phase 1: Technical Outcome 1 - Keep Legacy Orchestration Dormant (Priority: P1)

**Goal**: No active routing source invokes `.agents/skills/catworld-orchestrate-coordinator-issue/SKILL.md` for real coordinator execution.

**Verification**: The required `rg` command shows no active routing reference to the dormant legacy skill, and direct diff review shows the dormant legacy file is unchanged.

- [X] T001 [TO1] Review legacy orchestration references and neutralize any active routing use in `AGENTS.md`, `.agents/skills/catworld-implement-issue/SKILL.md`, `.agents/skills/catworld-parallel-coordinator/SKILL.md`, `.agents/skills/catworld-parallel-child-implementation/SKILL.md`, `.agents/skills/speckit-taskstoissues/SKILL.md`, `docs/ARCHITECTURE.md`, `.github/ISSUE_TEMPLATE/coordinator-parallel-planning.md`, `.github/ISSUE_TEMPLATE/focused-child-issue.md`, `.github/PULL_REQUEST_TEMPLATE/README.md`, `.github/PULL_REQUEST_TEMPLATE/sidecar-child-to-coordinator.md`, and `.github/PULL_REQUEST_TEMPLATE/sidecar-final-coordinator-to-main.md`
- [X] T002 [TO1] Confirm `.agents/skills/catworld-orchestrate-coordinator-issue/SKILL.md` remains unmodified by checking `git diff -- .agents/skills/catworld-orchestrate-coordinator-issue/SKILL.md`

**Checkpoint**: Remaining legacy orchestration references are dormant, historical, or explicitly non-routing.

---

## Phase 2: Technical Outcome 2 - Preserve Sequential Default Routing (Priority: P1)

**Goal**: Normal issues, direct child issues, and closed-child coordinator final passes still use the current sequential `catworld-implement-issue` workflow.

**Verification**: Manual review confirms active shorthand routing still points normal and direct child issues to `catworld-implement-issue`, with existing coordinator open-child and closed-child guardrails preserved.

- [X] T003 [TO2] Update `AGENTS.md` shorthand routing text only as needed to preserve sequential defaults and state that explicit eligible coordinator `parallel` routing remains future-facing until #261 activates the sidecar coordinator path
- [X] T004 [TO2] Update `.agents/skills/catworld-implement-issue/SKILL.md` shorthand routing text only as needed to preserve sequential defaults and state that explicit eligible coordinator `parallel` routing remains future-facing until #261 activates the sidecar coordinator path
- [X] T005 [P] [TO2] Review `.agents/skills/speckit-taskstoissues/SKILL.md`, `.github/ISSUE_TEMPLATE/coordinator-parallel-planning.md`, `.github/ISSUE_TEMPLATE/focused-child-issue.md`, and `.github/PULL_REQUEST_TEMPLATE/README.md` for activation wording that contradicts the sequential default before #261

**Checkpoint**: Sequential routing remains the active default and no active guidance enables sidecar product use before #261.

---

## Phase 3: Technical Outcome 3 - Neutralize Sidecar Contradictions (Priority: P1)

**Goal**: Sidecar guidance does not require automatic seed-first behavior, does not make child PRs close child issues, and does not let child agents invent shared contracts or plan product behavior.

**Verification**: Required search and manual review confirm remaining `seed`, `Closes #<child`, `close only that concrete child`, and `parallel mode` references are consistent with issue #250.

- [X] T006 [TO3] Update `.agents/skills/catworld-parallel-coordinator/SKILL.md` to remove or neutralize active automatic seed-first guidance and active instructions that allow child agents to invent seed, foundation, or shared-contract child issues
- [X] T007 [TO3] Update `.agents/skills/catworld-parallel-child-implementation/SKILL.md` to remove or neutralize active guidance that lets child agents invent shared contracts, plan product behavior, or close child issues from sidecar child PRs
- [X] T008 [P] [TO3] Update `.github/PULL_REQUEST_TEMPLATE/sidecar-child-to-coordinator.md` and `.github/PULL_REQUEST_TEMPLATE/sidecar-final-coordinator-to-main.md` to avoid child-issue closing language for sidecar child PR flows
- [X] T009 [P] [TO3] Update `docs/ARCHITECTURE.md` to align sidecar coordinator documentation with dormant legacy routing, #261 future activation, no automatic seed-first behavior, and no child-agent product or shared-contract invention

**Checkpoint**: Sidecar routing remains inactive for product work before #261 and no active sidecar guidance contradicts issue #250.

---

## Phase 4: Polish & Cross-Cutting Concerns

**Purpose**: Final validation and scope review required by issue #250 and the implementation plan.

- [X] T010 Run `rg -n "catworld-orchestrate-coordinator-issue|seed|Closes #<child|close only that concrete child|parallel mode" AGENTS.md .agents/skills docs/ARCHITECTURE.md .github` and manually classify remaining matches
- [X] T011 Manually review `AGENTS.md` and `.agents/skills/catworld-implement-issue/SKILL.md` to confirm normal issue and direct child issue routing still point to `catworld-implement-issue`
- [X] T012 Manually review `AGENTS.md`, `.agents/skills/catworld-parallel-coordinator/SKILL.md`, `.agents/skills/catworld-parallel-child-implementation/SKILL.md`, `.agents/skills/speckit-taskstoissues/SKILL.md`, `docs/ARCHITECTURE.md`, and `.github/ISSUE_TEMPLATE/coordinator-parallel-planning.md` to confirm sidecar parallel is not activated before #261
- [X] T013 Run `git diff -- .agents/skills/catworld-orchestrate-coordinator-issue/SKILL.md` to confirm the dormant legacy file has no diff
- [X] T014 Run `git diff --check` to confirm changed Markdown has no whitespace errors
- [X] T015 Review `git status --short` and `git diff --name-only` against the plan source map to confirm no unplanned surfaces were changed

---

## Dependencies & Execution Order

### Phase Dependencies

- **Technical Outcome 1 (Phase 1)**: Start first to identify and protect the dormant legacy boundary.
- **Technical Outcome 2 (Phase 2)**: Depends on Phase 1 context and preserves active sequential routing.
- **Technical Outcome 3 (Phase 3)**: Depends on Phase 1 context and can proceed after Phase 2 wording direction is clear.
- **Polish (Phase 4)**: Depends on all technical outcomes being complete.

### Technical Outcome Dependencies

- **TO1**: No dependencies.
- **TO2**: Depends on TO1 legacy-routing classification.
- **TO3**: Depends on TO1 legacy-routing classification and must remain consistent with TO2 sequential defaults.

### Parallel Opportunities

- T005 can run in parallel with T003/T004 after TO1 classification.
- T008 and T009 can run in parallel after T006/T007 wording direction is clear.
- Final manual reviews T011 and T012 can run in parallel before T013-T015.

## Parallel Example: Technical Outcome 3

```text
Task: "Update .github/PULL_REQUEST_TEMPLATE/sidecar-child-to-coordinator.md and .github/PULL_REQUEST_TEMPLATE/sidecar-final-coordinator-to-main.md to avoid child-issue closing language for sidecar child PR flows"
Task: "Update docs/ARCHITECTURE.md to align sidecar coordinator documentation with dormant legacy routing, #261 future activation, no automatic seed-first behavior, and no child-agent product or shared-contract invention"
```

## Implementation Strategy

### First Verifiable Increment

1. Complete Phase 1.
2. Run the legacy-reference portion of the required `rg` review.
3. Confirm the dormant legacy file remains unchanged.

### Incremental Delivery

1. Complete TO1 and validate the dormant legacy boundary.
2. Complete TO2 and validate sequential routing remains default.
3. Complete TO3 and validate sidecar contradictions are neutralized.
4. Run final validation commands after the latest relevant text change.

## Notes

- All tasks must leave `.agents/skills/catworld-orchestrate-coordinator-issue/SKILL.md` untouched unless explicit user approval is obtained.
- Do not add application tests, migrations, runtime code, branch/worktree orchestration, or product behavior changes for this feature.
