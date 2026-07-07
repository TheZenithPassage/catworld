# Feature Specification: Sidecar Git Rules

**Feature Branch**: `chore/229-add-sidecar-git-execution-rules`

**Created**: 2026-07-07

**Input**: GitHub issue #229: "[Workflow] Add sidecar Git execution rules"

## User Scenarios, Technical Outcomes & Testing *(mandatory)*

### Verifiable Technical Outcomes *(use instead of user stories for technical/enabling work)*

- **TO-001**: The sidecar coordinator workflow defines a safe Git model for coordinator integration branches, child implementation branches, isolated local checkouts, and deterministic naming.
  - **Why this priority**: The workflow cannot safely delegate parallel child work until every branch and checkout target is predictable, isolated, and collision-aware.
  - **Acceptance Scenarios**:
    1. **Given** a coordinator issue approved for explicit `parallel` execution, **When** the sidecar coordinator prepares execution, **Then** it creates or records one coordinator integration branch from current `origin/main` and derives deterministic child branch and checkout names from issue numbers and slugs.
    2. **Given** a child implementation is delegated from the sidecar coordinator, **When** its branch and checkout are prepared, **Then** the child branch starts from the coordinator branch and the child works in an isolated local checkout or worktree.
    3. **Given** a deterministic branch or checkout name already exists, **When** the sidecar workflow cannot prove it is the intended reusable sidecar resource, **Then** execution stops instead of guessing or overwriting.
  - **Validation Evidence**: Local workflow simulation with one coordinator branch and two child branches, plus manual review of branch and checkout state recording.

- **TO-002**: Sidecar child pull request targeting and branch refresh rules protect the coordinator branch and never rewrite sidecar history.
  - **Why this priority**: Parallel child integration must preserve review boundaries and avoid destructive Git operations while the coordinator branch is active.
  - **Acceptance Scenarios**:
    1. **Given** a sidecar child branch is ready for review, **When** PR guidance is produced, **Then** the child PR target is the coordinator branch, not `main`.
    2. **Given** the user merges one child PR into the coordinator branch while other child branches remain active, **When** those active branches need the latest coordinator state, **Then** they are refreshed by a normal merge from the coordinator branch only.
    3. **Given** sidecar branches are active, **When** refresh or delivery guidance is reviewed, **Then** rebase, force-push, and history-rewriting updates are explicitly disallowed.
  - **Validation Evidence**: Simulation of a child PR merge into the coordinator branch followed by a normal merge refresh of another active child branch; workflow text review for absent rebase, force-push, and direct-to-`main` child PR instructions.

- **TO-003**: Sidecar cleanup and non-sidecar workflow boundaries are explicit.
  - **Why this priority**: Cleanup and fallback rules must not silently affect normal issue work, closed-child coordinator final passes, or remote resources.
  - **Acceptance Scenarios**:
    1. **Given** one child PR has been merged into the coordinator branch but the final coordinator PR is not merged into `main`, **When** cleanup eligibility is evaluated, **Then** local sidecar worktrees and branches are retained.
    2. **Given** the final coordinator PR has been merged into `main`, **When** cleanup is considered, **Then** only local branches and worktrees created by the sidecar workflow are eligible, and remote branch deletion or pruning still requires explicit user approval.
    3. **Given** direct child issue work outside `parallel` or a closed-child coordinator final pass, **When** Git rules are selected, **Then** the normal sequential workflow remains in force instead of the sidecar branch model.
  - **Validation Evidence**: Cleanup eligibility simulation and manual review against #220 routing and operational guardrails.

### Input/State Validation Matrix *(include when validation or state-sensitive behavior changes)*

| Workflow State | Execution Allowed? | Branch or Checkout Contract | Required Action | Blocker or Safety Rule |
|----------------|--------------------|-----------------------------|-----------------|------------------------|
| Coordinator issue enters explicit `parallel` sidecar workflow | Yes, after sidecar preflight approves execution | One coordinator integration branch starts from current `origin/main`; state is recorded in the coordinator artifact | Prepare coordinator branch and deterministic sidecar names | Stop on unrecoverable branch, checkout, or naming collisions |
| Child implementation starts from prepared sidecar artifacts | Yes | Child branch starts from the coordinator branch; child checkout or worktree is isolated | Prepare child branch and local checkout from recorded coordinator state | Child PR must target coordinator branch, not `main` |
| Child PR merged into coordinator branch while other child branches remain active | Yes | Active child branches remain sidecar branches | Update each still-active child branch from the coordinator branch using a normal merge | Rebase, force-push, and history-rewriting updates are disallowed |
| Individual child PR has merged but final coordinator PR is not merged into `main` | No cleanup | Local sidecar branches and worktrees are retained | Continue tracking active sidecar state | Do not delete local sidecar worktrees or branches |
| Final coordinator PR merged into `main` | Cleanup eligible | Only local resources created by the sidecar workflow are in scope | Local cleanup may be performed when explicitly requested by the workflow/user | Remote cleanup requires explicit user approval |
| Direct child issue outside `parallel` or closed-child coordinator final pass | Yes, but through normal workflow | Normal sequential issue branch and checkout rules apply | Use the existing sequential workflow | Sidecar coordinator branch model does not apply |

### Edge Cases

- Existing local branch or checkout path collides with the deterministic sidecar name and cannot be confirmed as the intended sidecar resource.
- A sidecar child branch is accidentally prepared to target or PR into `main`.
- A still-active child branch falls behind after another child PR is merged into the coordinator branch.
- Cleanup is requested after an individual child PR merge but before the final coordinator PR has merged into `main`.
- Cleanup would affect a branch, worktree, or remote resource not created by the sidecar workflow.
- Direct child issue work or a closed-child coordinator final pass could be confused with sidecar parallel Git rules.

## Requirements *(mandatory)*

### Technical Requirements *(include for technical, architectural, migration, security, operational, refactoring, or enabling work)*

- **TR-001**: The sidecar coordinator workflow MUST define one coordinator integration branch created from current `origin/main` for coordinator parallel execution.
- **TR-002**: Each sidecar child implementation branch MUST start from the coordinator branch, not directly from `main`.
- **TR-003**: Each active sidecar child implementation MUST use an isolated local checkout or worktree.
- **TR-004**: Sidecar coordinator, child branch, and local checkout or directory names MUST be deterministic from issue numbers and slugs.
- **TR-005**: The sidecar workflow MUST stop on branch, checkout, or directory collisions unless the collision is clearly recoverable as the intended sidecar resource.
- **TR-006**: The coordinator artifact MUST be able to record coordinator branch, child branch, checkout/worktree, and related Git state needed to resume or validate sidecar execution.
- **TR-007**: Sidecar child PR guidance MUST require child PRs to target the coordinator branch and MUST disallow targeting `main` directly.
- **TR-008**: After a user merges a child PR into the coordinator branch, still-active sidecar branches or worktrees MUST be updated from the coordinator branch using a normal merge.
- **TR-009**: Sidecar branch refresh, delivery, and recovery guidance MUST disallow rebase, force-push, and history-rewriting updates.
- **TR-010**: The workflow MUST NOT delete local sidecar branches or worktrees after individual child PR merges.
- **TR-011**: Local cleanup MUST be eligible only after the final coordinator PR has been merged into `main`, and cleanup MUST be limited to local branches and worktrees created by the sidecar workflow.
- **TR-012**: Remote branch deletion, remote pruning, or any remote cleanup MUST require explicit user approval.
- **TR-013**: Direct child issue work outside `parallel` MUST preserve the normal sequential Git workflow.
- **TR-014**: A closed-child coordinator final pass MUST preserve the normal sequential Git workflow and MUST remain outside the sidecar coordinator branch model.
- **TR-015**: Validation MUST simulate one coordinator branch and two child branches, a child PR merge into the coordinator branch, a normal merge refresh of another active child branch, cleanup eligibility timing, and closed-child coordinator final-pass routing.
- **TR-016**: Manual validation MUST verify the workflow contains no rebase, force-push, history-rewriting update, or direct sidecar child PR target to `main`.

### Scope Boundaries

- **SB-001**: Feature MUST remain within the CatWorld cat-boarding domain.
- **SB-002**: Feature MUST distinguish implemented behavior from assumptions, exclusions, and unresolved product or architectural questions.
- **SB-003**: Feature MUST NOT introduce cross-species abstractions, multi-tenancy, generic platform claims, or permanent product limits without explicit requirements.
- **SB-004**: Feature MUST only change the opt-in sidecar coordinator parallel workflow and its artifacts; normal sequential issue implementation remains unchanged except for explicit boundary text that preserves it.
- **SB-005**: Feature depends on completed issues #226, #227, and #228 and must remain aligned with parent epic #220.

### Out of Scope

- Opening pull requests as part of the sidecar workflow implementation.
- Product application behavior or UI changes.
- Changing the normal Git workflow for direct issue implementation.
- Remote cleanup without explicit user approval.
- Using the sidecar parallel workflow to implement this issue.

### Open Questions

- None.

### Key Entities *(include if feature involves data)*

- **Coordinator Integration Branch**: The sidecar branch created from current `origin/main` to integrate child work before the final coordinator PR.
- **Child Implementation Branch**: A sidecar branch created from the coordinator branch for one child issue.
- **Sidecar Checkout/Worktree**: The isolated local working directory used by one active child implementation.
- **Coordinator Artifact Git State**: The recorded coordinator branch, child branches, checkout paths, and cleanup eligibility state needed to resume, validate, or audit sidecar execution.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: The sidecar Git model is explicit enough for a reviewer to identify the coordinator branch source, child branch source, local checkout isolation rule, deterministic naming rule, and collision stop rule.
- **SC-002**: The coordinator artifact can record branch and checkout state for coordinator and child sidecar execution.
- **SC-003**: Review of the workflow confirms normal issue Git flow, direct child issue Git flow outside `parallel`, and closed-child coordinator final pass behavior are explicitly unchanged.
- **SC-004**: Validation demonstrates that active child branches are refreshed by normal merge from the coordinator branch after a child PR merge.
- **SC-005**: Review of changed workflow text finds no permitted rebase, force-push, history-rewriting update, or sidecar child PR target to `main`.
- **SC-006**: Cleanup guidance allows only local sidecar resources after the final coordinator PR has merged into `main` and keeps remote cleanup behind explicit user approval.

## Assumptions

- No product behavior, persistence schema, API contract, authorization rule, or user-facing application copy changes are required for this workflow-only issue.
