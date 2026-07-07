# Tasks: Sidecar Child Implementation Skill

**Input**: Design documents from `specs/017-sidecar-child-implementation/`

**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/sidecar-child-implementation.md`, `quickstart.md`

**Tests**: Evidence is required by the specification and plan because this feature changes correctness-sensitive workflow routing and shared sidecar execution instructions. Evidence is text review, local sample handoff review, changed-file scope review, and `git diff --check`.

**Organization**: Tasks are grouped by verifiable technical outcome.

## Phase 1: Setup

**Purpose**: Add the new sidecar child skill surface and sample artifact location.

- [X] T001 Create `.agents/skills/catworld-parallel-child-implementation/SKILL.md` with valid skill front matter and an empty sidecar child implementation heading
- [X] T002 Create `specs/017-sidecar-child-implementation/samples/sample-child-handoff.md` for the local prepared child handoff validation artifact

---

## Phase 2: Technical Outcome 1 - Prepared Child Execution Skill (Priority: P1)

**Goal**: The sidecar child implementation skill exists and can execute exactly one prepared child issue from coordinator-provided artifacts only.

**Verification**: Review `.agents/skills/catworld-parallel-child-implementation/SKILL.md` and `specs/017-sidecar-child-implementation/samples/sample-child-handoff.md` to confirm the required prepared inputs are explicit and missing context stops before implementation.

### Evidence for Technical Outcome 1

- [X] T003 [TO1] Add a local prepared child handoff example with child issue context, coordinator context, prepared `spec.md`, `plan.md`, `tasks.md`, shared contract references, validation requirements, dependency status, and target coordinator branch/worktree context in `specs/017-sidecar-child-implementation/samples/sample-child-handoff.md`
- [X] T004 [TO1] Add a missing-context blocker example to `specs/017-sidecar-child-implementation/samples/sample-child-handoff.md`

### Implementation for Technical Outcome 1

- [X] T005 [TO1] Define the sidecar child skill purpose, applicability, and required handoff inputs in `.agents/skills/catworld-parallel-child-implementation/SKILL.md`
- [X] T006 [TO1] Define readiness checks that verify child issue body, coordinator context, prepared artifacts, shared contract, validation requirements, dependency status, and target branch/worktree context in `.agents/skills/catworld-parallel-child-implementation/SKILL.md`
- [X] T007 [TO1] Define blocker reporting for missing required inputs before implementation in `.agents/skills/catworld-parallel-child-implementation/SKILL.md`

**Checkpoint**: The sidecar child skill can be reviewed as a valid prepared-handoff consumer.

---

## Phase 3: Technical Outcome 2 - Normal Workflow Boundary (Priority: P1)

**Goal**: The sidecar child implementation skill cannot be confused with the normal sequential issue implementation path.

**Verification**: Review the new skill and architecture documentation to confirm normal issues, direct child issues outside `parallel`, and closed-child coordinator final passes remain outside this sidecar child skill.

### Evidence for Technical Outcome 2

- [X] T008 [TO2] Verify `.agents/skills/catworld-implement-issue/SKILL.md` remains untouched by checking `git diff --name-only -- .agents/skills/catworld-implement-issue/SKILL.md`
- [X] T009 [TO2] Review sidecar child routing exclusions for normal issues, direct child issues outside `parallel`, and closed-child coordinator final passes in `.agents/skills/catworld-parallel-child-implementation/SKILL.md`

### Implementation for Technical Outcome 2

- [X] T010 [TO2] Add routing boundary, non-applicability, and prohibited side-effect sections to `.agents/skills/catworld-parallel-child-implementation/SKILL.md`
- [X] T011 [TO2] Update `docs/ARCHITECTURE.md` to document the sidecar child implementation boundary and confirm direct child sequential execution and closed-child coordinator final passes remain in the existing sequential workflow

**Checkpoint**: The sidecar child skill is visibly separate from the normal issue implementation path.

---

## Phase 4: Technical Outcome 3 - Shared Contract and Validation Preservation (Priority: P1)

**Goal**: The sidecar child implementation skill preserves prepared shared contracts and validation requirements without expanding child scope.

**Verification**: Review the skill and sample handoff to confirm the child executor follows prepared artifacts, stops on conflicts, and reports final status without redefining shared contracts or creating replacement planning artifacts.

### Evidence for Technical Outcome 3

- [X] T012 [TO3] Review `.agents/skills/catworld-parallel-child-implementation/SKILL.md` against `specs/017-sidecar-child-implementation/contracts/sidecar-child-implementation.md` for all required handoff inputs, stop conditions, and validation contract items
- [X] T013 [TO3] Confirm the sample handoff in `specs/017-sidecar-child-implementation/samples/sample-child-handoff.md` demonstrates shared-contract and validation preservation plus a conflict blocker scenario

### Implementation for Technical Outcome 3

- [X] T014 [TO3] Add child execution workflow steps that consume prepared `spec.md`, `plan.md`, `tasks.md`, shared contract, validation requirements, and dependency status without generating replacement planning artifacts in `.agents/skills/catworld-parallel-child-implementation/SKILL.md`
- [X] T015 [TO3] Add stop conditions for artifact conflicts, unresolved dependencies, unsafe shared contracts, missing target branch/worktree context, and scope expansion in `.agents/skills/catworld-parallel-child-implementation/SKILL.md`
- [X] T016 [TO3] Add validation expectations and final report requirements for sidecar child execution in `.agents/skills/catworld-parallel-child-implementation/SKILL.md`

**Checkpoint**: The sidecar child skill preserves coordinator-prepared decisions and validation requirements.

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Run required validation and scope review after implementation.

- [X] T017 Run `Test-Path .agents/skills/catworld-parallel-child-implementation/SKILL.md` and record the result
- [X] T018 Run `rg "Required Handoff Inputs|Stop Conditions|prepared.*spec.md|prepared.*plan.md|prepared.*tasks.md|shared contract|closed-child coordinator final pass|catworld-implement-issue" .agents/skills/catworld-parallel-child-implementation/SKILL.md` and record the result
- [X] T019 Run `rg "sidecar child|catworld-parallel-child-implementation|closed-child coordinator final" docs/ARCHITECTURE.md` and record the result
- [X] T020 Run `git diff --name-only -- .agents/skills/catworld-implement-issue/SKILL.md` and confirm it produces no output
- [X] T021 Run `git diff --name-only` and compare changed files against `specs/017-sidecar-child-implementation/plan.md` source map
- [X] T022 Run `git diff --check` and record the result
- [X] T023 Rerun any affected validation after late edits to `.agents/skills/catworld-parallel-child-implementation/SKILL.md`, `docs/ARCHITECTURE.md`, or `specs/017-sidecar-child-implementation/samples/sample-child-handoff.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Must complete before the sidecar child skill and sample handoff can be filled.
- **Technical Outcome 1 (Phase 2)**: Must complete before TO2 and TO3 reviews can be meaningful because the skill surface and handoff inputs anchor the rest of the feature.
- **Technical Outcome 2 (Phase 3)**: Can proceed after TO1 and must complete before final routing-boundary validation.
- **Technical Outcome 3 (Phase 4)**: Can proceed after TO1 and should complete before final validation.
- **Polish (Phase 5)**: Depends on TO1, TO2, and TO3.

### Technical Outcome Dependencies

- **TO1**: No prior outcome dependency after setup.
- **TO2**: Depends on TO1's skill surface and required input sections.
- **TO3**: Depends on TO1's skill surface and prepared handoff model.

### Parallel Opportunities

- After T005-T007 create the initial skill substance, T010/T011 and T014-T016 can be drafted independently if file conflicts are coordinated.
- T008 and T020 are repeated normal-skill preservation checks and can run whenever the normal implementation skill has not been touched.
- T017-T022 can run together after final edits when no more content changes are expected.

---

## Implementation Strategy

### First Verifiable Increment

1. Complete T001-T007.
2. Verify the new skill exists and requires a complete prepared child handoff.
3. Stop if the skill implies it can run without prepared artifacts.

### Incremental Delivery

1. Add the sidecar child skill and sample handoff inputs for TO1.
2. Add routing exclusions and architecture documentation for TO2.
3. Add shared-contract, stop-condition, validation, and final-report rules for TO3.
4. Run all quickstart and scope validations.

### Final Scope Guard

Do not add branch cleanup, branch deletion, remote pruning, force-push, merge, auto-merge, GitHub issue mutation, public comments, product code changes, backend/frontend runtime changes, or dependency changes for this issue.
