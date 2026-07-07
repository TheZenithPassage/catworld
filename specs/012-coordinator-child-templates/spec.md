# Feature Specification: Coordinator and Child Issue Templates

**Feature Branch**: `docs/223-add-coordinator-child-issue-templates`

**Created**: 2026-07-07

**Input**: User description: "GitHub issue #223: Add GitHub issue templates for opt-in coordinator parallel planning. Parent epic: #220. Depends on #221 and #222."

## User Scenarios, Technical Outcomes & Testing *(mandatory)*

### Verifiable Technical Outcomes *(use instead of user stories for technical/enabling work)*

- **TO-001**: Repository maintainers can create local sample coordinator and child issue bodies from concise GitHub issue templates that reflect the approved routing contract.
  - **Why this priority**: The templates are the feature's deliverable and must guide future issue authors without changing implementation workflow behavior.
  - **Acceptance Scenarios**:
    1. **Given** the repository issue templates, **When** a maintainer creates a coordinator issue body from the coordinator template, **Then** the body contains sections for goal, preserved scope, child issues, dependencies, execution model, validation, and out of scope.
    2. **Given** the repository issue templates, **When** a maintainer creates a child issue body from the child template, **Then** the body contains sections for parent coordinator, scope, dependencies, validation, and out of scope.
    3. **Given** either generated sample body, **When** the execution guidance is reviewed, **Then** it states that templates do not activate parallel mode by themselves and do not change the normal sequential issue workflow.
  - **Validation Evidence**: Local sample bodies created from both templates and manual review against issues #220, #221, and #222.

### Edge Cases

- A coordinator issue with all listed child issues closed must be able to enter the existing sequential workflow only for final verification and delivery.
- Coordinator finalization guidance must not imply that closed child issue scope should be reimplemented.
- A child issue created from the template must remain implementable directly through the normal sequential workflow when the user chooses one-by-one execution.
- Template content must stay concise and must not duplicate full Spec Kit artifacts or require PR description templates.

## Requirements *(mandatory)*

### Technical Requirements *(include for technical, architectural, migration, security, operational, refactoring, or enabling work)*

- **TR-001**: The repository MUST include a concise coordinator GitHub issue template that supports goal, preserved scope, child issues, dependencies, execution model, validation, and out of scope.
- **TR-002**: The repository MUST include a concise focused child GitHub issue template that supports parent coordinator, scope, dependencies, validation, and out of scope.
- **TR-003**: Template guidance MUST state that templates do not activate parallel mode by themselves.
- **TR-004**: Template guidance MUST state that child issues may still be implemented directly through the normal sequential workflow when the user chooses to do them one by one.
- **TR-005**: Template guidance MUST state that a coordinator with all listed child issues closed may enter the existing sequential workflow for final verification and delivery.
- **TR-006**: Template guidance MUST state that coordinator finalization must not reimplement closed child issue scope.
- **TR-007**: The templates MUST remain concise and avoid duplicating full Spec Kit artifacts.
- **TR-008**: Validation MUST include creating local sample bodies from both templates and manual review against issues #220, #221, and #222.
- **TR-009**: The normal issue workflow MUST remain unchanged by this feature.

### Scope Boundaries

- **SB-001**: Feature MUST remain within the CatWorld cat-boarding domain and repository workflow infrastructure.
- **SB-002**: Feature MUST distinguish implemented behavior from assumptions, exclusions, and unresolved product or architectural questions.
- **SB-003**: Feature MUST NOT introduce cross-species abstractions, multi-tenancy, generic platform claims, or permanent product limits without explicit requirements.

### Out of Scope

- PR description templates.
- Existing implementation skill changes.
- Product issues.
- Activation or implementation of sidecar parallel execution.

### Open Questions

- None.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A coordinator issue body can be created locally from the coordinator template with all required sections from TR-001.
- **SC-002**: A child issue body can be created locally from the child template with all required sections from TR-002.
- **SC-003**: Manual review confirms both templates match the routing contract from issues #220, #221, and #222.
- **SC-004**: Manual review confirms the templates do not change the normal issue workflow or imply reimplementation of closed child issue scope.

## Assumptions

- The issue templates will use the repository's existing GitHub issue template location and format if one is already present.
