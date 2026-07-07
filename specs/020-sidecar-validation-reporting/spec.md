# Feature Specification: Sidecar Validation Reporting

**Feature Branch**: `chore/231-add-sidecar-validation-blocker-and-conflict-reporting`

**Created**: 2026-07-07

**Input**: GitHub issue #231: "[Workflow] Add sidecar validation, blocker and conflict reporting"

## User Scenarios, Technical Outcomes & Testing *(mandatory)*

### Verifiable Technical Outcomes *(use instead of user stories for technical/enabling work)*

- **TO-001**: Sidecar coordinator and child reports define explicit validation evidence for success, failure, skipped, stale, and not-run checks.
  - **Why this priority**: Parallel sidecar work can only be reviewed safely when each child implementation and the integrated coordinator branch report reproducible validation evidence without summarizing incomplete or failed checks as passed.
  - **Acceptance Scenarios**:
    1. **Given** a sidecar child implementation completes validation, **When** it prepares its final report, **Then** the report lists every required command, manual review, or sample artifact with an explicit status and enough detail to reproduce the evidence.
    2. **Given** validation fails, times out, is skipped, is interrupted, is partial, is stale, or is not run, **When** the sidecar report summarizes validation, **Then** that result is not described as passed.
    3. **Given** the coordinator branch is updated after child validation, **When** validation evidence is reviewed, **Then** affected evidence is marked stale or rerun before the branch is reported as ready.
  - **Validation Evidence**: Local sample reports for success, failure, stale validation, blocker, and conflict cases, plus manual review of validation status wording.

- **TO-002**: Sidecar blocker and conflict reporting distinguishes child-specific blockers, coordinator-wide blockers, shared-contract blockers, conflicts requiring user guidance, and human-only blocker categories.
  - **Why this priority**: Sidecar parallel execution must stop before unsafe work proceeds when a child, the coordinator set, a shared contract, or a material decision is blocked.
  - **Acceptance Scenarios**:
    1. **Given** a blocker affects only one child issue, **When** sidecar status is reported, **Then** the child report identifies that blocker without treating unrelated child issues as blocked.
    2. **Given** a blocker affects the coordinator branch, shared contract, or child integration set, **When** sidecar status is reported, **Then** the coordinator report identifies the coordinator-wide blocker and stops affected sidecar work.
    3. **Given** a non-trivial conflict affects contract, scope, persistence, security, authorization, UX, or domain behavior, **When** the sidecar workflow encounters the conflict, **Then** it stops for user guidance instead of resolving it silently.
    4. **Given** sidecar work encounters a new significant dependency, material architecture change, production exposure, secrets, deployment change, Git/GitHub workflow outside the approved model, or unresolved product, persistence, security, authorization, UX, domain, contract, validation, operational, or scope decision, **When** the workflow reports the condition, **Then** the report treats it as a human-only blocker.
  - **Validation Evidence**: Local sample blocker, conflict, and human-only blocker reports plus manual review against issue #220 routing and operational guardrails.

- **TO-003**: Sidecar readiness and non-sidecar boundaries remain explicit and preserve normal sequential reporting.
  - **Why this priority**: Issue #231 adds reporting rules only for the sidecar coordinator workflow and must not rewrite existing normal issue implementation reports or closed-child coordinator final-pass reports.
  - **Acceptance Scenarios**:
    1. **Given** a sidecar child implementation has failed or incomplete validation, **When** PR readiness is reported, **Then** the child PR is draft unless the failure is outside the child scope and explicitly does not affect readiness.
    2. **Given** a sidecar child implementation has fresh successful required validation and no blockers, **When** PR readiness is reported, **Then** the child PR can be reported as ready under the approved sidecar PR target rules.
    3. **Given** normal sequential issue work or a closed-child coordinator final pass, **When** final reporting is produced, **Then** it uses normal sequential reporting and does not present closed child issue scope as newly implemented work.
  - **Validation Evidence**: Local sample reports for ready and draft child PR states, one local sample closed-child coordinator final-pass report using normal sequential reporting, and changed-file review proving normal implementation reports are not rewritten.

### Input/State Validation Matrix *(include when validation or state-sensitive behavior changes)*

| Workflow State | Report Scope | Required Status Treatment | Readiness Result | Stop or Guidance Rule |
|----------------|--------------|---------------------------|------------------|-----------------------|
| Sidecar child validation succeeds and remains fresh | One child issue | List commands/reviews/artifacts as passed with reproducible evidence | Child PR may be ready under sidecar PR target rules | Continue if no blockers remain |
| Sidecar child validation fails, times out, is skipped, interrupted, partial, stale, or not run | One child issue | Report exact non-passed status; do not summarize as passed | Child PR is draft unless the non-passed evidence is explicitly outside child readiness | Fix within scope or report blocker |
| Coordinator branch changes after child validation | Affected child or coordinator evidence | Mark affected evidence stale until rerun | Coordinator or affected child is not ready on stale evidence | Rerun affected validation or report stale status |
| Child-specific blocker | One child issue | Identify blocker, affected child, required next decision/evidence, and unaffected children if known | Affected child not ready | Return blocker to coordinator or user |
| Coordinator-wide or shared-contract blocker | Coordinator set and affected children | Identify blocker, affected issues, shared contract or integration impact, and stopped work | Coordinator and affected children not ready | Stop affected sidecar work |
| Non-trivial conflict affects contract, scope, persistence, security, authorization, UX, or domain behavior | Child or coordinator set | Report conflict inputs, affected source surfaces, and why user guidance is required | Not ready | Stop for user guidance |
| Human-only blocker category appears | Child or coordinator set | Report category, evidence, affected scope, and explicit human decision needed | Not ready | Stop; Codex must not decide |
| Normal sequential issue or closed-child coordinator final pass | Existing sequential scope | Use normal sequential validation/reporting | Existing sequential readiness behavior | Do not apply sidecar report format or claim closed child work as newly implemented |

### Edge Cases

- A sidecar child report contains both successful commands and one not-run required command.
- A validation command passed before a coordinator branch update and may no longer apply.
- A sidecar conflict is a simple textual conflict that does not affect contract or behavior versus a non-trivial conflict that does.
- A child-specific blocker reveals a shared-contract gap that affects other children.
- A human-only blocker involves GitHub issue mutation, public comments, remote cleanup, or a Git/GitHub workflow outside the approved model.
- A closed-child coordinator final pass needs to mention closed child issues for traceability without presenting them as newly implemented work.

## Requirements *(mandatory)*

### Technical Requirements *(include for technical, architectural, migration, security, operational, refactoring, or enabling work)*

- **TR-001**: Sidecar child implementation reports MUST list commands run, commands failed, commands skipped, commands interrupted, commands not run, manual reviews, and local sample artifacts required by the prepared child handoff.
- **TR-002**: Sidecar coordinator integration reports MUST list coordinator-level commands run, failed, skipped, interrupted, not run, manual reviews, local sample artifacts, and child validation evidence consumed for readiness.
- **TR-003**: Sidecar reports MUST use explicit validation statuses and MUST NOT summarize failed, timed-out, skipped, interrupted, partial, stale, or not-run validation as passed.
- **TR-004**: Sidecar reporting MUST define when validation becomes stale after coordinator branch updates, child branch refreshes, conflict resolution, or other relevant changes.
- **TR-005**: Sidecar child PR readiness guidance MUST distinguish ready and draft states based on fresh required validation, unresolved blockers, and approved sidecar PR target rules.
- **TR-006**: Sidecar blocker reporting MUST distinguish child-specific blockers from coordinator-wide blockers.
- **TR-007**: Sidecar shared-contract blockers MUST stop affected sidecar work until the blocker is resolved or user guidance is provided.
- **TR-008**: Sidecar conflict reporting MUST require user guidance for non-trivial conflicts affecting contract, scope, persistence, security, authorization, UX, or domain behavior.
- **TR-009**: Sidecar reports MUST identify human-only blockers for new significant dependencies, material architecture changes, production exposure, secrets, deployment changes, Git/GitHub workflow outside the approved model, and unresolved product, persistence, security, authorization, UX, domain, contract, validation, operational, or scope decisions.
- **TR-010**: Sidecar workflow guidance MUST state that Codex must not modify GitHub issue bodies, checklists, labels, assignees, milestones, state, or public comments unless the user explicitly requests that operation in a workflow that permits it.
- **TR-011**: Normal sequential validation and reporting behavior MUST remain unchanged.
- **TR-012**: Closed-child coordinator final passes MUST use normal sequential validation and reporting and MUST NOT present closed child issue scope as newly implemented work.
- **TR-013**: Validation MUST produce local sample reports for success, failure, stale validation, blocker, and conflict cases.
- **TR-014**: Validation MUST produce one local sample human-only blocker report covering at least one material architecture, production exposure, deployment, secrets, or Git/GitHub workflow issue.
- **TR-015**: Validation MUST produce one local sample closed-child coordinator final-pass report using normal sequential reporting.
- **TR-016**: Manual validation MUST review sidecar reporting against issue #220 routing and operational guardrails.

### Scope Boundaries

- **SB-001**: Feature MUST remain within the CatWorld cat-boarding domain and repository workflow infrastructure.
- **SB-002**: Feature MUST distinguish implemented behavior from assumptions, exclusions, and unresolved product or architectural questions.
- **SB-003**: Feature MUST NOT introduce cross-species abstractions, multi-tenancy, generic platform claims, or permanent product limits without explicit requirements.
- **SB-004**: Feature MUST only define validation, blocker, and conflict reporting for the sidecar coordinator workflow; normal sequential validation and reporting remain unchanged except for explicit boundary text that preserves them.
- **SB-005**: Feature depends on completed issues #227, #228, #229, and #230 and must remain aligned with parent epic #220.

### Out of Scope

- Expanding CI capacity.
- Product-specific validation beyond issue #231 requirements.
- Changing normal implementation reports.
- GitHub issue body, checklist, label, assignee, milestone, state, or public comment mutation without explicit user approval.
- Changing CatWorld product application behavior.
- Using sidecar parallel mode to implement this issue.

### Open Questions

- None.

### Key Entities *(include if feature involves data)*

- **Sidecar Validation Report**: A child or coordinator report that records required evidence, explicit validation statuses, freshness, and readiness impact.
- **Child-Specific Blocker**: A blocker that prevents one child issue from continuing or becoming ready without necessarily blocking unrelated children.
- **Coordinator-Wide Blocker**: A blocker that affects the coordinator branch, shared contract, integration set, or multiple children.
- **Shared-Contract Blocker**: A missing, conflicting, or unsafe shared contract that stops affected sidecar work.
- **Human-Only Blocker**: A material decision category that Codex must report and stop on rather than decide silently.
- **Closed-Child Coordinator Final Pass Report**: A normal sequential final report for a coordinator after listed child issues are already closed; it may trace closed child issues but must not claim their scope as newly implemented.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Local sample reports for success, failure, stale validation, blocker, and conflict cases each show commands or reviews run, failed, skipped, stale, or not run with explicit statuses.
- **SC-002**: A local sample human-only blocker report identifies at least one covered human-only category, the evidence, affected scope, and the required user decision.
- **SC-003**: Sidecar child readiness guidance makes failed or incomplete required validation draft-only and fresh successful required validation ready-eligible when no blockers remain.
- **SC-004**: Review confirms shared-contract blockers and non-trivial conflicts affecting contract, scope, persistence, security, authorization, UX, or domain behavior stop affected sidecar work for user guidance.
- **SC-005**: Review confirms sidecar guidance requires explicit user approval before GitHub issue body, checklist, label, assignee, milestone, state, or public comment mutation.
- **SC-006**: Review confirms normal sequential validation/reporting remains unchanged and a closed-child coordinator final-pass sample uses normal sequential reporting without presenting closed child scope as newly implemented.
- **SC-007**: Manual review against issue #220 routing and operational guardrails finds no route that applies sidecar reporting to normal sequential issue work.

## Assumptions

- No product behavior, persistence schema, API contract, authorization rule, or user-facing application copy changes are required for this workflow-only issue.
