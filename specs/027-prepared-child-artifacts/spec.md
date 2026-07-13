# Feature Specification: Prepared Child Spec Kit Artifacts

**Feature Branch**: `chore/253-generate-prepared-child-spec-kit-artifacts`

**Created**: 2026-07-09

**Input**: GitHub issue #253, "[Workflow] Generate prepared child Spec Kit artifacts before sidecar delegation"

## User Scenarios, Technical Outcomes & Testing *(mandatory)*

### Verifiable Technical Outcomes *(use instead of user stories for technical/enabling work)*

- **TO-001**: A valid future sidecar coordinator `parallel` run prepares issue-numbered child `spec.md`, `plan.md`, and `tasks.md` artifacts before any child agent can be launched.
  - **Why this priority**: Child agents must receive complete, issue-scoped Spec Kit artifacts from the coordinator instead of regenerating artifacts from private conversation context.
  - **Acceptance Scenarios**:
    1. **Given** a coordinator issue with at least three listed child issues and the required source context, **When** child artifact planning completes, **Then** each child has a planned path of `specs/<child-issue-number>-<child-slug>/` containing planned `spec.md`, `plan.md`, and `tasks.md` artifacts.
    2. **Given** a dependency-ready child lacks any of the prepared `spec.md`, `plan.md`, or `tasks.md` artifacts, **When** fan-out readiness is evaluated, **Then** child delegation is blocked until the artifact set is safely prepared.
    3. **Given** a child executor receives a sidecar handoff, **When** handoff context is reviewed, **Then** it includes the prepared child artifact path and artifact set, and instructs the child executor not to regenerate those artifacts independently.
  - **Validation Evidence**: Local simulation of one coordinator with at least three child issues and review of the generated child artifact paths, contents, coordinator artifact status, and handoff rules.

- **TO-002**: Child artifacts are written only after the coordinator branch/worktree is active and never to local `main`.
  - **Why this priority**: Issue #253 extends the #252 write boundary to child artifacts, so artifact planning must remain safe while the current checkout is `main`.
  - **Acceptance Scenarios**:
    1. **Given** the active checkout is `main`, **When** child artifact paths and contents are planned, **Then** no `specs/<child-issue-number>-<child-slug>/` files or directories are written.
    2. **Given** Codex cannot safely create or enter the coordinator branch/worktree, **When** child artifact writing would be next, **Then** the workflow stops before modifying files.
    3. **Given** Codex has entered the coordinator branch/worktree, **When** child artifact writing is allowed, **Then** each child artifact set is written only in that active coordinator context.
  - **Validation Evidence**: Local write-gate simulations for planning on `main`, writing after entering a coordinator branch/worktree, and local `main` cleanliness.

- **TO-003**: Child artifact preparation validates shared-contract availability, child scope isolation, duplicate child numbers, and existing artifact collisions before delegation.
  - **Why this priority**: The sidecar workflow must stop instead of inventing shared decisions, overwriting unrelated artifacts, duplicating child issue identity, or giving a child agent sibling scope.
  - **Acceptance Scenarios**:
    1. **Given** the shared implementation contract is missing or conflicting, **When** child artifact preparation is evaluated, **Then** the coordinator stops instead of inventing a seed, foundation, or shared-contract child issue.
    2. **Given** an existing target child artifact path, same-number prefix, or duplicate child issue number cannot be proven to belong to the same resumable sidecar run, **When** preparation starts, **Then** the coordinator stops before writing files.
    3. **Given** a prepared child artifact attempts to include sibling child scope, **When** artifact scope is validated, **Then** the run stops before delegation.
    4. **Given** child artifacts are prepared safely, **When** the coordinator artifact is inspected, **Then** it records each child artifact path and preparation status.
  - **Validation Evidence**: Local simulations for missing shared contract, sibling-scope rejection, existing path/same-number/duplicate-child stops, and coordinator artifact preparation-status review.

### Edge Cases

- Child artifact path and content planning may happen before branch/worktree preparation, but it is planning-only until the coordinator branch/worktree is active.
- An active checkout on `main` must stop or enter the coordinator branch/worktree before any child artifact file or directory is written.
- If Codex cannot safely create or enter the coordinator branch/worktree, it must stop before modifying files.
- Existing target artifact paths, same-number prefixes, or duplicate child issue numbers must stop the workflow unless current sidecar state proves this is the same resumable run.
- A missing or conflicting shared implementation contract blocks delegation and must not be solved by inventing a seed, foundation, or shared-contract issue.
- Child artifacts must preserve the child issue scope exactly and must not include sibling child scope.
- Child artifacts must not make human-only product, architecture, security, persistence, UX, domain, GitHub, or deployment decisions.
- Local `main` must remain clean: no sidecar child artifacts, sidecar commits, or untracked sidecar files.

## Requirements *(mandatory)*

### Technical Requirements *(include for technical, architectural, migration, security, operational, refactoring, or enabling work)*

- **TR-001**: For each listed child issue in a valid future coordinator `parallel` run, the sidecar coordinator workflow MUST plan child artifacts under `specs/<child-issue-number>-<child-slug>/`.
- **TR-002**: Each planned child artifact set MUST include `spec.md`, `plan.md`, and `tasks.md`.
- **TR-003**: Child artifact paths and contents MAY be planned before coordinator branch/worktree preparation, but child artifact files and directories MUST be written only after the coordinator branch/worktree is active.
- **TR-004**: If the active checkout is `main`, the workflow MUST stop or create/enter the coordinator branch/worktree before writing child artifacts.
- **TR-005**: If Codex cannot create or enter the coordinator branch/worktree safely, the workflow MUST stop before modifying files.
- **TR-006**: Local `main` MUST remain clean and MUST NOT receive child sidecar artifacts, sidecar commits, or untracked sidecar files.
- **TR-007**: Generated child artifacts MUST derive from the coordinator issue body, child issue body, relevant parent epic context, coordinator orchestration artifact, shared implementation contract, dependency layer classification, source-of-truth repository docs, and current repository state.
- **TR-008**: Generated child artifacts MUST preserve the child issue scope exactly and MUST NOT expand into sibling child scope.
- **TR-009**: Generated child artifacts MUST NOT make human-only product, architecture, security, persistence, UX, domain, GitHub, or deployment decisions.
- **TR-010**: Missing or conflicting shared implementation contract state MUST block delegation instead of causing Codex to invent a seed, foundation, or shared-contract child issue.
- **TR-011**: Missing prepared child artifacts for any dependency-ready child MUST block fan-out.
- **TR-012**: Existing target child artifact paths, same-number prefixes, and duplicate child issue numbers MUST stop preparation unless current sidecar state proves the same resumable run owns them.
- **TR-013**: The coordinator artifact MUST record each child artifact path and preparation status.
- **TR-014**: Child handoff instructions MUST require child agents to consume the prepared artifacts and MUST NOT permit child agents to regenerate them independently.
- **TR-015**: Validation MUST simulate at least one coordinator with three child issues, planning while current checkout is `main`, writing only after coordinator branch/worktree entry, missing shared-contract stop behavior, sibling-scope stop behavior, local `main` cleanliness, and `git diff --check`.

### Scope Boundaries

- **SB-001**: Feature MUST remain within CatWorld workflow documentation, sidecar-specific skills, sidecar artifact contracts, local simulations, and source-of-truth materials required for issue #253.
- **SB-002**: Feature MUST preserve the current sequential implementation workflow and MUST NOT activate real sidecar parallel routing before #261.
- **SB-003**: Feature MUST distinguish current build-out branch integration work from the future sidecar coordinator branch model.
- **SB-004**: Feature MUST NOT introduce application runtime, persistence, authorization, security, frontend, backend, database migration, or product behavior changes.

### Out of Scope

- Creating branches or worktrees beyond the child artifact write gate required here.
- Launching child agents.
- Opening sidecar child or coordinator pull requests as part of the sidecar workflow.
- Implementing CatWorld product behavior.
- Changing normal sequential Spec Kit naming.
- Mutating GitHub issue state, labels, comments, milestones, or assignees.
- Activating sidecar routing for real product use before #261.

### Open Questions

- None.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A simulation with at least three child issues verifies the computed `specs/<child-issue-number>-<child-slug>/` paths and planned `spec.md`, `plan.md`, and `tasks.md` content for every child.
- **SC-002**: A simulation while the current checkout is `main` verifies that child artifact planning writes no files.
- **SC-003**: A simulation verifies child artifact writing occurs only after the workflow has entered an active coordinator branch/worktree.
- **SC-004**: A simulation verifies missing shared implementation contract state stops delegation instead of inventing a seed or foundation issue.
- **SC-005**: A simulation verifies sibling-scope leakage in a child artifact stops the run before delegation.
- **SC-006**: Coordinator artifact review verifies each child artifact path and preparation status is recorded.
- **SC-007**: Local `main` cleanliness review verifies no sidecar child artifacts, sidecar commits, or untracked sidecar files are written during child artifact planning.
- **SC-008**: `git diff --check` reports no whitespace errors.

## Assumptions

- Issue #252 is complete on the build-out integration branch and remains the baseline for coordinator artifact identity, write-gated artifact creation, factual state updates, and same-run resume versus collision-stop handling.
- The build-out integration branch for this implementation is `workflow/sidecar-buildout`; future sidecar lifecycle text that says coordinator branches start from `origin/main` describes the activated sidecar workflow, not this temporary integration strategy.
