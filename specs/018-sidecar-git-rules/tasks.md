# Tasks: Sidecar Git Rules

**Input**: Design documents from `specs/018-sidecar-git-rules/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/sidecar-git-state.md, quickstart.md

**Tests**: Evidence is required by issue #229, the specification validation matrix, the semantic-equivalence review, and the plan validation evidence section. Validation uses a temporary Git simulation, focused text review, changed-file scope review, and `git diff --check`.

**Organization**: Tasks are grouped by verifiable technical outcome because this is workflow/enabling work.

## Phase 1: Technical Outcome 1 - Coordinator and Child Git State (Priority: P1)

**Goal**: Define coordinator branch, child branch, isolated checkout/worktree, deterministic naming, collision handling, and coordinator artifact Git-state rules.

**Verification**: Review sidecar workflow text and coordinator artifact state contract to confirm the coordinator branch starts from current `origin/main`, child branches start from the coordinator branch, child checkouts/worktrees are isolated, names are deterministic from issue numbers and slugs, and collisions stop unless clearly recoverable.

- [X] T001 [TO1] Add sidecar coordinator branch, child branch, checkout/worktree, deterministic naming, collision, and coordinator artifact Git-state rules in `.agents/skills/catworld-parallel-coordinator/SKILL.md`
- [X] T002 [P] [TO1] Add sidecar Git model and coordinator artifact Git-state documentation in `docs/ARCHITECTURE.md`
- [X] T003 [TO1] Align sidecar child handoff validation with coordinator branch, child branch, checkout/worktree, and `main`-target prevention in `.agents/skills/catworld-parallel-child-implementation/SKILL.md`
- [X] T004 [TO1] Verify TO1 requirements against `specs/018-sidecar-git-rules/contracts/sidecar-git-state.md` and record any missing workflow-state fields in `.agents/skills/catworld-parallel-coordinator/SKILL.md`

**Checkpoint**: Coordinator and child sidecar Git state is explicitly defined and objectively reviewable.

---

## Phase 2: Technical Outcome 2 - PR Targeting and Merge-Only Refresh (Priority: P1)

**Goal**: Define sidecar child PR targeting, normal-merge refresh after child PR merges, and prohibitions on rebase, force-push, and history rewriting.

**Verification**: Run the temporary Git simulation from `specs/018-sidecar-git-rules/quickstart.md` and review workflow text for child PR target and prohibited Git operations.

- [X] T005 [TO2] Add child PR target, active child refresh, normal merge only, and prohibited rebase/force-push/history-rewriting rules in `.agents/skills/catworld-parallel-coordinator/SKILL.md`
- [X] T006 [P] [TO2] Add child-side enforcement language for coordinator branch PR targets and merge-only refresh context in `.agents/skills/catworld-parallel-child-implementation/SKILL.md`
- [X] T007 [P] [TO2] Document child PR target and merge-only refresh behavior in `docs/ARCHITECTURE.md`
- [X] T008 [TO2] Run the temporary Git simulation from `specs/018-sidecar-git-rules/quickstart.md` and confirm no rebase, force-push, history rewriting, remote cleanup, or CatWorld repository sidecar branch mutation is performed

**Checkpoint**: Sidecar child PRs and active child refreshes are constrained to the coordinator branch model and normal merge-only updates.

---

## Phase 3: Technical Outcome 3 - Cleanup and Normal Workflow Boundaries (Priority: P1)

**Goal**: Define local cleanup eligibility, remote cleanup approval requirements, and explicit exclusions for direct child issue work and closed-child coordinator final passes.

**Verification**: Review workflow text to confirm local sidecar branches/worktrees are retained after individual child PR merges, local cleanup is eligible only after the final coordinator PR has merged into `main`, remote cleanup requires explicit user approval, and non-sidecar workflows use normal sequential Git rules.

- [X] T009 [TO3] Add local cleanup timing, local-only cleanup scope, remote cleanup approval, direct child sequential flow, and closed-child coordinator final-pass exclusions in `.agents/skills/catworld-parallel-coordinator/SKILL.md`
- [X] T010 [P] [TO3] Add child-side cleanup and normal sequential workflow boundary language in `.agents/skills/catworld-parallel-child-implementation/SKILL.md`
- [X] T011 [P] [TO3] Document cleanup eligibility and normal workflow exclusions in `docs/ARCHITECTURE.md`
- [X] T012 [TO3] Run the cleanup and boundary manual review from `specs/018-sidecar-git-rules/quickstart.md` against `.agents/skills/catworld-parallel-coordinator/SKILL.md`, `.agents/skills/catworld-parallel-child-implementation/SKILL.md`, and `docs/ARCHITECTURE.md`

**Checkpoint**: Cleanup and non-sidecar workflow boundaries are explicit and aligned across sidecar sources of truth.

---

## Phase 4: Polish & Cross-Cutting Concerns

**Purpose**: Final validation, scope review, and freshness checks required by the active plan.

- [X] T013 Run the required text checks from `specs/018-sidecar-git-rules/quickstart.md` for `.agents/skills/catworld-parallel-coordinator/SKILL.md`, `.agents/skills/catworld-parallel-child-implementation/SKILL.md`, `docs/ARCHITECTURE.md`, and `.agents/skills/catworld-implement-issue/SKILL.md`
- [X] T014 Run `git diff --check` from the repository root
- [X] T015 Review `git diff --name-only` against the source map in `specs/018-sidecar-git-rules/plan.md` and justify or remove any unplanned touched surfaces
- [X] T016 Rerun any validation affected by late edits, or report it as stale/not revalidated in the final status

---

## Dependencies & Execution Order

### Phase Dependencies

- **Technical Outcome 1 (Phase 1)**: No implementation dependencies beyond completed issues #226, #227, and #228.
- **Technical Outcome 2 (Phase 2)**: Depends on TO1 branch/checkpoint vocabulary and coordinator artifact Git-state fields.
- **Technical Outcome 3 (Phase 3)**: Depends on TO1 sidecar resource vocabulary and TO2 child PR/refresh boundaries.
- **Polish (Phase 4)**: Depends on TO1, TO2, and TO3 edits being complete.

### Parallel Opportunities

- T002 can run in parallel with T001 because it edits `docs/ARCHITECTURE.md`.
- T006 and T007 can run in parallel after T005 because they edit different files.
- T010 and T011 can run in parallel after T009 because they edit different files.
- T014 can run in parallel with T015 after all edits are complete.

## Parallel Example: Technical Outcome 2

```text
Task: "Add child-side enforcement language for coordinator branch PR targets and merge-only refresh context in .agents/skills/catworld-parallel-child-implementation/SKILL.md"
Task: "Document child PR target and merge-only refresh behavior in docs/ARCHITECTURE.md"
```

## Implementation Strategy

### First Verifiable Increment

1. Complete TO1 sidecar Git state rules across coordinator skill, child skill, and architecture docs.
2. Validate TO1 against `contracts/sidecar-git-state.md`.
3. Stop and confirm the coordinator branch, child branch, checkout/worktree, naming, and collision model is reviewable.

### Incremental Delivery

1. Add TO1 Git state and collision rules.
2. Add TO2 child PR target and merge-only refresh rules, then run the temporary Git simulation.
3. Add TO3 cleanup and normal workflow boundary rules.
4. Run quickstart text checks, `git diff --check`, and changed-file scope review after final edits.
