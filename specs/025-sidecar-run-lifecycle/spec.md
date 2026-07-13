# Feature Specification: Sidecar Run Lifecycle

**Feature Branch**: `docs/251-define-executable-sidecar-run-lifecycle`

**Created**: 2026-07-08

**Input**: GitHub issue #251, "[Workflow] Define the executable sidecar run lifecycle"

## User Scenarios, Technical Outcomes & Testing *(mandatory)*

### Verifiable Technical Outcomes *(use instead of user stories for technical/enabling work)*

- **TO-001**: Sidecar coordinator workflow sources describe a complete executable lifecycle for a future eligible coordinator `parallel` run, from new run through final coordinator PR and post-final-merge cleanup eligibility.
  - **Why this priority**: Future sidecar execution must have concrete state transitions and safety boundaries before #261 can activate controlled routing.
  - **Acceptance Scenarios**:
    1. **Given** a maintainer reviews sidecar workflow sources, **When** they trace a new coordinator `parallel` run, **Then** every lifecycle state has clear entry conditions, stop conditions, and allowed next states.
    2. **Given** a sidecar run has dependency-ready child issues, **When** the lifecycle is reviewed, **Then** it launches only one dependency-ready layer and preserves hard dependencies between layers.
    3. **Given** all child PRs have been integrated into the coordinator branch, **When** the lifecycle is reviewed, **Then** it proceeds to integrated coordinator validation and final coordinator PR delivery.
  - **Validation Evidence**: Manual routing matrix, manual lifecycle matrix, and issue-required search review.

- **TO-002**: Sidecar artifact path and content planning is explicitly separated from artifact writing, and writing is allowed only after Codex has created or entered the coordinator branch/worktree.
  - **Why this priority**: Local `main` must remain clean and must not receive sidecar artifacts, commits, or untracked files while a future sidecar run is being planned.
  - **Acceptance Scenarios**:
    1. **Given** Codex is still on `main`, **When** it performs sidecar preflight and artifact planning, **Then** it may plan artifact paths and contents but must not write sidecar artifact files.
    2. **Given** Codex cannot safely create or enter the coordinator branch/worktree, **When** artifact writing would be next, **Then** it stops before modifying files.
    3. **Given** Codex has entered the coordinator branch/worktree, **When** coordinator or child artifacts are written, **Then** the artifacts are written only inside that coordinator branch/worktree.
  - **Validation Evidence**: Manual lifecycle matrix proving planning/write separation, coordinator branch/worktree write boundary, and local `main` cleanliness.

- **TO-003**: Routing guidance distinguishes current dormant build-out behavior from post-#261 activated sidecar behavior while preserving the existing sequential default workflow.
  - **Why this priority**: #251 defines executable future behavior but must not activate real sidecar product work before #261 is completed and accepted.
  - **Acceptance Scenarios**:
    1. **Given** a normal issue or direct child issue, **When** active routing guidance is reviewed, **Then** it still routes to the sequential `catworld-implement-issue` workflow.
    2. **Given** a non-coordinator issue with `parallel`, **When** active routing guidance is reviewed, **Then** it still stops with a routing error.
    3. **Given** an eligible coordinator issue with `parallel`, **When** current build-out behavior is reviewed, **Then** it reports sidecar parallel is not active until #261; **When** post-#261 behavior is reviewed, **Then** it starts or resumes the sidecar workflow according to the lifecycle.
    4. **Given** a coordinator issue without `parallel`, **When** active routing guidance is reviewed, **Then** it follows the existing open-child and closed-child coordinator guardrails.
  - **Validation Evidence**: Manual routing matrix covering current and post-#261 states plus issue-required search review.

### Edge Cases

- A valid future sidecar run may reach a waiting state where child PRs exist but required user-owned merges into the remote coordinator branch are incomplete; the lifecycle must report exactly what the user must merge before resuming.
- A resumed sidecar coordinator run must refresh the local coordinator branch/worktree from the remote coordinator branch before proceeding.
- Active child branches after a coordinator refresh may be updated only by fast-forward or normal merge from the updated local coordinator branch; history rewriting is not allowed.
- Dependency layers may contain multiple independent child issues, but a hard-dependent child layer must not start until its prerequisites are integrated.
- Coordinator and child artifact paths and content may be planned before branch/worktree preparation, but no artifact files may be written while the active checkout is `main`.
- Remaining inactive, adoption-gate, or future-facing wording is acceptable only when it cannot be read as activating sidecar product work before #261.
- Child PR delivery may target the coordinator branch for integration, but user-owned merges remain separate from Codex-owned implementation and PR preparation.

## Requirements *(mandatory)*

### Technical Requirements *(include for technical, architectural, migration, security, operational, refactoring, or enabling work)*

- **TR-001**: Sidecar workflow sources MUST define the lifecycle states for new coordinator `parallel` run, coordinator preflight, source-of-truth and child issue inspection, artifact path/content planning, dependency-layer planning, coordinator branch/worktree preparation, coordinator and child artifact writing, child branch/worktree preparation, dependency-ready child launch, child implementation and child PR delivery, waiting for user merges, resume after merges, coordinator branch refresh, active child branch refresh, next dependency layer execution, integrated coordinator validation, final coordinator PR to `main`, and post-final-merge cleanup eligibility.
- **TR-002**: Each lifecycle state MUST have objectively reviewable entry conditions, stop conditions, and allowed next states.
- **TR-003**: The lifecycle MUST explicitly separate Codex-owned operations from user-owned merges, including the waiting and resume behavior for child PRs merged into the remote coordinator branch.
- **TR-004**: Dependency-layer planning MUST preserve hard dependencies and MUST NOT launch multiple hard-dependent layers at once.
- **TR-005**: Artifact path and content planning MAY occur before coordinator branch/worktree preparation, but artifact files MUST NOT be written until Codex has created or entered the coordinator branch/worktree.
- **TR-006**: If Codex cannot create or enter the coordinator branch/worktree safely, the lifecycle MUST stop before modifying files.
- **TR-007**: Local `main` MUST remain clean during sidecar planning, with no sidecar artifacts, sidecar commits, or untracked sidecar files.
- **TR-008**: Coordinator and child artifacts MUST be written only inside the coordinator branch/worktree.
- **TR-009**: Child branch/worktree preparation MUST be based on the coordinator branch/worktree state defined by the lifecycle, and child branch refresh from an updated coordinator branch MUST use fast-forward or normal merge only.
- **TR-010**: Child implementation guidance MUST treat child agents as executors of coordinator-provided artifacts, not product or architecture decision makers.
- **TR-011**: Sidecar routing guidance MUST define current build-out behavior and post-#261 activated behavior for normal issues, direct child issues, non-coordinator `parallel`, eligible coordinator `parallel`, blocked coordinator `parallel`, waiting coordinator runs, resumed coordinator runs, all-child-integrated coordinator runs, and closed-child coordinator final passes.
- **TR-012**: Current active routing MUST preserve the existing sequential default workflow and MUST NOT activate real sidecar product use before #261 is completed and accepted.
- **TR-013**: Remaining inactive, adoption-gate, or future-facing sidecar wording MUST be intentional and MUST NOT be readable as permission to run sidecar product work early.
- **TR-014**: Validation MUST include the issue-required routing matrix, lifecycle matrices for artifact planning/write separation and branch/worktree write boundaries, local `main` cleanliness review, inactive/adoption-gate wording review, required search command, and `git diff --check`.

### Scope Boundaries

- **SB-001**: Feature MUST remain within CatWorld workflow documentation, sidecar-specific skills, and sidecar workflow source-of-truth materials.
- **SB-002**: Feature MUST distinguish executable future lifecycle documentation from currently active routing behavior.
- **SB-003**: Feature MUST preserve the current sequential implementation workflow for normal issues, direct child issues, and coordinator final passes where applicable.
- **SB-004**: Feature MUST NOT introduce application runtime, persistence, authorization, security, frontend, backend, or product behavior changes.

### Out of Scope

- Implementing branch/worktree commands.
- Launching real child agents.
- Opening real child or coordinator PRs as part of sidecar execution.
- Activating sidecar routing for real product use.
- Declaring the sidecar workflow adopted for product use before the live controlled dry-run passes.
- Removing inactive or adoption-gate wording that belongs to #261 after controlled activation.
- Changing CatWorld application runtime behavior, domain models, persistence, APIs, authorization, frontend UI, or operational deployment behavior.

### Open Questions

- None.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Manual routing review covers normal issue, direct child issue, non-coordinator `parallel`, valid coordinator `parallel`, blocked coordinator `parallel`, coordinator waiting for user merge, resumed coordinator, all-child-integrated coordinator, and closed-child coordinator final-pass states, and distinguishes current build-out behavior from post-#261 activated behavior.
- **SC-002**: Manual lifecycle review proves artifact path/content planning is separate from artifact writing.
- **SC-003**: Manual lifecycle review proves coordinator and child artifacts are written only inside the coordinator branch/worktree.
- **SC-004**: Manual lifecycle review proves local `main` remains clean during sidecar planning.
- **SC-005**: The required search command reports remaining inactive/adoption-gate wording that is intentional until #261 and not readable as early sidecar activation.
- **SC-006**: `git diff --check` reports no whitespace errors.

## Assumptions

- Issue #250 is complete and remains the current dependency baseline for dormant sidecar routing and sequential default behavior.
- The active sidecar lifecycle sources are expected to include sidecar-specific skills and workflow documentation already present in the repository; the implementation plan will confirm the exact source map before edits.
- No database, API, frontend, backend, security, authorization, migration, or deployment behavior changes are intended.
