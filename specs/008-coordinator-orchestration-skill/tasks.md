# Tasks: Coordinator Issue Orchestration Skill

**Input**: Design documents from `specs/008-coordinator-orchestration-skill/`

**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `quickstart.md`

**Tests**: No backend or frontend application suites are required because this is a documentation/workflow-only change. Required evidence is manual workflow review plus `git diff --check`.

**Organization**: Tasks are grouped by dependency-driven verifiable technical outcomes.

## Phase 1: Technical Outcome 1 - Coordinator Skill (Priority: P1)

**Goal**: Add the repo-local coordinator issue orchestration skill and define the complete coordinator workflow.

**Verification**: Review `.agents/skills/catworld-orchestrate-coordinator-issue/SKILL.md` against the four coordinator scenarios in `specs/008-coordinator-orchestration-skill/quickstart.md`.

### Implementation

- [X] T001 [TO1] Create `.agents/skills/catworld-orchestrate-coordinator-issue/SKILL.md` with skill metadata, purpose, applicability, required governing context, and stop conditions.
- [X] T002 [TO1] Document coordinator inspection requirements for the full coordinator issue, linked child issues, referenced parent epic, and current `origin/main` in `.agents/skills/catworld-orchestrate-coordinator-issue/SKILL.md`.
- [X] T003 [TO1] Document dependency classification definitions for hard dependency, recommended order, conflict risk, independent, and optional follow-up in `.agents/skills/catworld-orchestrate-coordinator-issue/SKILL.md`.
- [X] T004 [TO1] Document safe default sequential mode, including first ready child selection, delegation through `.agents/skills/catworld-implement-issue/SKILL.md`, one child PR by default, and human merge gates in `.agents/skills/catworld-orchestrate-coordinator-issue/SKILL.md`.
- [X] T005 [TO1] Document explicit parallel mode, including isolated execution environments, independent or dependency-ready child selection, no hard-dependent parallelization, one child per sub-agent, and required use of `.agents/skills/catworld-implement-issue/SKILL.md` in `.agents/skills/catworld-orchestrate-coordinator-issue/SKILL.md`.
- [X] T006 [TO1] Document shared-contract handling, sub-agent input context, sub-agent decision limits, final reporting expectations, and authoritative safety references in `.agents/skills/catworld-orchestrate-coordinator-issue/SKILL.md`.
- [X] T007 [TO1] Review `.agents/skills/catworld-orchestrate-coordinator-issue/SKILL.md` against the hard dependency, independent children, shared-pattern seed, and unavailable-isolation scenarios in `specs/008-coordinator-orchestration-skill/quickstart.md`.

**Checkpoint**: The coordinator skill is complete and objectively reviewable.

---

## Phase 2: Technical Outcome 2 - Existing Workflow Routing (Priority: P2)

**Goal**: Route coordinator issues to the new coordinator skill while preserving the existing single-issue implementation skill for normal issues and concrete child issues.

**Verification**: Review `AGENTS.md` and `.agents/skills/catworld-implement-issue/SKILL.md` against the normal-single-issue scenario in `specs/008-coordinator-orchestration-skill/quickstart.md`.

### Implementation

- [X] T008 [P] [TO2] Update `AGENTS.md` to reference `.agents/skills/catworld-orchestrate-coordinator-issue/SKILL.md` for coordinator issue orchestration requests while preserving the existing single-issue implementation instruction.
- [X] T009 [P] [TO2] Update `.agents/skills/catworld-implement-issue/SKILL.md` to route coordinator issues to `.agents/skills/catworld-orchestrate-coordinator-issue/SKILL.md` instead of implementing a coordinator issue as one bundled PR by default.
- [X] T010 [TO2] Review `AGENTS.md` and `.agents/skills/catworld-implement-issue/SKILL.md` to confirm normal concrete issues and child issues still use `.agents/skills/catworld-implement-issue/SKILL.md`.

**Checkpoint**: Existing workflow routing is updated without replacing the single-issue implementation path.

---

## Phase 3: Technical Outcome 3 - Safety and Validation (Priority: P3)

**Goal**: Prove the changed workflow instructions preserve existing safety boundaries and satisfy issue #202 validation.

**Verification**: Complete the safety review and command validation from `specs/008-coordinator-orchestration-skill/quickstart.md`.

### Evidence

- [X] T011 [TO3] Review `.agents/skills/catworld-orchestrate-coordinator-issue/SKILL.md`, `AGENTS.md`, and `.agents/skills/catworld-implement-issue/SKILL.md` to confirm existing Git safety rules remain authoritative by reference and are not duplicated unnecessarily.
- [X] T012 [TO3] Review `.agents/skills/catworld-orchestrate-coordinator-issue/SKILL.md`, `AGENTS.md`, and `.agents/skills/catworld-implement-issue/SKILL.md` against the prohibited-behavior checklist in `specs/008-coordinator-orchestration-skill/quickstart.md`.
- [X] T013 [TO3] Run `git diff --check` from the repository root for changes including `AGENTS.md`, `.agents/skills/catworld-implement-issue/SKILL.md`, `.agents/skills/catworld-orchestrate-coordinator-issue/SKILL.md`, and `specs/008-coordinator-orchestration-skill/`, then confirm exit code `0`.
- [X] T014 [TO3] Review `git status --short` and `git diff --name-only` to confirm changed files stay within the source map in `specs/008-coordinator-orchestration-skill/plan.md`.

**Checkpoint**: Workflow safety and validation evidence is fresh after the latest relevant change.

---

## Dependencies & Execution Order

- **Technical Outcome 1 (P1)**: No implementation dependencies; complete before routing updates.
- **Technical Outcome 2 (P2)**: Depends on Technical Outcome 1 so references point to an existing skill.
- **Technical Outcome 3 (P3)**: Depends on Technical Outcomes 1 and 2 so validation covers final instruction text.

## Parallel Opportunities

- T008 and T009 can run in parallel after Technical Outcome 1 because they update different files.
- No coordinator child issue implementation is parallelized by this feature; this task list only documents the coordinator workflow.

## Implementation Strategy

1. Complete Technical Outcome 1 and review the new coordinator skill.
2. Complete Technical Outcome 2 and review routing for coordinator, normal, and child issues.
3. Complete Technical Outcome 3 after all text edits are final.

## Notes

- Do not add shorthand prompt routing such as `148` or `148 parallel`.
- Do not change backend, frontend, product behavior, database behavior, `.specify/memory/constitution.md`, or Spec Kit agent-context scripts.
- Do not add tasks for branch cleanup, branch deletion, remote pruning, force-push, merge, auto-merge, issue mutation, or public comments.
