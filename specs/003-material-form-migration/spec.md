# Feature Specification: Material Form Migration

**Feature Branch**: `feat/179-migrate-login-owner-and-vet-forms-to-angular-material`

**Created**: 2026-07-01

**Input**: GitHub issue #179, "[Frontend] Migrate login, owner and vet forms to Angular Material"

## User Scenarios, Technical Outcomes & Testing *(mandatory)*

### User Story 1 - Sign In With A Material Login Form (Priority: P1)

A CatWorld user can sign in through the existing login workflow using Angular Material form controls, validation presentation, buttons, and backend-error display without any change to credentials, request payloads, navigation, loading state, or submit eligibility.

**Why this priority**: Login is the entry point to the administration interface, and a regression would block all authenticated workflows.

**Independent Test**: Can be tested by rendering the login page, entering valid and invalid credentials, triggering client-side and backend errors, and confirming the existing submit, loading, disabled, translation, and post-login navigation behavior is preserved while every applicable interactive form control uses a Material component.

**Acceptance Scenarios**:

1. **Given** the login page is displayed, **When** the user enters credentials and submits, **Then** the form uses Material-appropriate fields, inputs, buttons, and validation presentation while preserving the current login request and navigation behavior.
2. **Given** required login fields are missing or invalid, **When** validation is shown, **Then** Material validation presentation appears consistently without enabling submission earlier or later than before.
3. **Given** the backend rejects a login attempt or the request is loading, **When** the state is displayed, **Then** backend-error, loading, and disabled behavior remains correct and user-facing copy remains managed through the existing i18n system.

---

### User Story 2 - Maintain Owners With Material Forms (Priority: P2)

An authenticated CatWorld user can create and edit owner records through the existing owner form workflow using Material form controls and validation presentation while preserving current payloads, validation rules, navigation, and submit behavior.

**Why this priority**: Owner create/edit forms are core administration workflows and establish the reusable pattern for later, more complex forms.

**Independent Test**: Can be tested by opening owner create and edit pages, exercising required fields, successful saves, backend validation or save errors, loading states, and responsive widths at 320, 375, and 390 CSS pixels.

**Acceptance Scenarios**:

1. **Given** an authenticated user opens the owner create page, **When** they complete and submit the form, **Then** Material fields, inputs, buttons, and validation presentation are used without changing the owner creation payload, navigation, or submit rules.
2. **Given** an authenticated user opens an owner edit page, **When** existing data loads and the user saves changes, **Then** Material form presentation is used while preserving current loading, disabled, backend-error, payload, and navigation behavior.
3. **Given** the owner form is viewed at 320, 375, or 390 CSS pixels, **When** the user interacts with all controls and actions, **Then** the form remains usable without text or controls overlapping.

---

### User Story 3 - Maintain Vets With Material Forms (Priority: P3)

An authenticated CatWorld user can create and edit vet records through the existing vet form workflow using Material form controls and validation presentation while preserving current payloads, validation rules, navigation, and submit behavior.

**Why this priority**: Vet forms are simpler administration forms and should follow the same reusable Material form pattern established for login and owners.

**Independent Test**: Can be tested by opening vet create and edit pages, exercising required fields, successful saves, backend validation or save errors, loading states, and responsive widths at 320, 375, and 390 CSS pixels.

**Acceptance Scenarios**:

1. **Given** an authenticated user opens the vet create page, **When** they complete and submit the form, **Then** Material fields, inputs, buttons, and validation presentation are used without changing the vet creation payload, navigation, or submit rules.
2. **Given** an authenticated user opens a vet edit page, **When** existing data loads and the user saves changes, **Then** Material form presentation is used while preserving current loading, disabled, backend-error, payload, and navigation behavior.
3. **Given** the vet form is viewed at 320, 375, or 390 CSS pixels, **When** the user interacts with all controls and actions, **Then** the form remains usable without text or controls overlapping.

### Edge Cases

- A form control may not have a direct Material replacement; in that case the form must use the agreed Material component where one exists and avoid introducing a new parallel native-control pattern.
- Existing validation timing must be preserved: Material error presentation must not change when the form becomes submittable or when validation messages are eligible to appear.
- Backend errors may appear after a failed login, owner save, vet save, or edit-page data load; those errors must remain visible, translated, and not confused with field-level validation.
- Submit actions may be loading or disabled; users must not be able to double-submit or bypass existing disabled states during the migration.
- Owner and vet edit pages depend on existing record-loading behavior; Material presentation must not change how missing records, load errors, or navigation away are handled.
- At 320, 375, and 390 CSS pixels, field labels, error text, action buttons, and backend errors must remain usable without overlap.

## Requirements *(mandatory)*

### Functional Requirements *(include when observable product or user behavior changes)*

- **FR-001**: The login form MUST use Angular Material form field, input, button, and validation presentation components for every applicable interactive form control.
- **FR-002**: Owner create and edit forms MUST use Angular Material form field, input, button, and validation presentation components for every applicable interactive form control.
- **FR-003**: Vet create and edit forms MUST use Angular Material form field, input, button, and validation presentation components for every applicable interactive form control.
- **FR-004**: The migrated forms MUST preserve current request payloads, client-side validation rules, backend-error behavior, loading behavior, disabled behavior, translations, navigation, and submit eligibility.
- **FR-005**: Validation feedback MUST appear consistently across the migrated forms without changing when a form may be submitted.
- **FR-006**: Form layout and responsive composition MUST remain in component SCSS for the migrated pages.
- **FR-007**: The migrated forms MUST remain usable at 320, 375, and 390 CSS pixels with no incoherent overlap of controls, labels, validation text, backend errors, or actions.
- **FR-008**: User-facing form copy MUST remain managed through the existing internationalization system.

### Technical Requirements *(include for technical, architectural, migration, security, operational, refactoring, or enabling work)*

- **TR-001**: The feature MUST reuse the approved Angular Material foundation from #177 and the shared feedback conventions from #178 where they apply; it MUST NOT introduce another UI framework, duplicate design system, or broad Material module.
- **TR-002**: Superseded native-control styling used solely by the migrated login, owner, and vet form pages MUST be removed.
- **TR-003**: Backend behavior, persistence, authorization, API contracts, DTO payload shapes, route contracts, and CatWorld domain rules MUST remain unchanged.
- **TR-004**: The feature MUST NOT migrate cat forms, stay forms, searchable entity selectors from #160, tables, calendar behavior, or unrelated application pages.
- **TR-005**: Validation MUST include `cd frontend && npm run format:check`, `cd frontend && npm run test:ci`, `cd frontend && npm run build`, and a mobile form smoke test at 320, 375, and 390 CSS pixels.

### Scope Boundaries

- **SB-001**: Feature MUST remain within the CatWorld cat-boarding domain.
- **SB-002**: Feature MUST distinguish implemented behavior from assumptions, exclusions, and unresolved product or architectural questions.
- **SB-003**: Feature MUST NOT introduce cross-species abstractions, multi-tenancy, generic platform claims, or permanent product limits without explicit requirements.
- **SB-004**: Feature scope is limited to GitHub issue #179 and the active worktree.
- **SB-005**: Implementation MUST follow the approved Angular Material foundation and migration boundaries from #177 and the shared feedback conventions from #178 when present in the active worktree.

### Out of Scope

- Cat create/edit forms and stay create/edit forms.
- Searchable entity selectors from #160.
- New form fields, new product behavior, or changed backend contracts.
- Table, calendar, shell, route, guard, persistence, authorization, or domain-rule changes.
- Creating a separate design-system package, duplicate global design system, or broad Material module.

### Open Questions

- No blocking specification questions are identified. Planning must verify that the #177 Angular Material foundation and #178 shared feedback presentation are present and document how this issue reuses them.

### Dependencies and Planning Inputs

- Parent epic: GitHub issue #176.
- Hard dependency: GitHub issue #177, or the equivalent Angular Material foundation in the active worktree.
- Recommended dependency: GitHub issue #178, or the equivalent shared feedback presentation in the active worktree.
- Validation input: issue #179 requires mobile form smoke testing at 320, 375, and 390 CSS pixels in addition to the frontend format, test, and build commands.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Review confirms every applicable interactive control in the login, owner create/edit, and vet create/edit forms uses the agreed Material component where one exists.
- **SC-002**: Review and tests confirm request payloads, validation rules, translations, navigation, submit eligibility, loading behavior, disabled behavior, and backend-error behavior are preserved for migrated forms.
- **SC-003**: Review confirms superseded native-control styling used solely by the migrated login, owner, and vet form pages has been removed.
- **SC-004**: Mobile smoke testing at 320, 375, and 390 CSS pixels confirms migrated forms remain usable without incoherent overlap.
- **SC-005**: `cd frontend && npm run format:check` completes successfully.
- **SC-006**: `cd frontend && npm run test:ci` completes successfully.
- **SC-007**: `cd frontend && npm run build` completes successfully.
- **SC-008**: Review confirms no backend, persistence, API contract, route contract, cat form, stay form, searchable entity selector, table, calendar, duplicate design system, or broad Material module change is included.

## Assumptions

- "Owner create/edit" and "vet create/edit" refer to the existing routed administration pages and shared form behavior present in the active worktree.
- Existing automated frontend tests and the production build are the baseline automated checks for preserving behavior, supplemented by the issue-required mobile form smoke test.
- "Suitable Material form fields, inputs, selects, buttons and validation presentation" means the Angular Material components already approved by #177 for matching form-control roles.
