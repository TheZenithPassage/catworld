# Tasks: Remove Workflow Alternatives

**Input**: Design documents from `specs/276-remove-workflow-alternatives/`

**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `quickstart.md`

**Tests**: This enabling cleanup requires repository-structure, reference, manifest, setup-script, diff-integrity, and protected-surface evidence rather than product tests.

**Organization**: Tasks follow the dependency order approved in issue #302: simplify routing first, collapse retained Spec Kit support, delete alternate workflow surfaces, then prove protected product and CI surfaces remain unchanged.

## Format: `[ID] [P?] [Trace] Description`

- **[P]**: Can run in parallel after its phase prerequisites because it changes independent paths
- **[Trace]**: Maps the task to TO1, TO2, TO3, or TO4 in `spec.md`
- Every task names the exact affected or evidence path

## Phase 1: Setup

Omitted. Branch preparation and feature artifacts already exist; issue #302 forbids replacement scaffolding, fixtures, and workflow abstractions.

## Phase 2: Foundational

Omitted. The selected approach uses existing repository files and requires no new shared infrastructure.

---

## Phase 3: Technical Outcome 1 - One Supported Implementation Route (Priority: P1)

**Goal**: Make one concrete issue reference route only through the normal `catworld-implement-issue` path before any alternative executor is deleted.

**Verification**: `AGENTS.md` and `.agents/skills/catworld-implement-issue/SKILL.md` describe one issue -> one branch -> one PR route, give `parallel` and `sequential` no special meaning, and preserve ordinary safety and delivery rules.

### Implementation and Evidence

- [x] T001 [TO1] Simplify required context, shorthand issue routing, and repository boundaries in `AGENTS.md` so one issue reference always routes to `.agents/skills/catworld-implement-issue/SKILL.md`, multiple unclear references require clarification, and all Sidecar/coordinator/mode exceptions are removed while normal safeguards remain
- [x] T002 [TO1] Remove coordinator, child, Sidecar, mode-specific, active-plan-pointer, and special sub-issue delivery lifecycle from `.agents/skills/catworld-implement-issue/SKILL.md` while preserving and not redesigning its normal branch preparation, Spec Kit sequence, validation, commit, push, PR-to-main, stop, and reporting behavior
- [x] T003 [TO1] Review `AGENTS.md` and `.agents/skills/catworld-implement-issue/SKILL.md` with targeted `rg` and focused diffs to prove the single route and confirm no ordinary architecture, validation, repository-operation, language, or completion safeguard was lost

**Checkpoint**: Routing is safe to simplify further support because no retained instruction can dispatch an alternate executor.

---

## Phase 4: Technical Outcome 2 - Minimal Retained Spec Kit Closure (Priority: P1)

**Goal**: Retain only the six invoked phases and their core scripts/templates, with no hook, context-update, preset, override, extension, or dormant compatibility branch.

**Verification**: The seven allowed skill directories remain; retained skills and scripts reference only existing core support; setup scripts resolve the active feature; both manifests contain byte-accurate hashes for retained entries only.

### Implementation and Evidence

- [x] T004 [P] [TO2] Remove pre/post extension-hook sections, `/speckit-clarify` references, preset/extension template-resolution wording, and hook completion rules from `.agents/skills/speckit-specify/SKILL.md`, retaining direct use of `.specify/templates/spec-template.md`
- [x] T005 [P] [TO2] Remove pre/post extension-hook sections, direct AGENTS context mutation, agent-script output wording, and associated rules from `.agents/skills/speckit-plan/SKILL.md` without changing its plan, research, design, decision-gate, or validation workflow
- [x] T006 [P] [TO2] Remove pre/post extension-hook sections and hook completion rules from `.agents/skills/speckit-tasks/SKILL.md` while retaining task-generation behavior
- [x] T007 [P] [TO2] Remove pre/post extension-hook sections and hook completion rules from `.agents/skills/speckit-analyze/SKILL.md` while retaining non-destructive artifact analysis behavior
- [x] T008 [P] [TO2] Remove pre/post extension-hook sections and hook completion rules from `.agents/skills/speckit-implement/SKILL.md` while retaining prerequisite checks, task execution, and completion tracking
- [x] T009 [P] [TO2] Remove pre/post extension-hook sections and hook completion rules from `.agents/skills/speckit-converge/SKILL.md` while retaining convergence analysis and append-only task behavior
- [x] T010 [P] [TO2] Simplify template resolution in `.specify/scripts/powershell/common.ps1` to `.specify/templates/<name>.md`, remove unused override/preset/extension composition code and extension-specific comments, and preserve feature-path/prerequisite helpers used by retained scripts
- [x] T011 [P] [TO2] Update `.specify/scripts/powershell/setup-tasks.ps1` to describe and validate core-only `tasks-template.md` resolution without override, preset, or extension fallback wording
- [x] T012 [P] [TO2] Delete `.agents/skills/speckit-agent-context-update/`, `.agents/skills/speckit-clarify/`, `.agents/skills/speckit-checklist/`, `.agents/skills/speckit-constitution/`, `.agents/skills/speckit-taskstoissues/`, `.specify/workflows/`, `.specify/extensions.yml`, `.specify/extensions/`, `.specify/scripts/powershell/create-new-feature.ps1`, `.specify/templates/checklist-template.md`, and `.specify/templates/constitution-template.md` without adding replacements
- [x] T013 [TO2] Prune `.specify/integrations/codex.manifest.json` to the six retained phase skills and `.specify/integrations/speckit.manifest.json` to four retained scripts plus three core templates, then recompute lowercase SHA-256 values from final bytes for every retained entry
- [x] T014 [TO2] Verify `.agents/skills/`, `.agents/skills/catworld-implement-issue/SKILL.md`, all six retained phase `SKILL.md` files, `.specify/scripts/powershell/`, `.specify/templates/`, and `.specify/integrations/*.manifest.json` form a complete core-only dependency closure and smoke-test `check-prerequisites.ps1`, `setup-plan.ps1`, and `setup-tasks.ps1` against `specs/276-remove-workflow-alternatives/`

**Checkpoint**: The retained workflow and core support operate without any deleted optional path or dormant fallback.

---

## Phase 5: Technical Outcome 3 - Obsolete Workflow Surfaces Removed (Priority: P1)

**Goal**: Delete every Sidecar/coordinator executor, specialized template, active workflow-documentation block, and exact workflow-only spec directory without replacement.

**Verification**: Every literal deletion target is absent; heading-bounded architecture content and protected colliding/product specs remain; no retained active surface refers to a deleted workflow.

### Implementation and Evidence

- [x] T015 [P] [TO3] Delete `.agents/skills/catworld-orchestrate-coordinator-issue/`, `.agents/skills/catworld-parallel-coordinator/`, and `.agents/skills/catworld-parallel-child-implementation/` completely
- [x] T016 [P] [TO3] Delete `.github/ISSUE_TEMPLATE/coordinator-parallel-planning.md`, `.github/ISSUE_TEMPLATE/focused-child-issue.md`, `.github/PULL_REQUEST_TEMPLATE/README.md`, `.github/PULL_REQUEST_TEMPLATE/sidecar-child-to-coordinator.md`, and `.github/PULL_REQUEST_TEMPLATE/sidecar-final-coordinator-to-main.md` without replacement templates
- [x] T017 [P] [TO3] Remove the complete heading-bounded `## Codex Workflow Routing` section from `docs/ARCHITECTURE.md`, preserving all content before that heading and `## Diagrams` plus all subsequent product documentation
- [x] T018 [P] [TO3] Delete only the literal workflow artifact directories `specs/008-coordinator-orchestration-skill/`, `specs/011-dual-workflow-routing/`, `specs/012-coordinator-child-templates/`, `specs/013-pr-description-templates/`, `specs/014-sidecar-artifact-paths/`, `specs/015-sidecar-coordinator-parallel-entrypoint/`, `specs/016-sidecar-artifact-preparation/`, `specs/017-sidecar-child-implementation/`, `specs/018-sidecar-git-rules/`, `specs/019-sidecar-pr-rules/`, `specs/020-sidecar-validation-reporting/`, `specs/021-sidecar-resume-state/`, `specs/022-split-handoff-alignment/`, `specs/023-dry-run-sidecar-workflow/`, `specs/024-dormant-coordinator-routing/`, `specs/025-sidecar-run-lifecycle/`, `specs/026-sidecar-coordinator-artifacts/`, `specs/027-prepared-child-artifacts/`, `specs/028-sidecar-branch-worktree/`, `specs/029-dependency-layer-fanout/`, `specs/030-sidecar-child-execution/`, `specs/031-merge-aware-sidecar-resume/`, `specs/032-final-coordinator-delivery/`, `specs/033-sidecar-local-cleanup/`, `specs/034-live-sidecar-dry-run/`, `specs/035-activate-sidecar-routing/`, `specs/148-coordinator-enforce-safe-deletion-rules-for-owners-cats-vets-and-stays/`, `specs/272-coordinator-260-live-sidecar-fixture/`, `specs/273-260-fixture-layer1-a/`, `specs/274-260-fixture-layer1-b/`, and `specs/275-260-fixture-layer2-summary/`, preserving `specs/008-creator-attribution/`, `specs/196-*`, `specs/197-*`, `specs/198-*`, and `specs/276-remove-workflow-alternatives/`
- [x] T019 [TO3] Run the required repository-wide stale-term search from `specs/276-remove-workflow-alternatives/quickstart.md`, classify every hit individually, and remove only active deleted-workflow references within the approved source map while preserving explicitly allowed historical product-spec wording

**Checkpoint**: All alternate workflow executors and artifacts are absent, and no retained active source can invoke or document them.

---

## Phase 6: Technical Outcome 4 - Product and CI Surfaces Preserved (Priority: P1)

**Goal**: Prove the cleanup changed repository implementation machinery only.

**Verification**: The complete changed-path set contains no application source, product-behavior test, migration, dependency, or protected CI change; architecture documentation changed only at the approved heading boundary.

### Evidence

- [x] T020 [TO4] Execute the 50-entry literal deletion audit and retained collision/product-spec directory checks in `specs/276-remove-workflow-alternatives/quickstart.md`, failing if any deletion target remains or any protected retained directory is missing
- [x] T021 [TO4] Review `git status --short`, `git diff --name-only`, and focused diffs for `src/`, `frontend/src/`, `src/test/`, `src/main/resources/db/migration/`, `pom.xml`, `frontend/package.json`, `frontend/package-lock.json`, `.github/workflows/backend-ci.yml`, `.github/workflows/frontend-ci.yml`, and `docs/ARCHITECTURE.md`; remove or justify any unplanned path and require no protected-surface diff

**Checkpoint**: The final working tree is fully scoped to issue #302 and its single feature-artifact directory.

---

## Phase 7: Polish & Cross-Cutting Validation

**Purpose**: Collect fresh, final evidence after the latest relevant change.

- [x] T022 Run every command in `specs/276-remove-workflow-alternatives/quickstart.md`, including `git diff --check`, changed-path review, exact skill listing, literal deletion checks, stale-reference review, manifest target/hash verification, retained setup-script smoke tests, and protected-surface checks; record each result as passed, failed, skipped, timed out, interrupted, partial, stale, or not revalidated
- [x] T023 Review all changed paths against GitHub issue #302, `specs/276-remove-workflow-alternatives/spec.md`, `specs/276-remove-workflow-alternatives/plan.md`, and this `tasks.md`, confirm no new workflow abstraction or unplanned cross-cutting surface, and rerun any evidence affected by the final adjustments

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 3 (TO1)**: Starts immediately and must finish before alternate support or executors are deleted.
- **Phase 4 (TO2)**: Depends on TO1 so routing is already reduced; manifest task T013 depends on final content from T004–T012; closure proof T014 depends on T013.
- **Phase 5 (TO3)**: Depends on TO2; tasks T015–T018 may run in parallel on independent literal paths, then T019 reviews the integrated retained tree.
- **Phase 6 (TO4)**: Depends on TO1–TO3.
- **Phase 7**: Depends on all technical outcomes and must be rerun after any relevant late adjustment.

### Technical Outcome Dependencies

- **TO1**: No implementation dependency; it is the required first safe increment.
- **TO2**: Depends on TO1 and provides the retained support needed before final deletion/reference validation.
- **TO3**: Depends on TO2 to avoid deleting alternatives before the retained core is coherent.
- **TO4**: Depends on TO1, TO2, and TO3 because it validates the complete cleanup boundary.

### Parallel Opportunities

- T004–T012 touch independent retained skills/scripts or literal deletion targets and may run in parallel after TO1, except T013 must wait for all of them.
- T015–T018 touch independent executor, template, documentation, and spec-artifact paths and may run in parallel after TO2.
- Read-only evidence commands within T022 may run in parallel only when they do not mutate generated artifacts; setup-script smoke checks should run sequentially before final freshness checks.

---

## Parallel Example: Technical Outcome 2

```text
Task: "Remove hook and clarify surfaces from .agents/skills/speckit-specify/SKILL.md"
Task: "Remove hook and context-update surfaces from .agents/skills/speckit-plan/SKILL.md"
Task: "Remove hook surfaces from the other four retained phase SKILL.md files"
Task: "Collapse template resolution in .specify/scripts/powershell/common.ps1"
```

## Parallel Example: Technical Outcome 3

```text
Task: "Delete the three Sidecar/coordinator skill directories"
Task: "Delete the five specialized GitHub templates"
Task: "Remove the heading-bounded workflow block from docs/ARCHITECTURE.md"
Task: "Delete the 31 literal workflow-only spec directories"
```

---

## Implementation Strategy

### First Verifiable Increment

1. Complete T001–T003.
2. Stop and verify that one issue reference has exactly one route and all normal safety rules remain.
3. Continue only after that route is safe for deletion of its alternatives.

### Incremental Delivery

1. TO1 reduces routing before any destructive cleanup.
2. TO2 establishes the minimal retained dependency closure and proves its scripts/manifests.
3. TO3 removes every exact alternate surface and proves no active stale reference remains.
4. TO4 and the final phase prove product/CI preservation and validation freshness.

### Parallel Team Strategy

1. Complete TO1 sequentially because both instruction files jointly define routing.
2. Parallelize independent retained phase-skill/script edits within TO2, then serialize manifest hashes and closure validation.
3. Parallelize literal deletion categories within TO3, then serialize stale-hit classification and final scope validation.

## Notes

- Every deletion uses exact literal paths; no prefix wildcard is permitted.
- `[P]` tasks change independent files or directories after their declared prerequisite.
- Do not add tasks for application code, product tests, migrations, dependencies, CI edits, issues, branches, worktrees, remote pruning, commit/push/PR delivery, or merge operations.
- Delivery is handled by `catworld-implement-issue` only after all scoped tasks and fresh validation complete.
