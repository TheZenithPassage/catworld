# Feature Specification: Dry-run Sidecar Coordinator Workflow

**Feature Branch**: `chore/234-dry-run-sidecar-coordinator-workflow`

**Created**: 2026-07-07

**Input**: GitHub issue #234, "[Workflow] Dry-run the opt-in sidecar coordinator workflow before adoption"

## User Scenarios, Technical Outcomes & Testing *(mandatory)*

### Verifiable Technical Outcomes *(use instead of user stories for technical/enabling work)*

- **TO-001**: A controlled dry-run produces reviewable evidence for the opt-in sidecar coordinator workflow before it is used for product feature work.
  - **Why this priority**: The sidecar workflow must be proven or blocked before adoption so normal CatWorld issue implementation remains safe.
  - **Acceptance Scenarios**:
    1. **Given** the repository contains the sidecar workflow skills and source-of-truth workflow rules, **When** the dry-run is executed or blocked, **Then** the result records the dry-run issue numbers, artifact paths, branch names, PR target expectations, validation results, blockers, and corrections.
    2. **Given** the dry-run identifies an adoption-blocking gap, **When** the result is recorded, **Then** follow-up fixes are identified before declaring the sidecar workflow ready.
  - **Validation Evidence**: Dry-run report or equivalent repository-tracked evidence, plus command/review evidence referenced by that report.

- **TO-002**: The dry-run verifies the required routing outcomes without changing the default sequential workflow.
  - **Why this priority**: Routing correctness protects normal issues, direct child issues, and coordinator final passes from accidental parallel execution.
  - **Acceptance Scenarios**:
    1. **Given** a coordinator issue is requested with `parallel`, **When** the sidecar routing is evaluated, **Then** the result records whether the coordinator parallel path is accepted only through the opt-in sidecar workflow.
    2. **Given** a non-coordinator issue is requested with `parallel`, **When** the routing is evaluated, **Then** the result records that parallel mode is rejected instead of ignored.
    3. **Given** a coordinator issue is requested end-to-end while listed sub-issues remain open, **When** the routing is evaluated, **Then** the result records the required routing stop.
    4. **Given** a coordinator issue is requested end-to-end after all listed sub-issues are closed, **When** the routing is evaluated, **Then** the result records that the current sequential end-to-end workflow is used for a final pass only.
    5. **Given** a direct child issue is requested end-to-end, **When** the routing is evaluated, **Then** the result records that the current sequential workflow remains the route.
  - **Validation Evidence**: Recorded routing outcome matrix with source references to the issue, repository instructions, and workflow skills.

- **TO-003**: The dry-run verifies sidecar operational guardrails and human-only blockers.
  - **Why this priority**: Sidecar branch, worktree, PR, cleanup, and mutation rules affect repository safety and must be proven before adoption.
  - **Acceptance Scenarios**:
    1. **Given** sidecar child handoff or branch planning is evaluated, **When** PR targets and branch update rules are recorded, **Then** child PRs target the coordinator branch, the final coordinator PR targets `main`, branch refresh uses normal merge only after child PR merges, and no rebase or force-push is used.
    2. **Given** cleanup or GitHub mutation would be considered, **When** the dry-run records expected behavior, **Then** local cleanup is eligible only after the final coordinator PR merges into `main`, and remote branch deletion, pruning, issue mutation, labels, assignees, milestones, checklists, issue state changes, and public comments require explicit user approval.
    3. **Given** adoption readiness is evaluated, **When** readiness evidence is recorded, **Then** readiness comes from preflight, child issue inspection, dependency classification, and source-of-truth review, not from a required `parallel-ready` label.
    4. **Given** the workflow encounters new significant dependencies, material architecture changes, production exposure, secrets, deployment changes, Git/GitHub workflow outside the approved model, or unresolved product, persistence, security, authorization, UX, domain, contract, validation, operational, or scope decisions, **When** the dry-run records the outcome, **Then** those items are treated as human-only blockers.
  - **Validation Evidence**: Recorded guardrail evidence, source-of-truth review, and blocker classification results.

### Observable Behavior Detail *(include when visible UI or user-observable behavior changes)*

- **Visible states**: N/A - this feature does not change application UI or user-visible product behavior.
- **Interaction outcomes**: N/A - this feature validates workflow routing and repository-operation expectations.
- **Copy and localization**: N/A - no application copy or localization behavior changes.
- **Responsive/mobile behavior**: N/A - no UI surface changes.

### Input/State Validation Matrix *(include when validation or state-sensitive behavior changes)*

N/A - this feature does not change application validation, conflict handling, permissions, or state-sensitive product behavior. It validates workflow routing states through recorded dry-run evidence instead.

### Edge Cases

- Sidecar workflow support is missing, incomplete, or internally inconsistent; the dry-run must stop or record a blocker instead of declaring adoption readiness.
- A routing scenario would require GitHub issue mutation, public comments, remote branch deletion, pruning, force-push, rebase, or cleanup outside the approved model; the dry-run must record the expected restriction and avoid the operation without explicit user approval.
- A coordinator issue has ambiguous or unavailable child issue state; the dry-run must record the ambiguity as a blocker rather than assuming readiness.
- A tested scenario overlaps with issue #220 through #234 routing restrictions; the result must preserve the sequential-only guardrail for that issue range.
- Generated artifact paths or branch names collide with existing local state; the result must either use scoped non-conflicting dry-run names or record the blocker without destructive cleanup.

## Requirements *(mandatory)*

### Technical Requirements *(include for technical, architectural, migration, security, operational, refactoring, or enabling work)*

- **TR-001**: The dry-run MUST use a low-risk controlled coordinator issue or documented equivalent evidence that remains separate from CatWorld product feature implementation.
- **TR-002**: The dry-run MUST record generated artifact paths, branch names, PR target expectations, validation results, blockers, and corrections.
- **TR-003**: The dry-run MUST record the five routing outcomes listed in issue #234: valid coordinator `parallel`, invalid non-coordinator `parallel`, invalid coordinator end-to-end while listed sub-issues are open, valid coordinator final pass after all listed sub-issues are closed, and direct child end-to-end.
- **TR-004**: The dry-run MUST record explicit evidence that the closed-child coordinator final pass uses the current sequential workflow and does not redo closed child issue scope.
- **TR-005**: The dry-run MUST record explicit evidence for normal merge only, no rebase, no force-push, no child PR to `main`, cleanup timing, GitHub mutation restrictions, no required `parallel-ready` label, no unapproved seed or foundation issue, and human-only blocker behavior.
- **TR-006**: The implementation MUST preserve normal sequential workflow usability for normal issues, direct child issues, and closed-child coordinator final passes.
- **TR-007**: The implementation MUST NOT change `.agents/skills/catworld-implement-issue/SKILL.md` internals except where issue #234 evidence proves an already-approved correction is required.
- **TR-008**: The implementation MUST NOT declare the sidecar workflow default or ready for product use; adoption readiness remains a user-reviewed decision after the dry-run result.
- **TR-009**: The implementation MUST NOT perform remote branch deletion, remote pruning, issue mutation, label/assignee/milestone/checklist/state changes, or public comments without explicit user approval.
- **TR-010**: Validation MUST include recorded dry-run issue numbers, artifact paths, routing outcomes, guardrail evidence, and any blockers or follow-up fixes.

### Scope Boundaries

- **SB-001**: Feature MUST remain within the CatWorld cat-boarding domain and workflow tooling for this repository.
- **SB-002**: Feature MUST distinguish implemented behavior from assumptions, exclusions, and unresolved product or architectural questions.
- **SB-003**: Feature MUST NOT introduce cross-species abstractions, multi-tenancy, generic platform claims, or permanent product limits without explicit requirements.

### Out of Scope

- Implementing CatWorld product features.
- Declaring the sidecar coordinator workflow as the default workflow.
- Changing the normal implementation skill internals as part of the dry-run.
- Creating unapproved seed, foundation, or shared-contract child issues.
- Performing GitHub issue mutation, public comments, remote branch deletion, remote pruning, force-push, rebase, or history rewriting.
- Cleaning up sidecar worktrees or branches before the final coordinator PR has merged into `main`.

### Open Questions

- None.

### Key Entities *(include if feature involves data)*

- **Dry-run Result**: Repository-tracked evidence that records issue numbers, artifact paths, branch names, routing outcomes, validation results, blockers, and corrections.
- **Routing Outcome**: A recorded pass, rejection, or blocker for one required workflow routing scenario.
- **Operational Guardrail Evidence**: A recorded source reference or validation result proving sidecar PR target, merge, cleanup, mutation, readiness, or blocker behavior.
- **Follow-up Fix**: A recorded gap that must be corrected before the sidecar workflow can be adopted.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: The dry-run result records all five required routing outcomes from issue #234 with explicit pass, rejection, or blocker status.
- **SC-002**: The dry-run result records explicit evidence for each required Git, cleanup, GitHub mutation, readiness-label, unapproved-issue, and human-only blocker rule from issue #234.
- **SC-003**: Review of `.agents/skills/catworld-implement-issue/SKILL.md` confirms the current sequential workflow remains usable and its internals were not changed by this feature except for any separately approved correction.
- **SC-004**: Any discovered adoption gap is recorded as a follow-up fix before the sidecar workflow is declared ready.
- **SC-005**: Validation output identifies the dry-run issue numbers, artifact paths, branch names, PR target expectations, blockers, corrections, and commands or manual reviews used as evidence.

## Assumptions

- The dry-run may use repository-tracked evidence and local review commands to validate routing and operational guardrails when performing the real external operation would violate the issue's approval requirements.
- Any required GitHub or remote operation that is disallowed without explicit approval will be recorded as expected behavior rather than performed.
