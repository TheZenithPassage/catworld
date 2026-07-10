# Feature Specification: Sidecar Child Execution and PR Delivery

**Feature Branch**: `chore/256-implement-sidecar-child-execution-and-child-pr-delivery`

**Created**: 2026-07-10

**Input**: GitHub issue #256, "[Workflow] Implement sidecar child execution and child PR delivery"

## User Scenarios, Technical Outcomes & Testing *(mandatory)*

### Verifiable Technical Outcomes *(use instead of user stories for technical/enabling work)*

- **TO-001**: A sidecar child implementation agent can execute exactly one prepared child handoff from its prepared child checkout and branch.
  - **Why this priority**: Sidecar fan-out only becomes useful when a child agent can take the durable handoff produced by the coordinator and perform focused implementation work without regenerating planning artifacts or drifting into sibling scope.
  - **Acceptance Scenarios**:
    1. **Given** a valid prepared child handoff with child `spec.md`, `plan.md`, `tasks.md`, shared contract, dependency state, branch/worktree state, and validation requirements, **When** the child implementation workflow starts in the prepared child checkout, **Then** it confirms the prepared checkout and branch before editing and implements only the listed child tasks.
    2. **Given** a child implementation request is not a prepared sidecar child handoff, **When** normal direct child issue execution is requested outside sidecar `parallel`, **Then** the existing sequential issue implementation workflow remains the route.
    3. **Given** a prepared child handoff omits required artifacts, branch/worktree context, shared contract, or validation requirements, **When** execution is attempted, **Then** the child workflow stops and reports the missing prepared context instead of rebuilding artifacts with `speckit-specify`, `speckit-plan`, or `speckit-tasks`.
  - **Validation Evidence**: Local sample child handoff execution using a controlled fixture child issue, source review that direct child issue requests still use `.agents/skills/catworld-implement-issue/SKILL.md`, and `git diff --check`.

- **TO-002**: Child delivery opens or updates a child PR against the prepared coordinator branch with correct non-closing issue references and readiness status.
  - **Why this priority**: Sidecar child work must land through the coordinator branch model without accidentally targeting `main`, closing issues, or presenting stale/failed validation as ready.
  - **Acceptance Scenarios**:
    1. **Given** a completed child implementation with fresh passing validation and no unresolved blocker, **When** delivery is permitted by the prepared handoff and repository rules, **Then** the child branch may be committed, pushed normally without force, and delivered through a ready PR targeting the coordinator branch.
    2. **Given** required validation is failed, skipped, stale, timed out, interrupted, partial, not run, or blocked, **When** child delivery is still useful for review, **Then** any PR is draft/not-ready and the final report states the validation status and blocker.
    3. **Given** a child PR body is generated, **When** the issue references are inspected, **Then** it uses `Related to #<child-issue>` and `Related to #<coordinator-issue>` only and contains no closing keywords.
  - **Validation Evidence**: Local delivery simulation or sample PR body review verifying PR target branch, related-only issue wording, draft/ready decision behavior, and `git diff --check`.

- **TO-003**: Child final reports provide complete, honest execution evidence without performing prohibited GitHub or Git cleanup operations.
  - **Why this priority**: The coordinator and human reviewer need to understand what changed, what validation proves, where the child PR is, and which blockers remain without hidden issue mutation or local sidecar cleanup.
  - **Acceptance Scenarios**:
    1. **Given** child execution reaches final reporting, **When** the child report is produced, **Then** it includes changed files, validation commands with explicit statuses, PR URL when delivery occurred, PR readiness, blockers, remaining risks, branch names, commit hashes, and current checkout state.
    2. **Given** the child workflow runs, **When** repository operations are reviewed, **Then** it does not merge, approve, enable auto-merge, mutate GitHub issues, post public comments, delete remote branches, rebase, force-push, or clean local sidecar resources.
    3. **Given** `.agents/skills/catworld-implement-issue/SKILL.md` is inspected after implementation, **When** the diff is reviewed, **Then** that normal sequential workflow skill remains unmodified unless a separate issue explicitly required changing it.
  - **Validation Evidence**: Final-report sample or simulation review, prohibited-operation source review, confirmation that `.agents/skills/catworld-implement-issue/SKILL.md` is unchanged, and `git diff --check`.

### Input/State Validation Matrix *(include when validation or state-sensitive behavior changes)*

| Input or State | Submit/Action Blocked? | API Call Made? | Visible Error or Conflict | Value Transformed or Preserved | Correction Behavior |
|----------------|------------------------|----------------|---------------------------|--------------------------------|---------------------|
| Valid prepared child handoff, expected child checkout, expected child branch, complete prepared artifacts, and delivery permitted | No | N/A until PR creation is explicitly permitted | N/A | Child issue, coordinator issue, coordinator branch, branch/worktree context, and prepared artifacts preserved | N/A |
| Child workflow is not running in the prepared child checkout or expected branch | Yes | No | Report checkout or branch mismatch blocker | Prepared handoff state preserved | Retry only after entering the prepared child checkout and branch |
| Prepared child `spec.md`, `plan.md`, `tasks.md`, shared contract, dependency state, branch/worktree state, or validation requirements are missing | Yes | No | Report missing prepared context | Existing local state preserved; artifacts are not regenerated | Retry after coordinator prepares the missing context |
| Child tasks request work outside the prepared child `tasks.md` | Yes for out-of-scope work | No for out-of-scope delivery | Report task-scope blocker | Prepared child scope preserved | Retry after tasks are corrected by the coordinator or issue workflow |
| Required validation is fresh and passed, with no blocker | No | PR may be opened/updated when delivery is permitted | N/A | Validation evidence preserved in final report and PR readiness | N/A |
| Required validation is failed, skipped, stale, timed out, interrupted, partial, not run, or blocked | No only for draft review delivery when allowed; ready delivery blocked | PR may be opened/updated only as draft/not-ready when useful and allowed | Report explicit validation status and blocker | Validation evidence preserved; status is not summarized as passed | Rerun affected validation after fixes before ready delivery |
| Generated child PR body references child or coordinator issue with closing keywords | Yes | No | Report PR wording blocker | Child and coordinator issue references preserved as related-only intent | Regenerate body with `Related to` references only |
| Child PR target would be `main` instead of the coordinator branch | Yes | No | Report PR target blocker | Coordinator branch target preserved from handoff | Retry only with the prepared coordinator branch target |

### Edge Cases

- A child implementation agent must implement exactly one child issue from a prepared handoff and must not combine sibling child issue scope.
- A child workflow must stop when it cannot prove it is in the prepared child worktree/checkout and branch.
- A child workflow must not run `speckit-specify`, `speckit-plan`, or `speckit-tasks` to replace coordinator-prepared child artifacts.
- Child task execution is limited to tasks listed in the prepared child `tasks.md`; unlisted or sibling work is out of scope.
- Child PR delivery depends on the prepared coordinator branch target and must never target `main`.
- Child PR bodies must use related-only issue references for both child and coordinator issues and must avoid closing keywords.
- Failed, skipped, stale, timed-out, interrupted, partial, not-run, or blocked validation must prevent ready PR status and must be reported honestly.
- Prohibited operations include merge, PR approval, auto-merge, GitHub issue mutation, public comments, remote branch deletion, rebase, force-push, and local sidecar cleanup.
- Direct child issue requests outside sidecar `parallel` continue to use the normal sequential implementation workflow.
- The temporary #256 implementation branch and PR target are `workflow/sidecar-buildout`; future sidecar lifecycle text that says coordinator branches start from `origin/main` still describes the activated sidecar workflow, not this build-out integration strategy.

## Requirements *(mandatory)*

### Technical Requirements *(include for technical, architectural, migration, security, operational, refactoring, or enabling work)*

- **TR-001**: The sidecar child implementation workflow MUST require one prepared child handoff for exactly one child issue.
- **TR-002**: The child workflow MUST use only prepared coordinator artifacts, including child `spec.md`, child `plan.md`, child `tasks.md`, shared contract, dependency state, branch/worktree state, and validation requirements.
- **TR-003**: The child workflow MUST NOT run `speckit-specify`, `speckit-plan`, or `speckit-tasks` to replace the prepared child artifacts.
- **TR-004**: The child workflow MUST confirm it is operating in the prepared child worktree/checkout and expected child branch before editing files.
- **TR-005**: The child workflow MUST implement only tasks listed in the prepared child `tasks.md`.
- **TR-006**: The child workflow MUST run required child validation and report each validation command with an explicit status.
- **TR-007**: The child workflow MAY commit scoped child changes, push the child branch with a normal non-force push, and open or update the child PR only when the prepared handoff and repository rules permit delivery.
- **TR-008**: Child PR delivery MUST target the prepared coordinator branch, not `main`.
- **TR-009**: Child PR bodies MUST use `Related to #<child-issue>` and `Related to #<coordinator-issue>` only for issue references and MUST NOT use closing keywords.
- **TR-010**: Child PRs MUST be draft/not-ready unless required validation is fresh and passed and no unresolved blocker affects readiness.
- **TR-011**: Child execution and delivery MUST NOT merge, approve, enable auto-merge, mutate GitHub issues, post public comments, delete remote branches, rebase, force-push, or clean local sidecar resources.
- **TR-012**: Child final reports MUST include changed files, validation evidence with explicit statuses, PR URL when available, PR readiness, blockers, remaining risks, branch names, commit hashes when available, and current checkout state.
- **TR-013**: Direct child issue requests outside sidecar `parallel` MUST continue to use the normal sequential implementation workflow.
- **TR-014**: Validation MUST include a controlled local sample child handoff execution, PR body wording verification for related-only references and no closing keywords, PR target verification against the coordinator branch, draft/not-ready behavior for failed/skipped/stale/not-run validation, confirmation that `.agents/skills/catworld-implement-issue/SKILL.md` is not modified, and `git diff --check`.

### Scope Boundaries

- **SB-001**: Feature MUST remain within CatWorld sidecar workflow skills, sidecar-specific source-of-truth documentation, local simulations, tests, and related workflow artifacts required for issue #256.
- **SB-002**: Feature MUST build on the prepared child artifact, branch/worktree orchestration, and dependency-layer handoff contracts from issues #253, #254, and #255 as available on `workflow/sidecar-buildout`.
- **SB-003**: Feature MUST preserve normal sequential direct child issue handling outside sidecar `parallel`.
- **SB-004**: Feature MUST distinguish current build-out branch integration work from the future activated sidecar coordinator branch model.
- **SB-005**: Feature MUST NOT introduce CatWorld application runtime, frontend, backend, persistence, authorization, security, database migration, deployment, or product behavior changes.

### Out of Scope

- Coordinator preflight.
- Dependency-layer selection.
- Final coordinator PR to `main`.
- Merging PRs.
- GitHub issue mutation.
- Product behavior outside the prepared child issue scope.
- Activating sidecar coordinator routing before the separately scoped activation issue.
- Modifying `.agents/skills/catworld-implement-issue/SKILL.md` unless a separate issue explicitly requires it.

### Open Questions

- None.

### Key Entities *(include if feature involves data)*

- **Prepared Child Handoff**: Durable sidecar context for exactly one child issue, including child issue body, prepared child Spec Kit artifacts, shared contract, dependency state, branch/worktree state, validation requirements, PR target rules, and out-of-scope boundaries.
- **Child Worktree/Checkout State**: Local filesystem and Git branch context that proves the child agent is operating in the prepared child checkout and branch.
- **Child Task Scope**: The explicit list of executable tasks in the prepared child `tasks.md`; work outside this list is out of scope for the child agent.
- **Child PR Delivery State**: Whether the child branch has been committed, pushed, and delivered to the coordinator branch as a ready or draft PR, including PR URL and readiness reason.
- **Validation Freshness State**: Per-command status proving whether required validation is passed, failed, skipped, stale, timed out, interrupted, partial, blocked, or not run after the latest relevant changes.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A controlled local sample child handoff execution verifies a prepared child can run from its expected checkout/branch and produce a focused child branch diff from the prepared `tasks.md`.
- **SC-002**: PR body verification confirms generated child PR text contains `Related to #<child-issue>` and `Related to #<coordinator-issue>` references and no closing keywords.
- **SC-003**: PR target verification confirms child delivery targets the prepared coordinator branch and never `main`.
- **SC-004**: Validation-readiness verification confirms failed, skipped, stale, timed-out, interrupted, partial, blocked, or not-run validation results in draft/not-ready PR status.
- **SC-005**: Source review confirms `.agents/skills/catworld-implement-issue/SKILL.md` is not modified and direct child issue requests outside sidecar `parallel` still use the normal sequential workflow.
- **SC-006**: `git diff --check` reports no whitespace errors.

## Assumptions

- Issues #253, #254, and #255 are integrated into `workflow/sidecar-buildout` and provide the prepared child artifacts, branch/worktree state, and child handoff context that #256 consumes.
- Child PR creation may be represented by local simulations or sample artifacts when exercising real GitHub PR creation would mutate repository state outside the controlled issue branch.
- The active implementation branch for this issue starts from `origin/workflow/sidecar-buildout` and the delivery PR targets `workflow/sidecar-buildout`; future sidecar coordinator branches described by this feature still follow the activated sidecar workflow model rather than this temporary build-out branch strategy.
