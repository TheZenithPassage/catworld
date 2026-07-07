# Feature Specification: Sidecar Resume State

**Feature Branch**: `chore/232-add-resumable-state-tracking-for-sidecar-coordinator-runs`

**Created**: 2026-07-07

**Input**: GitHub issue #232: "[Workflow] Add resumable state tracking for sidecar coordinator runs"

## User Scenarios, Technical Outcomes & Testing *(mandatory)*

### Verifiable Technical Outcomes *(use instead of user stories for technical/enabling work)*

- **TO-001**: Sidecar coordinator artifacts record enough child-level state for a later session to identify completed, active, blocked, and pending child work without private conversation context.
  - **Why this priority**: Sidecar coordinator work can pause across sessions, user merges, blockers, or validation failures; resume must be based on repository and GitHub evidence rather than chat memory.
  - **Acceptance Scenarios**:
    1. **Given** a sidecar coordinator run has one completed child, one active child branch, one blocked child, and one pending child, **When** a later session reads the coordinator artifact, **Then** it can identify each child's artifact path, branch, local checkout, PR, validation state, status, and blocker state.
    2. **Given** a sidecar child has no started branch or checkout, **When** the coordinator artifact is reviewed, **Then** the child is identifiable as pending without implying local state exists.
    3. **Given** a sidecar child has an unresolved blocker, **When** resume state is reviewed, **Then** the blocker is visible with the affected child and required next action or decision.
  - **Validation Evidence**: Local sample coordinator resume artifact containing completed, active, blocked, and pending children.

- **TO-002**: Sidecar resume guidance defines the repository and GitHub evidence that must be re-read before continuing and marks stale branch or validation state explicitly.
  - **Why this priority**: Resuming safely requires current evidence about issue and PR state, coordinator branch state, child branches or worktrees, and validation freshness.
  - **Acceptance Scenarios**:
    1. **Given** a new Codex session resumes sidecar coordinator work, **When** it begins resume, **Then** the workflow requires re-reading the coordinator issue, child issues, relevant PRs, coordinator artifact, child artifacts, branch state, local checkout or worktree state, and validation evidence before acting.
    2. **Given** a child PR was merged into the coordinator branch after another child was validated, **When** resume state is reviewed, **Then** the still-active child branch or worktree is marked as needing refresh from the coordinator branch and affected validation is stale until rerun.
    3. **Given** validation failed or was not run before a pause, **When** the coordinator run resumes, **Then** the non-passed validation status remains visible and is not treated as ready.
  - **Validation Evidence**: Resume simulation after one merged child PR, one active branch, and one blocked child issue; sample state shows stale validation and refresh requirements.

- **TO-003**: Sidecar resume rules preserve approved Git, cleanup, and non-sidecar boundaries.
  - **Why this priority**: Issue #232 extends sidecar resumability only and must not weaken the approved no-rebase, no-force-push, cleanup, or normal sequential workflow boundaries from issues #229 and #231.
  - **Acceptance Scenarios**:
    1. **Given** a child PR has merged into the coordinator branch and another sidecar child branch remains active, **When** the active branch or worktree is refreshed, **Then** the workflow uses a normal merge from the coordinator branch and does not rebase or force-push.
    2. **Given** an individual child PR has merged into the coordinator branch, **When** cleanup is considered, **Then** local sidecar worktrees or branches are not deleted yet.
    3. **Given** the final coordinator PR has merged into `main`, **When** cleanup is considered, **Then** only local branches and worktrees created by the sidecar workflow are eligible for cleanup, and remote branch deletion, remote pruning, or remote cleanup still requires explicit user approval.
    4. **Given** normal sequential issue implementation or a closed-child coordinator final pass runs, **When** state handling is selected, **Then** it uses normal sequential state handling rather than sidecar resumability state.
  - **Validation Evidence**: Local simulations for normal-merge refresh, cleanup eligibility after final coordinator PR merge, and closed-child coordinator final-pass boundary review.

### Input/State Validation Matrix *(include when validation or state-sensitive behavior changes)*

| Workflow State | Resume State Required | Branch/Checkout Treatment | Validation Treatment | Cleanup Treatment |
|----------------|-----------------------|---------------------------|----------------------|-------------------|
| Child work completed and PR merged into coordinator branch | Child status, PR, merged state, artifact path, and validation evidence retained | Completed child branch or checkout remains recorded; no automatic local deletion after child merge | Evidence retained for traceability; coordinator or dependent active branches may need fresh validation | No cleanup after individual child merge |
| Child work active when another child PR merges | Child status, branch, local checkout/worktree, PR if any, and refresh state recorded | Active branch/worktree must be refreshed from coordinator branch using normal merge only | Affected validation is stale until rerun after refresh | No cleanup |
| Child work blocked | Child status, artifact path, branch/checkout if created, blocker, and required next action recorded | Existing local state remains recorded; unresolved blockers stop affected work | Validation is blocked, failed, stale, or not run as applicable | No cleanup |
| Child work pending | Child status and child artifact path recorded; branch, checkout, PR, validation, and blockers may be empty or not started | No branch or checkout is implied | Validation not run | No cleanup |
| Paused or new session resumes sidecar coordinator work | Coordinator issue, child issues, PRs, artifacts, branch state, local checkout/worktree state, and validation evidence must be re-read | Continue only after comparing recorded state with current repository/GitHub evidence | Stale, failed, skipped, partial, or not-run evidence is visible and not passed | No cleanup unless final coordinator PR is already merged into `main` |
| Final coordinator PR merged into `main` | Final coordinator PR merged state verified | Local sidecar-created branches/worktrees become cleanup-eligible only after verification | Final evidence remains reportable | Local cleanup eligible; remote cleanup requires explicit user approval |
| Normal sequential issue or closed-child coordinator final pass | Existing sequential state only | Normal sequential branch handling | Normal sequential validation/reporting | Sidecar cleanup state does not apply |

### Edge Cases

- A resumed session sees a child PR marked merged in GitHub but the local coordinator branch has not been updated to include it.
- A sidecar child branch has been refreshed from the coordinator branch, but validation was not rerun afterward.
- A sidecar child artifact exists, but the branch or local checkout recorded in the coordinator artifact no longer exists locally.
- A paused run resumes with a blocked child whose blocker affects the shared contract or other children.
- A child PR merge occurs while multiple active sidecar branches or worktrees still need refresh.
- Cleanup is requested after a child PR merge but before the final coordinator PR has merged into `main`.
- A remote branch deletion, remote prune, or other remote cleanup request appears during resume.
- A closed-child coordinator final pass mentions closed child issues for traceability but must not use sidecar resumability state.

## Requirements *(mandatory)*

### Technical Requirements *(include for technical, architectural, migration, security, operational, refactoring, or enabling work)*

- **TR-001**: Sidecar coordinator artifacts MUST include a status table or equivalent structured section for child issue state.
- **TR-002**: Each sidecar child status entry MUST track child artifact path, branch, local checkout or worktree, PR, validation state, workflow status, and blockers when those values exist.
- **TR-003**: Sidecar child workflow status MUST distinguish completed, active, blocked, pending, and paused or resume-needed states clearly enough for a later session to continue without private conversation context.
- **TR-004**: Sidecar resume state MUST track whether active sidecar branches or worktrees have been refreshed from the coordinator branch after child PR merges.
- **TR-005**: Sidecar resume guidance MUST define the GitHub and repository evidence to re-read before continuing, including coordinator issue, child issues, relevant PRs, coordinator artifact, child artifacts, coordinator branch state, sidecar branch state, local checkout or worktree state, and validation evidence.
- **TR-006**: Sidecar resume guidance MUST define required status updates after user merges, failed validation, paused work, blockers, and resumed sessions.
- **TR-007**: After a child PR merge into the coordinator branch, resumed active sidecar branches or worktrees MUST be refreshed from the coordinator branch using normal merge only.
- **TR-008**: Sidecar resume guidance MUST prohibit rebase, force-push, and history-rewriting updates as part of resume.
- **TR-009**: Sidecar resume guidance MUST prohibit deleting local sidecar worktrees or branches after individual child PR merges.
- **TR-010**: Sidecar cleanup guidance MUST make local cleanup eligible only after the final coordinator PR has merged into `main`.
- **TR-011**: Sidecar cleanup guidance MUST limit eligible local cleanup to branches and worktrees created by the sidecar workflow.
- **TR-012**: Sidecar cleanup guidance MUST require explicit user approval before remote branch deletion, remote pruning, or remote cleanup.
- **TR-013**: Normal sequential issue implementation state handling MUST remain unchanged.
- **TR-014**: Closed-child coordinator final passes MUST use normal sequential state handling, not sidecar resumability state.
- **TR-015**: Validation MUST simulate resume after one merged child PR, one active branch, and one blocked child issue.
- **TR-016**: Validation MUST simulate refreshing an active child branch or worktree from the coordinator branch using normal merge.
- **TR-017**: Validation MUST confirm no rebase, force-push, local cleanup after child PR merge, or remote cleanup occurs without explicit approval.
- **TR-018**: Validation MUST simulate cleanup eligibility only after final coordinator PR merge.
- **TR-019**: Validation MUST simulate a closed-child coordinator final pass and confirm normal sequential handling.
- **TR-020**: Manual validation MUST review the result against issues #229 and #231.

### Scope Boundaries

- **SB-001**: Feature MUST remain within the CatWorld cat-boarding domain and repository workflow infrastructure.
- **SB-002**: Feature MUST distinguish implemented behavior from assumptions, exclusions, and unresolved product or architectural questions.
- **SB-003**: Feature MUST NOT introduce cross-species abstractions, multi-tenancy, generic platform claims, or permanent product limits without explicit requirements.
- **SB-004**: Feature MUST only add resumable state tracking for the sidecar coordinator workflow; normal sequential issue implementation state remains unchanged.
- **SB-005**: Feature depends on completed issues #227, #229, and #231 and must remain aligned with parent epic #220.
- **SB-006**: Feature MUST preserve the sidecar Git execution rules approved in issue #229 and the validation, blocker, and conflict reporting boundaries from issue #231.

### Out of Scope

- Background work.
- GitHub comments.
- Normal issue workflow changes.
- CatWorld product application implementation.
- Remote cleanup without explicit user approval.
- Using sidecar parallel mode to implement this issue.

### Open Questions

- None.

### Key Entities *(include if feature involves data)*

- **Sidecar Coordinator Resume State**: The coordinator-level record of child issue progress, branch/checkouts, PRs, validation freshness, refresh state, blockers, and cleanup eligibility.
- **Child Status Entry**: One row or section for a child issue that records artifact path, branch, local checkout/worktree, PR, validation state, workflow status, and blockers.
- **Refresh State**: Evidence that an active child branch or worktree is current with the coordinator branch after child PR merges, or needs a normal merge refresh.
- **Validation State**: The recorded status and freshness of required validation for a child or coordinator branch.
- **Cleanup Eligibility State**: The explicit state that local sidecar-created branch/worktree cleanup is not eligible until the final coordinator PR is merged into `main`, and remote cleanup still requires explicit approval.
- **Closed-Child Coordinator Final Pass**: The existing sequential final-pass workflow for a coordinator whose listed child issues are already closed; it remains outside sidecar resumability state.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A local sample coordinator resume artifact identifies completed, active, blocked, and pending child work with artifact path, branch, local checkout/worktree, PR, validation state, status, and blocker fields.
- **SC-002**: Resume guidance lists the GitHub and repository evidence that must be re-read before continuing and shows stale validation or stale branch state explicitly.
- **SC-003**: A local refresh simulation shows an active child branch or worktree updated from the coordinator branch using normal merge only.
- **SC-004**: Review confirms resume guidance prohibits rebase, force-push, history rewriting, local cleanup after individual child PR merges, and remote cleanup without explicit user approval.
- **SC-005**: A cleanup simulation shows local cleanup eligibility only after the final coordinator PR has merged into `main` and limits cleanup to sidecar-created local branches/worktrees.
- **SC-006**: A closed-child coordinator final-pass sample uses normal sequential state handling and does not use sidecar resumability state.
- **SC-007**: Manual review against issues #229 and #231 finds the sidecar resume state consistent with approved Git, validation, blocker, conflict, and reporting boundaries.

## Assumptions

- No product behavior, persistence schema, API contract, authorization rule, or user-facing application copy changes are required for this workflow-only issue.
