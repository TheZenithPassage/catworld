# Feature Specification: Sidecar PR Target and Closure Rules

**Feature Branch**: `docs/230-add-sidecar-pr-target-and-closure-rules`

**Created**: 2026-07-07

**Input**: GitHub issue #230: "[Workflow] Add sidecar PR target and closure rules"

## User Scenarios, Technical Outcomes & Testing *(mandatory)*

### Verifiable Technical Outcomes *(use instead of user stories for technical/enabling work)*

- **TO-001**: Sidecar child PR delivery rules prevent child PRs from closing issues or targeting `main` directly.
  - **Why this priority**: Sidecar parallel delivery depends on reviewable child PRs that integrate into the coordinator branch without mutating issue state or bypassing coordinator integration.
  - **Acceptance Scenarios**:
    1. **Given** a sidecar child branch is ready for review, **When** PR guidance or a sample child PR description is produced, **Then** the PR target is the coordinator integration branch and not `main`.
    2. **Given** a sidecar child PR description references child and coordinator issues, **When** the description is reviewed, **Then** it uses `Related to` wording only and contains no issue-closing keywords.
    3. **Given** sidecar child delivery guidance is reviewed, **When** GitHub issue mutation permissions are checked, **Then** child PR delivery requires explicit user approval before modifying issue bodies, checklists, labels, assignees, milestones, state, or public comments.
  - **Validation Evidence**: Local sample child PR descriptions for two child issues, target review showing coordinator-branch targets, wording review for `Related to` only, and mutation-permission review against issues #224, #229, and #220.

- **TO-002**: Final sidecar coordinator PR delivery rules reserve closure authority for the final PR into `main`.
  - **Why this priority**: The coordinator PR is the first sidecar PR that targets `main`, so it is the appropriate point to close the coordinator set after child work has been integrated.
  - **Acceptance Scenarios**:
    1. **Given** sidecar child work has been integrated into the coordinator branch, **When** final coordinator PR guidance or a sample description is produced, **Then** the PR target is `main`.
    2. **Given** the final sidecar coordinator PR description is reviewed, **When** issue closure wording is checked, **Then** it may close the coordinator and child issues for the sidecar set.
    3. **Given** final coordinator delivery guidance is reviewed, **When** repository operation authority is checked, **Then** Codex reports readiness and does not merge PRs or mutate GitHub issues without explicit user approval.
  - **Validation Evidence**: Local sample final coordinator PR description targeting `main`, closure wording review, and manual review against issues #224, #229, and #220.

- **TO-003**: Non-sidecar workflow boundaries preserve normal sequential PR behavior and closed-child coordinator final-pass behavior.
  - **Why this priority**: Issue #230 must add sidecar-specific safety rules without changing normal one-issue/one-PR delivery or the sequential final pass for coordinators whose child issues are already closed.
  - **Acceptance Scenarios**:
    1. **Given** normal sequential issue work, **When** PR guidance is selected, **Then** the existing normal target and closure behavior remains unchanged.
    2. **Given** direct child issue work outside explicit sidecar `parallel` mode, **When** PR guidance is selected, **Then** the normal sequential PR behavior remains in force.
    3. **Given** a coordinator final pass after all listed child issues are closed, **When** PR guidance or a sample description is produced, **Then** it uses normal sequential PR behavior rather than the sidecar child/final PR model.
  - **Validation Evidence**: Local sample closed-child coordinator final-pass PR description using normal sequential behavior and manual review that normal issue PR behavior is unchanged.

### Input/State Validation Matrix *(include when validation or state-sensitive behavior changes)*

| Workflow State | PR Target | Issue Wording | GitHub Mutation Permission | Expected Outcome |
|----------------|-----------|---------------|----------------------------|------------------|
| Sidecar child PR for one child branch | Coordinator integration branch | `Related to #<child-issue>` and `Related to #<coordinator-issue>` only | No issue body, checklist, label, assignee, milestone, state, or public comment mutation without explicit user approval | Child PR cannot close issues prematurely and cannot target `main` directly |
| Final sidecar coordinator PR | `main` | May close the coordinator issue and child issues in the sidecar set | No issue mutation or public comment outside PR creation/update unless explicitly approved | Final coordinator PR is the only sidecar PR that may close the coordinator set |
| Normal one-issue sequential PR | Existing normal sequential target behavior | Existing normal sequential closure behavior | Existing workflow permission boundaries, including explicit approval for GitHub issue mutation and public comments | Normal issue PR behavior remains unchanged |
| Direct child issue outside `parallel` | Existing normal sequential target behavior | Existing normal sequential closure behavior | Existing workflow permission boundaries | Direct child work does not use sidecar PR routing |
| Closed-child coordinator final pass | Existing normal sequential target behavior | Normal sequential final-pass wording, not sidecar child/final wording | Existing workflow permission boundaries | Closed-child coordinator final pass remains outside sidecar PR routing |
| Remote branch deletion, remote pruning, or remote cleanup | N/A | N/A | Explicit user approval required | Sidecar PR flow cannot perform remote cleanup by implication |

### Edge Cases

- A sidecar child PR description accidentally includes `Closes`, `Fixes`, `Resolves`, or equivalent issue-closing wording.
- A sidecar child PR is prepared with `main` as the target instead of the coordinator integration branch.
- A final sidecar coordinator PR omits closure wording for child issues that should close with the coordinator set.
- Normal sequential issue delivery is accidentally forced through sidecar child/final PR wording.
- A closed-child coordinator final pass is mistaken for sidecar parallel delivery and routed to sidecar PR targets.
- Workflow guidance implies Codex may mutate issue bodies, checklists, labels, assignees, milestones, issue state, or public comments without explicit user approval.
- Workflow guidance implies remote branch deletion, remote pruning, or remote cleanup without explicit user approval.

## Requirements *(mandatory)*

### Technical Requirements *(include for technical, architectural, migration, security, operational, refactoring, or enabling work)*

- **TR-001**: Sidecar child PR guidance MUST require child PRs to target the coordinator integration branch.
- **TR-002**: Sidecar child PR guidance MUST prohibit child PRs from targeting `main` directly.
- **TR-003**: Sidecar child PR descriptions MUST use `Related to` wording for child and coordinator issue references.
- **TR-004**: Sidecar child PR descriptions MUST NOT use issue-closing keywords for child or coordinator issues.
- **TR-005**: Final sidecar coordinator PR guidance MUST require the final coordinator PR to target `main`.
- **TR-006**: Final sidecar coordinator PR descriptions MAY use issue-closing wording for the coordinator issue and child issues in the sidecar set.
- **TR-007**: Sidecar delivery guidance MUST state that Codex reports readiness and the user performs merges.
- **TR-008**: Sidecar delivery guidance MUST require explicit user approval before Codex modifies GitHub issue bodies, checklists, labels, assignees, milestones, issue state, or public comments.
- **TR-009**: Sidecar delivery guidance MUST require explicit user approval before remote branch deletion, remote pruning, or remote cleanup.
- **TR-010**: Normal one-issue sequential PR behavior MUST keep its current target and closure behavior.
- **TR-011**: Direct child issue work outside explicit sidecar `parallel` mode MUST keep normal sequential PR behavior.
- **TR-012**: Closed-child coordinator final passes MUST use normal sequential PR behavior and MUST remain outside the sidecar child/final PR routing model.
- **TR-013**: Validation MUST create local sample PR descriptions for one coordinator issue and two child issues.
- **TR-014**: Validation MUST confirm child PR examples target the coordinator branch and use `Related to` wording only.
- **TR-015**: Validation MUST confirm the final coordinator PR example targets `main` and may close the coordinator set.
- **TR-016**: Validation MUST confirm no GitHub issue body, checklist, label, assignee, milestone, state, or public comment mutation is part of sidecar PR flow without explicit user approval.
- **TR-017**: Validation MUST create one local sample closed-child coordinator final-pass PR description using normal sequential PR behavior.
- **TR-018**: Validation MUST include manual review against completed issues #224 and #229 and parent epic #220.

### Scope Boundaries

- **SB-001**: Feature MUST remain within the CatWorld cat-boarding domain and repository workflow infrastructure.
- **SB-002**: Feature MUST distinguish implemented behavior from assumptions, exclusions, and unresolved product or architectural questions.
- **SB-003**: Feature MUST NOT introduce cross-species abstractions, multi-tenancy, generic platform claims, or permanent product limits without explicit requirements.
- **SB-004**: Feature MUST only define sidecar coordinator delivery rules and related documentation or workflow artifacts; normal sequential delivery remains unchanged except for explicit boundary text that preserves it.
- **SB-005**: Feature depends on completed issues #224 and #229 and must remain aligned with parent epic #220.

### Out of Scope

- Opening real pull requests.
- Merging pull requests.
- Changing CatWorld product application behavior.
- Changing normal sequential PR target or closure behavior.
- GitHub issue mutation without explicit user approval.
- Remote branch deletion, remote pruning, or remote cleanup without explicit user approval.
- Using sidecar parallel mode to implement this issue.

### Open Questions

- None.

### Key Entities *(include if feature involves data)*

- **Sidecar Child PR**: A pull request from a sidecar child implementation branch into the coordinator integration branch; it references issues with `Related to` wording and does not close issues.
- **Final Sidecar Coordinator PR**: The pull request from the coordinator integration branch into `main`; it may close the coordinator issue and child issues after the sidecar set is ready.
- **Closed-Child Coordinator Final Pass**: The existing sequential final-pass path for a coordinator after all listed child issues are already closed; it does not use the sidecar child/final PR model.
- **GitHub Mutation**: Any change to issue body, checklist, labels, assignees, milestone, state, or public comments; sidecar PR flow requires explicit user approval before performing it.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Local sample child PR descriptions for two child issues target the coordinator branch, use `Related to` references only, and contain no issue-closing keywords.
- **SC-002**: A local sample final coordinator PR description targets `main` and may close the coordinator issue and child issues in the sidecar set.
- **SC-003**: A local sample closed-child coordinator final-pass PR description uses normal sequential PR behavior rather than sidecar PR routing.
- **SC-004**: Review confirms sidecar guidance requires explicit user approval for GitHub issue body, checklist, label, assignee, milestone, state, public comment, remote branch deletion, remote pruning, and remote cleanup mutations.
- **SC-005**: Manual review against issues #224, #229, and #220 confirms normal sequential PR behavior remains unchanged and closed-child coordinator final passes are outside sidecar PR routing.

## Assumptions

- No product behavior, persistence schema, API contract, authorization rule, or user-facing application copy changes are required for this workflow-only issue.
