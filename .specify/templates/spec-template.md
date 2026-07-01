# Feature Specification: [FEATURE NAME]

**Feature Branch**: `[###-feature-name]`

**Created**: [DATE]

**Input**: User description: "$ARGUMENTS"

## User Scenarios, Technical Outcomes & Testing *(mandatory)*

<!--
  IMPORTANT: Use user stories for features that naturally contain user journeys,
  ordered by importance. For real product behavior, user stories SHOULD be
  independently testable where that reflects the actual feature; genuine
  dependencies must be documented instead of hidden to force artificial
  independence.

  Assign priorities (P1, P2, P3, etc.) to each story, where P1 is the most critical.

  Technical, architectural, migration, security, operational, refactoring, or
  enabling work may use Verifiable Technical Outcomes instead of artificial user
  stories. A feature may contain one user journey or one technical outcome when
  that is the natural scope. Technical outcomes require objective acceptance
  scenarios and validation evidence.
-->

### User Story 1 - [Brief Title] (Priority: P1)

[Describe this user journey in plain language]

**Why this priority**: [Explain the value and why it has this priority level]

**Independent Test**: [Describe how this can be tested independently - e.g., "Can be fully tested by [specific action] and delivers [specific value]"]

**Acceptance Scenarios**:

1. **Given** [initial state], **When** [action], **Then** [expected outcome]
2. **Given** [initial state], **When** [action], **Then** [expected outcome]

---

### User Story 2 - [Brief Title] (Priority: P2)

[Describe this user journey in plain language]

**Why this priority**: [Explain the value and why it has this priority level]

**Independent Test**: [Describe how this can be tested independently]

**Acceptance Scenarios**:

1. **Given** [initial state], **When** [action], **Then** [expected outcome]

---

### User Story 3 - [Brief Title] (Priority: P3)

[Describe this user journey in plain language]

**Why this priority**: [Explain the value and why it has this priority level]

**Independent Test**: [Describe how this can be tested independently]

**Acceptance Scenarios**:

1. **Given** [initial state], **When** [action], **Then** [expected outcome]

---

[Add more user stories as needed, each with an assigned priority]

### Verifiable Technical Outcomes *(use instead of user stories for technical/enabling work)*

- **TO-001**: [Objective technical outcome]
  - **Why this priority**: [Explain why this technical outcome is necessary now]
  - **Acceptance Scenarios**:
    1. **Given** [initial technical state], **When** [change or validation occurs], **Then** [objective expected outcome]
  - **Validation Evidence**: [Command, review artifact, migration validation, contract check, or other objective evidence]

### Observable Behavior Detail *(include when visible UI or user-observable behavior changes)*

<!--
  Use this section only when the feature changes what a user sees or
  experiences. Keep it proportional, but include enough detail for verification
  at the visible surface rather than through implementation internals.
-->

- **Visible states**: [field validation messages, backend errors, empty states,
  loading states, disabled states, destructive confirmations, success/conflict
  states, or N/A]
- **Interaction outcomes**: [submit/action behavior, route or dialog
  navigation, focus/keyboard behavior, role-dependent action visibility, or N/A]
- **Copy and localization**: [i18n-visible text expectations or existing copy
  preservation, or N/A]
- **Responsive/mobile behavior**: [target viewport/device behavior or N/A]

### Input/State Validation Matrix *(include when validation or state-sensitive behavior changes)*

<!--
  Use a lightweight matrix when the feature changes or preserves validation,
  conflict handling, backend-rejected state, role-dependent behavior, or similar
  state-sensitive behavior. Add or remove rows/columns to fit the feature.
-->

| Input or State | Submit/Action Blocked? | API Call Made? | Visible Error or Conflict | Value Transformed or Preserved | Correction Behavior |
|----------------|------------------------|----------------|---------------------------|--------------------------------|---------------------|
| [empty string] | [Yes/No/N/A] | [Yes/No/N/A] | [message/state] | [transformed/preserved/N/A] | [clears/replaces/N/A] |
| [whitespace-only string] | [Yes/No/N/A] | [Yes/No/N/A] | [message/state] | [transformed/preserved/N/A] | [clears/replaces/N/A] |
| [valid value] | [Yes/No/N/A] | [Yes/No/N/A] | [none/state] | [transformed/preserved/N/A] | [N/A] |
| [invalid format or boundary] | [Yes/No/N/A] | [Yes/No/N/A] | [message/state] | [transformed/preserved/N/A] | [clears/replaces/N/A] |
| [backend-rejected or stale state] | [Yes/No/N/A] | [Yes/No/N/A] | [message/state] | [transformed/preserved/N/A] | [clears/replaces/N/A] |

### Edge Cases

<!--
  ACTION REQUIRED: The content in this section represents placeholders.
  Fill them out with the right edge cases. Consider observable UI states,
  backend business rules, API contracts, authorization, persistence, migrations,
  mobile/device-specific behavior, i18n-visible behavior, shared components,
  global styling, and operational safety when those surfaces are in scope.
-->

- What happens when [boundary condition]?
- How does system handle [error scenario]?

## Requirements *(mandatory)*

<!--
  ACTION REQUIRED: Fill only the requirement subsections that apply. Include
  Functional Requirements when the feature changes observable product or user
  behavior. Include Technical Requirements when the work has technical,
  architectural, migration, security, operational, refactoring, or enabling
  requirements. Do not invent functional requirements for purely technical work
  or technical requirements for an ordinary product feature without a real need.
  Requirements for visible behavior must be detailed enough to verify what the
  user sees or experiences. Requirements for correctness-sensitive technical
  behavior must identify the observable contract or responsible evidence layer.
-->

### Functional Requirements *(include when observable product or user behavior changes)*

- **FR-001**: System MUST [observable product capability]
- **FR-002**: Users MUST be able to [observable interaction or workflow]
- **FR-003**: System MUST [observable validation, state change, or response]
- **FR-004**: System MUST [observable data behavior, if applicable]
- **FR-005**: System MUST [observable error, empty-state, or edge-case behavior]

*Example of marking unclear product requirements:*

- **FR-006**: System MUST [NEEDS CLARIFICATION: product behavior or scope decision not specified]
- **FR-007**: Users MUST be able to [NEEDS CLARIFICATION: user-visible workflow decision not specified]

### Technical Requirements *(include for technical, architectural, migration, security, operational, refactoring, or enabling work)*

<!--
  Technical requirements MUST describe objectively verifiable outcomes,
  constraints, contracts, compatibility requirements, migration behavior, or
  safety properties. They MUST remain traceable to the feature goal, an
  approved decision, current repository evidence, or the constitution. Avoid
  prescribing individual classes, methods, or files unless that detail is
  itself an approved architectural constraint. Avoid implementation narration
  or step-by-step tutorial content.
-->

- **TR-001**: System MUST [objectively verifiable technical outcome or constraint]
- **TR-002**: System MUST preserve [contract, compatibility requirement, migration behavior, or safety property]
- **TR-003**: Validation MUST demonstrate [objective evidence required by the feature, repository evidence, approved decision, or constitution]

*Example of marking unclear technical requirements:*

- **TR-004**: System MUST [NEEDS CLARIFICATION: technical constraint, compatibility requirement, or safety property not specified]

### Scope Boundaries

- **SB-001**: Feature MUST remain within the CatWorld cat-boarding domain.
- **SB-002**: Feature MUST distinguish implemented behavior from assumptions,
  exclusions, and unresolved product or architectural questions.
- **SB-003**: Feature MUST NOT introduce cross-species abstractions,
  multi-tenancy, generic platform claims, or permanent product limits without
  explicit requirements.

### Out of Scope

- [List behavior, data, workflows, integrations, or operational changes that
  this feature explicitly does not include]

### Open Questions

- [Record major unresolved product or architectural decisions here. Major open
  decisions block planning or implementation until resolved.]

### Key Entities *(include if feature involves data)*

- **[Entity 1]**: [What it represents, key attributes without implementation]
- **[Entity 2]**: [What it represents, relationships to other entities]

## Success Criteria *(mandatory)*

<!--
  ACTION REQUIRED: Define success criteria traceable to an explicit
  requirement, known baseline, repository evidence, or human decision. Do not
  invent throughput, latency, user-count, data-volume, percentage,
  completion-time, satisfaction, adoption, or business-impact metrics. When no
  justified numerical target exists, use an objectively verifiable behavioral
  or technical pass/fail outcome.
-->

### Measurable Outcomes

- **SC-001**: [Traceable behavioral or technical outcome with its source]
- **SC-002**: [Measurable target supported by the specification, repository evidence, or human decision, or an objective pass/fail outcome]
- **SC-003**: [Additional traceable outcome if needed]
- **SC-004**: [Additional traceable outcome if needed]

## Assumptions

<!--
  ACTION REQUIRED: The content in this section represents placeholders.
  Fill them out only with low-impact defaults that do not change product
  behavior, architecture, persistence, security, authorization, shared
  contracts, or operational safety.
  Confirmed technical or product dependencies should be documented explicitly
  in requirements, scope, or open questions rather than disguised as
  assumptions.
  Major unresolved product or architectural decisions belong under Open
  Questions and block planning or implementation. Implementation agents must
  not convert unresolved decisions into assumptions.
-->

- [Assumption about target users, e.g., "Users have stable internet connectivity"]
- [Minor default that cannot change product behavior, architecture,
  persistence, security, authorization, shared contracts, or operational safety]
