# Feature Specification: Dual Workflow Routing Documentation

**Feature Branch**: `011-dual-workflow-routing`

**Created**: 2026-07-07

**Input**: User description: "GitHub issue #222 - Document CatWorld's two Codex workflow paths without replacing the current sequential workflow."

## User Scenarios, Technical Outcomes & Testing *(mandatory)*

### Verifiable Technical Outcomes

- **TO-001**: CatWorld workflow documentation explains how to route normal issues, direct child issues, coordinator issues, and explicit `parallel` requests.
  - **Why this priority**: Issue #222 exists so a new Codex session can choose the correct workflow path without weakening the default sequential implementation workflow.
  - **Acceptance Scenarios**:
    1. **Given** a normal issue or direct child issue and an end-to-end request, **When** a new Codex session reads the workflow documentation, **Then** it identifies the existing sequential one-issue workflow as the default path.
    2. **Given** a non-coordinator issue with `parallel`, **When** a new Codex session reads the workflow documentation, **Then** it identifies the request as invalid and stops instead of ignoring the flag.
    3. **Given** a coordinator issue requested end-to-end while any listed sub-issue is open, **When** a new Codex session reads the workflow documentation, **Then** it identifies the request as invalid for sequential finalization and stops with the documented routing error.
    4. **Given** a coordinator issue requested end-to-end after all listed sub-issues are closed, **When** a new Codex session reads the workflow documentation, **Then** it identifies the existing sequential workflow as the final-pass path and does not treat finalization as a separate workflow.
  - **Validation Evidence**: Manual review of changed workflow documentation against issues #220, #221, and #222.

- **TO-002**: Documentation describes the sidecar coordinator parallel workflow as an opt-in addition that owns its own future skills and does not require changes to `catworld-implement-issue`.
  - **Why this priority**: Issue #220 requires the future parallel workflow to sit beside, not replace or modify, the existing sequential workflow.
  - **Acceptance Scenarios**:
    1. **Given** the sidecar workflow is not yet implemented, **When** maintainers read the documentation, **Then** it states that sidecar parallel execution is opt-in only and unavailable unless explicitly requested on a coordinator issue.
    2. **Given** a maintainer is adding sidecar workflow skills later, **When** they read the documentation, **Then** it identifies the sidecar as the owner of its own skills without directing changes to `catworld-implement-issue`.
  - **Validation Evidence**: Manual review that the implementation changes documentation only, with no product behavior, sidecar skill, or existing implementation skill changes.

- **TO-003**: Documentation records what a closed-sub-issue coordinator final pass may and may not do.
  - **Why this priority**: Issue #220 and #222 both require coordinator finalization to preserve closed child scope while still allowing final verification and remaining coordinator-level work.
  - **Acceptance Scenarios**:
    1. **Given** all listed coordinator sub-issues are closed, **When** a new Codex session enters the final pass, **Then** the documentation permits verification, validation, remaining coordinator-level work, final delivery when repository changes remain, or a no-diff report.
    2. **Given** closed child issue scope is already implemented, **When** a new Codex session reads the documentation, **Then** it understands that preserved coordinator scope is not permission to reimplement closed child scope.
  - **Validation Evidence**: Manual review that the documentation distinguishes coordinator finalization from sidecar parallel execution and from child-scope reimplementation.

### Edge Cases

- The documentation must distinguish a coordinator issue with open sub-issues from a coordinator issue whose listed sub-issues are all closed.
- The documentation must distinguish `parallel` on a coordinator issue from `parallel` on a non-coordinator issue.
- The documentation must not imply that issue #220 through #234 can use parallel mode before the sidecar workflow is implemented and adopted.
- The documentation must not describe CatWorld product behavior, user roles, data, persistence, authorization, or application workflows as changed.

## Requirements *(mandatory)*

### Technical Requirements

- **TR-001**: Workflow documentation MUST state that normal implementable issues and direct child issue end-to-end requests use the existing sequential one-issue/one-PR workflow by default.
- **TR-002**: Workflow documentation MUST state that sidecar coordinator parallel workflow execution is opt-in only and valid only for an explicit `parallel` request on a clearly identified coordinator issue.
- **TR-003**: Workflow documentation MUST state that `parallel` on a non-coordinator issue is invalid and must stop with a routing error.
- **TR-004**: Workflow documentation MUST state that coordinator end-to-end requests must stop while any listed sub-issue is still open.
- **TR-005**: Workflow documentation MUST state that coordinator end-to-end requests after all listed sub-issues are closed enter the existing sequential workflow as a final pass.
- **TR-006**: Workflow documentation MUST state that coordinator finalization is not a separate workflow and must not reimplement closed sub-issue scope merely because the coordinator preserves original scope.
- **TR-007**: Workflow documentation MUST state that coordinator finalization may verify preserved scope, run validation, complete remaining coordinator-level work, prepare final delivery only when repository changes remain, or report that no diff is needed.
- **TR-008**: Workflow documentation MUST state that the sidecar workflow owns its own skills and that this documentation issue does not require changes to `catworld-implement-issue`.
- **TR-009**: The implementation MUST keep longer explanatory workflow guidance out of `AGENTS.md` and place it in repository documentation.
- **TR-010**: Validation MUST include manual review against issues #220 and #221 and confirmation that no product behavior is described as changed.

### Scope Boundaries

- **SB-001**: Feature MUST remain within CatWorld workflow documentation and must not change CatWorld product behavior.
- **SB-002**: Feature MUST distinguish implemented behavior from future sidecar workflow plans and unresolved adoption steps.
- **SB-003**: Feature MUST preserve the current sequential implementation workflow as default behavior.
- **SB-004**: Feature MUST NOT introduce sidecar skills, edit existing implementation skills, or implement git orchestration logic.

### Out of Scope

- Creating sidecar coordinator or child implementation skills.
- Editing `.agents/skills/catworld-implement-issue/SKILL.md` or other existing implementation skills.
- Implementing git branch, worktree, issue, pull request, or delivery orchestration logic.
- Changing CatWorld product code, product documentation, roles, persistence, authorization, APIs, frontend behavior, or operations.

### Open Questions

- None. Issues #220, #221, and #222 define the required routing documentation behavior for this feature.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A new Codex session can identify the documented workflow path for normal issues, direct child issues, coordinator `parallel` requests, invalid non-coordinator `parallel` requests, open-sub-issue coordinator end-to-end requests, and closed-sub-issue coordinator finalization.
- **SC-002**: Documentation explicitly preserves the existing sequential workflow as the default path and describes sidecar parallel execution as an addition rather than a replacement.
- **SC-003**: Documentation explicitly states that closed-sub-issue coordinator finalization uses the existing sequential workflow and is not a separate workflow.
- **SC-004**: Manual review against #220 and #221 confirms that no CatWorld product behavior is described as changed.

## Assumptions

- Repository workflow documentation is the appropriate home for the longer explanation because issue #222 explicitly keeps implementation details out of `AGENTS.md`.
