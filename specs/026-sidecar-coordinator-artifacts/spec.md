# Feature Specification: Sidecar Coordinator Artifacts

**Feature Branch**: `chore/252-generate-real-sidecar-coordinator-orchestration-artifacts`

**Created**: 2026-07-09

**Input**: GitHub issue #252, "[Workflow] Generate real sidecar coordinator orchestration artifacts"

## User Scenarios, Technical Outcomes & Testing *(mandatory)*

### Verifiable Technical Outcomes *(use instead of user stories for technical/enabling work)*

- **TO-001**: A valid future coordinator `parallel` run creates or updates a real coordinator orchestration artifact only after the coordinator branch/worktree is active.
  - **Why this priority**: The sidecar workflow must become execution-capable while preserving the rule that local `main` never receives sidecar artifacts or sidecar commits.
  - **Acceptance Scenarios**:
    1. **Given** a coordinator issue has been classified as eligible for a future sidecar run, **When** Codex performs preflight while the active checkout is still `main`, **Then** it may compute `specs/<coordinator-number>-coordinator-<slug>/` but must not write the coordinator artifact.
    2. **Given** Codex cannot safely create or enter the coordinator branch/worktree, **When** coordinator artifact writing would be next, **Then** the workflow stops before modifying files.
    3. **Given** Codex has created or entered the coordinator branch/worktree, **When** artifact writing is allowed, **Then** the coordinator artifact is written only inside that active coordinator branch/worktree.
  - **Validation Evidence**: Manual artifact write-gate simulation and `git diff --check`.

- **TO-002**: Coordinator artifacts contain enough source context, planning state, execution state, and stop conditions for a later Codex session to resume without private conversation context.
  - **Why this priority**: Sidecar coordination may span several sessions, child PRs, and user-owned merge observations; the artifact must be the durable source of run state.
  - **Acceptance Scenarios**:
    1. **Given** a coordinator with at least three child issues, **When** the artifact is inspected, **Then** it records the coordinator issue details, inspected child issue list, parent/source references, child map, dependency layers, hard dependencies, conflict risks, independent candidates, blockers, shared implementation contract, owned/caution surfaces, branch/worktree plan, PR target plan, validation plan, resume/status table, stop conditions, and final coordinator PR plan.
    2. **Given** a sidecar run reaches a blocked, handoff-ready, child-PR-created, user-merge-observed, stale-validation, next-layer-ready, final-PR-ready, or cleanup-eligible state, **When** the artifact is updated, **Then** it records the new factual state without implying branches, worktrees, PRs, merges, validation, or cleanup exist before they actually do.
  - **Validation Evidence**: Manual artifact content simulation and state-transition review.

- **TO-003**: Repeated coordinator runs detect existing coordinator artifacts and either resume the same run safely or stop on collisions.
  - **Why this priority**: The sidecar workflow must be resumable without overwriting unrelated artifacts or confusing two coordinator runs with the same computed path.
  - **Acceptance Scenarios**:
    1. **Given** an existing coordinator artifact belongs to the same coordinator run, **When** Codex starts or resumes the run, **Then** it loads the artifact and continues from recorded factual state.
    2. **Given** an existing artifact path or same-number coordinator directory cannot be proven to belong to the same run, **When** Codex starts the run, **Then** it stops with a collision blocker before writing files.
  - **Validation Evidence**: Manual same-run resume and collision-stop simulation.

### Edge Cases

- Artifact path computation during preflight must remain a planning-only operation until the coordinator branch/worktree is active.
- An active checkout on `main` must stop or enter the coordinator branch/worktree before any sidecar coordinator artifact file is written.
- A blocked coordinator must record the blocker in the artifact when writing is allowed, and must not launch child work.
- Existing artifact paths with the same coordinator number but incompatible recorded source state must be treated as collisions.
- Existing same-run artifacts must be updated only with factual state that has already happened or been safely planned.
- Artifact text must not imply child branches, child worktrees, child PRs, validation results, final PR readiness, merge observations, or cleanup eligibility exist before those states are real.
- Local `main` must remain clean after artifact planning: no sidecar artifacts, sidecar commits, or untracked sidecar files.

## Requirements *(mandatory)*

### Technical Requirements *(include for technical, architectural, migration, security, operational, refactoring, or enabling work)*

- **TR-001**: Sidecar coordinator workflow sources MUST support computing the coordinator artifact path as `specs/<coordinator-number>-coordinator-<slug>/` during preflight without treating path computation as permission to write files.
- **TR-002**: Coordinator artifact writing MUST be gated on an active coordinator branch/worktree; if the active checkout is `main`, the workflow MUST stop or create/enter the coordinator branch/worktree before writing artifacts.
- **TR-003**: If Codex cannot create or enter the coordinator branch/worktree safely, the workflow MUST stop before modifying files.
- **TR-004**: Local `main` MUST remain clean during coordinator artifact planning and MUST NOT receive sidecar artifacts, sidecar commits, or untracked sidecar files.
- **TR-005**: The coordinator artifact MUST include coordinator issue number, title, URL, labels, state, inspected child issue list, parent epic or source references when relevant, child issue map, dependency layers, hard dependencies, conflict risks, independent candidates, unresolved blockers, shared implementation contract, child-owned surfaces, shared surfaces requiring caution, branch and worktree plan, PR target plan, validation plan, resume/status table, stop conditions, and final coordinator PR plan.
- **TR-006**: The workflow MUST update the coordinator artifact as factual run state changes, including blocked state, child handoff readiness, child PR creation, user merge observation, stale validation, next-layer readiness, final PR readiness, and cleanup eligibility.
- **TR-007**: Coordinator artifact updates MUST NOT imply that branches, worktrees, PRs, validation, merges, or cleanup states exist before they actually exist.
- **TR-008**: Repeated runs MUST detect existing same-number coordinator artifact paths and either resume when the artifact is proven to belong to the same run or stop on collision before writing files.
- **TR-009**: A blocked coordinator workflow MUST record the blocker in the coordinator artifact when artifact writing is allowed and MUST NOT launch child work.
- **TR-010**: The implementation MUST remain within sidecar workflow artifacts, sidecar-specific skills, and tests or simulations for the workflow; it MUST NOT change CatWorld product runtime behavior.
- **TR-011**: Validation MUST simulate a valid coordinator with at least three child issues, planning while current checkout is `main`, writing only after entering a coordinator branch/worktree, existing same-number artifact resume/collision behavior, a blocked coordinator, local `main` cleanliness after artifact planning, and `git diff --check`.

### Scope Boundaries

- **SB-001**: Feature MUST remain within CatWorld workflow documentation, sidecar-specific skills, sidecar artifact helpers, tests, and source-of-truth materials required for issue #252.
- **SB-002**: Feature MUST preserve the current sequential implementation workflow and MUST NOT activate real sidecar parallel routing before #261.
- **SB-003**: Feature MUST distinguish current build-out branch integration work from the future sidecar coordinator branch model.
- **SB-004**: Feature MUST NOT introduce application runtime, persistence, authorization, security, frontend, backend, database migration, or product behavior changes.

### Out of Scope

- Generating child `spec.md`, `plan.md`, or `tasks.md` artifacts.
- Implementing branch/worktree orchestration beyond the write gate required for coordinator artifact safety.
- Launching child agents.
- Opening sidecar child or coordinator PRs as part of the sidecar workflow.
- Activating sidecar routing for real product use.
- Changing CatWorld application runtime behavior, domain models, persistence, APIs, authorization, frontend UI, or operational deployment behavior.

### Open Questions

- None.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A simulation with at least three child issues verifies the computed coordinator artifact path and required artifact sections.
- **SC-002**: A simulation while the current checkout is `main` verifies that coordinator artifact planning writes no files.
- **SC-003**: A simulation verifies coordinator artifact writing occurs only after the workflow has entered an active coordinator branch/worktree.
- **SC-004**: A simulation verifies existing same-number coordinator artifacts are handled by safe same-run resume or collision stop behavior.
- **SC-005**: A blocked-coordinator simulation verifies the artifact records the blocker without launching child work.
- **SC-006**: Local `main` cleanliness review verifies no sidecar artifacts, sidecar commits, or untracked sidecar files are written during artifact planning.
- **SC-007**: `git diff --check` reports no whitespace errors.

## Assumptions

- Issue #250 is complete and remains the current dependency baseline for dormant sidecar routing.
- Issue #251 is available on the build-out integration branch and defines the executable sidecar lifecycle that this feature extends.
- The build-out integration branch for this implementation is `workflow/sidecar-buildout`; future sidecar lifecycle text that says coordinator branches start from `origin/main` describes the activated sidecar workflow, not this temporary integration strategy.
