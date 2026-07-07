# Tasks: Sidecar Artifact Preparation

**Input**: Design documents from `specs/016-sidecar-artifact-preparation/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/sidecar-artifact-preparation.md, quickstart.md

**Tests**: No backend/frontend runtime tests are required because this feature changes repository workflow infrastructure and generated Spec Kit artifacts only. Required evidence is local coordinator/child artifact simulation, text checks, changed-file scope review, manual review against issues #220, #225, #226 and #227, and `git diff --check`.

**Organization**: Tasks are grouped by the three verifiable technical outcomes in `spec.md`.

## Phase 1: Technical Outcome 1 - Coordinator Orchestration Artifact Preparation (Priority: P1)

**Goal**: Extend the sidecar coordinator skill so it defines a coordinator artifact-preparation step before any delegation or child implementation work.

**Verification**: `.agents/skills/catworld-parallel-coordinator/SKILL.md` contains an artifact-preparation phase that requires a coordinator orchestration artifact with child issue map, dependency layers, shared contract section, validation plan, and status table, and stops before delegation when preparation is unsafe.

- [X] T001 [TO1] Add an artifact-preparation boundary section to `.agents/skills/catworld-parallel-coordinator/SKILL.md` that runs before delegation or child implementation
- [X] T002 [TO1] Define required coordinator orchestration artifact contents in `.agents/skills/catworld-parallel-coordinator/SKILL.md`, including child issue map, dependency layers, shared contract section, validation plan, and status table
- [X] T003 [TO1] Add coordinator artifact stop conditions in `.agents/skills/catworld-parallel-coordinator/SKILL.md` for missing child context, dependency ambiguity, source-of-truth conflicts, and unsafe shared contracts
- [X] T004 [TO1] Update `docs/ARCHITECTURE.md` only if needed to align the longer sidecar workflow source-of-truth with the new artifact-preparation boundary
- [X] T005 [TO1] Validate coordinator artifact-preparation language with `Select-String -Path .agents/skills/catworld-parallel-coordinator/SKILL.md -Pattern 'artifact-preparation','coordinator orchestration artifact','child issue map','dependency layers','shared contract','validation plan','status table'`

**Checkpoint**: TO1 is complete when the coordinator artifact-preparation boundary is explicit and independently verifiable from the sidecar skill.

---

## Phase 2: Technical Outcome 2 - Child Implementation Artifact Preparation (Priority: P1)

**Goal**: Define how sidecar preparation creates or requires issue-numbered child `spec.md`, `plan.md`, and `tasks.md` artifacts before delegation.

**Verification**: `.agents/skills/catworld-parallel-coordinator/SKILL.md` maps child issues to #225 paths, describes prepared child `spec.md`, `plan.md`, and `tasks.md` artifacts, and requires validation against the coordinator, child issue bodies, source-of-truth documentation, and shared contract.

- [X] T006 [TO2] Add child artifact preparation requirements to `.agents/skills/catworld-parallel-coordinator/SKILL.md` for issue-numbered `spec.md`, `plan.md`, and `tasks.md` artifact sets
- [X] T007 [TO2] Add #225 child artifact path rules to `.agents/skills/catworld-parallel-coordinator/SKILL.md` for `specs/<child-issue-number>-<child-slug>/` and collision stop behavior
- [X] T008 [TO2] Add child artifact validation rules to `.agents/skills/catworld-parallel-coordinator/SKILL.md` against coordinator scope, child issue bodies, source-of-truth documentation, and shared contracts
- [X] T009 [TO2] Validate child artifact path and file expectations with `Select-String -Path .agents/skills/catworld-parallel-coordinator/SKILL.md -Pattern 'spec.md','plan.md','tasks.md','specs/<coordinator-number>-coordinator-<slug>','specs/<child-issue-number>-<child-slug>'`
- [X] T010 [TO2] Run the quickstart three-child simulation from `specs/016-sidecar-artifact-preparation/quickstart.md` and confirm the coordinator and child artifact paths match #225

**Checkpoint**: TO2 is complete when child implementers have explicit prepared-artifact expectations and unsafe child artifact preparation stops before delegation.

---

## Phase 3: Technical Outcome 3 - Workflow Boundary Preservation (Priority: P1)

**Goal**: Preserve approved sidecar and sequential workflow boundaries while adding artifact preparation.

**Verification**: The sidecar skill prohibits unapproved seed/foundation/shared-contract child issue creation, keeps closed-child coordinator final passes outside artifact preparation, leaves the normal sequential Spec Kit flow unchanged, and does not modify `catworld-implement-issue`.

- [X] T011 [TO3] Add explicit no-invention rules to `.agents/skills/catworld-parallel-coordinator/SKILL.md` for seed, foundation, and shared-contract child issues unless they already exist or the user explicitly approves creating them
- [X] T012 [TO3] Add closed-child coordinator final-pass exclusion wording to `.agents/skills/catworld-parallel-coordinator/SKILL.md` so this artifact-preparation path is not used by the existing sequential final pass
- [X] T013 [TO3] Preserve prohibited side effects in `.agents/skills/catworld-parallel-coordinator/SKILL.md`, including no GitHub issue mutation, no branch/worktree operations, no PR operations, no child delegation, no product code changes, and no changes to `.agents/skills/catworld-implement-issue/SKILL.md`
- [X] T014 [TO3] Validate no seed/foundation/shared-contract child issue invention with `Select-String -Path .agents/skills/catworld-parallel-coordinator/SKILL.md -Pattern 'seed','foundation','shared-contract child'`
- [X] T015 [TO3] Validate closed-child final-pass exclusion with `Select-String -Path .agents/skills/catworld-parallel-coordinator/SKILL.md -Pattern 'closed-child','final pass','not use artifact preparation'`

**Checkpoint**: TO3 is complete when the added artifact-preparation path cannot be mistaken for sequential workflow changes, closed-child final-pass work, issue creation, or execution orchestration.

---

## Phase 4: Polish & Cross-Cutting Validation

**Purpose**: Confirm scope, formatting, and validation freshness after all workflow edits.

- [X] T016 Run `git diff --name-only -- .agents/skills/catworld-implement-issue/SKILL.md` and confirm no output
- [X] T017 Run `git diff --name-only` and confirm changed paths are limited to `.agents/skills/catworld-parallel-coordinator/SKILL.md`, justified `docs/ARCHITECTURE.md` alignment if present, and `specs/016-sidecar-artifact-preparation/`
- [X] T018 Run `git diff --check` and confirm no whitespace errors
- [X] T019 Review `specs/016-sidecar-artifact-preparation/plan.md` Constitution Check and Architecture and Technology Assessment after implementation edits and confirm no new unresolved decision was introduced
- [X] T020 Rerun affected quickstart checks from `specs/016-sidecar-artifact-preparation/quickstart.md` after any late edits to `.agents/skills/catworld-parallel-coordinator/SKILL.md`, `docs/ARCHITECTURE.md`, or feature artifacts

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (TO1)**: Start first; it creates the coordinator artifact-preparation boundary.
- **Phase 2 (TO2)**: Depends on TO1 because child artifacts are prepared under the coordinator artifact-preparation phase.
- **Phase 3 (TO3)**: Can proceed after TO1 exists, but final wording should be reviewed after TO2 to ensure all new behavior has matching boundaries.
- **Phase 4 (Polish)**: Depends on all desired technical outcomes.

### Technical Outcome Dependencies

- **TO1**: Depends on the sidecar skill from #226 and the issue #227 artifact-preparation scope.
- **TO2**: Depends on TO1 and the #225 artifact path contract.
- **TO3**: Depends on TO1 and TO2 wording so the preservation rules cover the full new artifact-preparation surface.

### Parallel Opportunities

- T004 can be drafted in parallel with T001-T003 if the sidecar skill structure is clear, but must be reviewed after skill wording is final.
- T014 and T015 can run in parallel after T011-T013 are complete.
- T016, T017, and T018 can run in parallel after implementation edits are complete.

---

## Implementation Strategy

### First Verifiable Increment

1. Complete T001-T005.
2. Stop and validate that the coordinator artifact-preparation phase exists and stops before unsafe delegation.

### Incremental Delivery

1. Deliver TO1: coordinator orchestration artifact preparation.
2. Deliver TO2: child implementation artifact preparation and #225 path validation.
3. Deliver TO3: workflow boundary preservation.
4. Run Phase 4 validation and refresh any stale checks.

### Notes

- Do not add tasks for product code, migrations, frontend/backend tests, branch cleanup, branch deletion, remote pruning, force-push, merge, auto-merge, issue mutation, public comments, or delivery operations.
- Delivery operations are handled by the CatWorld issue workflow after scoped implementation and required validation complete.
