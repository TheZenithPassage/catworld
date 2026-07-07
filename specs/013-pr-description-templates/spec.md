# Feature Specification: PR Description Templates for Sidecar Coordinator Delivery

**Feature Branch**: `docs/224-add-pr-templates-sidecar-coordinator-delivery`

**Created**: 2026-07-07

**Input**: User description: "GitHub issue #224: Add PR description templates for the sidecar coordinator parallel workflow without changing normal PR descriptions. Parent epic: #220. Depends on #222 and #223."

## User Scenarios, Technical Outcomes & Testing *(mandatory)*

### Verifiable Technical Outcomes *(use instead of user stories for technical/enabling work)*

- **TO-001**: Repository maintainers can create local sample child and final coordinator PR descriptions from sidecar parallel delivery templates that preserve the approved issue-closing contract.
  - **Why this priority**: The templates are the feature deliverable and must prevent child PRs from closing issues before the final coordinator PR to `main`.
  - **Acceptance Scenarios**:
    1. **Given** the sidecar child PR template, **When** a maintainer creates a sample PR description for a child branch into the coordinator branch, **Then** the description uses `Related to #<child-issue>` and `Related to #<coordinator-issue>` instead of default issue-closing wording.
    2. **Given** the final coordinator PR template, **When** a maintainer creates a sample PR description for the coordinator branch into `main`, **Then** the description may include `Closes #<coordinator-issue>` and `Closes #<child-issue>` lines.
    3. **Given** the normal one-issue/one-PR workflow or a closed-child coordinator final pass, **When** PR wording guidance is reviewed, **Then** the existing normal sequential PR description behavior remains unchanged.
  - **Validation Evidence**: Local sample child, final coordinator, and coordinator final-pass PR descriptions plus manual review against issues #220, #221, #222, and #223.

### Edge Cases

- Child PR descriptions must not close child or coordinator issues by default, even when they mention both issue numbers.
- Final coordinator PR descriptions for sidecar parallel delivery may close the coordinator issue and relevant child issues because that PR targets `main`.
- Normal one-issue/one-PR work must keep existing PR description behavior and must not be forced through sidecar wording.
- A coordinator with all child issues already closed that enters the existing sequential final-pass workflow must use normal sequential PR wording, not sidecar final coordinator wording.
- The templates must not imply that real PRs should be opened during validation.
- The feature must not change product code or normal PR workflow logic.

## Requirements *(mandatory)*

### Technical Requirements *(include for technical, architectural, migration, security, operational, refactoring, or enabling work)*

- **TR-001**: The repository MUST include a child PR description template for PRs from child branches into a coordinator branch.
- **TR-002**: The child PR template MUST use `Related to #<child-issue>` and `Related to #<coordinator-issue>` wording.
- **TR-003**: The child PR template MUST NOT use default issue-closing wording for child or coordinator issues.
- **TR-004**: The repository MUST include a final coordinator PR description template for PRs from a coordinator branch into `main`.
- **TR-005**: The final coordinator PR template MAY use `Closes #<coordinator-issue>` and `Closes #<child-issue>` lines.
- **TR-006**: Template guidance MUST state that normal one-issue/one-PR work keeps the existing PR description behavior.
- **TR-007**: Template guidance MUST state that a coordinator with all child issues closed uses normal sequential PR wording for any remaining final pass.
- **TR-008**: Validation MUST include creating local sample child and final sidecar PR descriptions, creating one local sample coordinator final-pass PR description, and manually reviewing the wording against issues #220, #221, #222, and #223.
- **TR-009**: The feature MUST NOT open real PRs, change normal PR workflow behavior, or change product code.

### Scope Boundaries

- **SB-001**: Feature MUST remain within the CatWorld cat-boarding domain and repository workflow infrastructure.
- **SB-002**: Feature MUST distinguish implemented behavior from assumptions, exclusions, and unresolved product or architectural questions.
- **SB-003**: Feature MUST NOT introduce cross-species abstractions, multi-tenancy, generic platform claims, or permanent product limits without explicit requirements.

### Out of Scope

- Opening real pull requests.
- Changing normal one-issue/one-PR workflow behavior.
- Changing product code.
- Implementing or activating sidecar parallel execution.
- Modifying issue templates created by prior dependent work unless necessary to keep PR wording references consistent.

### Open Questions

- None.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A local sample child PR description created from the child template uses `Related to` lines for both child and coordinator issues and does not close issues by default.
- **SC-002**: A local sample final coordinator PR description created from the final template can close the coordinator issue and child issues.
- **SC-003**: A local sample closed-child coordinator final-pass PR description follows normal sequential PR wording.
- **SC-004**: Manual review confirms the templates match the routing and delivery contract from issues #220, #221, #222, and #223.
- **SC-005**: Manual review confirms normal sequential PR wording remains unchanged.

## Assumptions

- PR description templates will be repository documentation/workflow artifacts only and will not alter application runtime behavior.
