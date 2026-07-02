# Feature Specification: Cat and Stay Material Forms

**Feature Branch**: `feat/180-migrate-cat-and-stay-forms-to-angular-material`

**Created**: 2026-07-02

**Input**: GitHub issue #180, "[Frontend] Migrate cat and stay forms to Angular Material"

## User Scenarios, Technical Outcomes & Testing _(mandatory)_

### User Story 1 - Maintain Cats With Material Forms (Priority: P1)

An authenticated CatWorld user can create and edit cat records through the existing cat form workflow using the Material form pattern established by issue #179, while preserving current payloads, validation, translations, owner and vet interactions, related-record navigation, loading state, disabled state, and submit behavior.

**Why this priority**: Cat records are core administration data and are referenced by stays. A form regression would affect both daily record maintenance and later booking workflows.

**Independent Test**: Can be tested by opening cat create and edit pages, exercising required and optional fields, owner and vet selections, related-record links, successful saves, backend errors, loading states, query-parameter behavior, and small-width layouts at 320, 375, and 390 CSS pixels.

**Acceptance Scenarios**:

1. **Given** an authenticated user opens the cat create page, **When** they complete and submit the form, **Then** every applicable control uses the agreed Material component while the cat creation payload, validation, translations, related-record navigation, query-parameter behavior, and post-submit navigation remain unchanged.
2. **Given** an authenticated user opens a cat edit page, **When** existing cat data loads and the user saves changes, **Then** the form uses Material presentation while preserving current loading, disabled, backend-error, payload, optional-value, owner, vet, and navigation behavior.
3. **Given** the cat form is viewed at 320, 375, or 390 CSS pixels, **When** the user interacts with all fields and actions, **Then** controls, labels, validation messages, related links, and actions remain usable without incoherent overlap.

---

### User Story 2 - Maintain Stays With Material Forms (Priority: P2)

An authenticated CatWorld user can create and edit stays through the existing stay form workflow using the Material form pattern established by issue #179, while preserving current date, time, owner, multi-cat selection, status-related, validation, translation, related-record navigation, and submit behavior.

**Why this priority**: Stay create/edit forms are complex booking workflows. The migration must improve form consistency without weakening date, optional-value, multi-cat, status, or navigation behavior that protects operational accuracy.

**Independent Test**: Can be tested by opening stay create and edit pages, exercising owner selection, multi-cat selection, date and time fields, optional fields, status-related controls, successful saves, backend errors, loading states, existing related links, query-parameter behavior, and small-width layouts at 320, 375, and 390 CSS pixels.

**Acceptance Scenarios**:

1. **Given** an authenticated user opens the stay create page, **When** they select the owner, one or more cats, dates, times, and optional values and submit, **Then** every applicable control uses the agreed Material component while preserving the existing stay creation payload, multi-cat behavior, validation, translations, query-parameter behavior, and navigation.
2. **Given** an authenticated user opens a stay edit page, **When** existing stay data loads and the user changes permitted fields, **Then** the form uses Material presentation while preserving current loading, disabled, backend-error, date, time, optional-value, multi-cat, status-related, payload, and navigation behavior.
3. **Given** the stay form is used with keyboard or touch input, **When** the user edits date, datetime, optional-value, select, checkbox, and multi-cat controls, **Then** the controls remain operable and validation remains understandable without changing submit eligibility.
4. **Given** the stay form is viewed at 320, 375, or 390 CSS pixels, **When** the user interacts with all field groups and actions, **Then** controls, labels, validation messages, related links, and actions remain usable without incoherent overlap.

### Observable Behavior Detail _(include when visible UI or user-observable behavior changes)_

- **Visible states**: Cat and stay create/edit forms show Material form fields, inputs, date and time controls where suitable, selects, checkboxes, buttons, and validation presentation for every in-scope control where an agreed Material component exists. Existing page-level loading, backend-error, empty or missing-record, disabled, and success/navigation states remain unchanged in behavior and translated copy.
- **Interaction outcomes**: Existing submit blocking, API submission timing, payload shaping, post-submit navigation, edit-page loading, related-record links, query-parameter behavior, current owner selection, vet interactions, stay status-related interactions, and multi-cat selection behavior are preserved.
- **Copy and localization**: User-facing labels, hints, validation messages, backend errors, action text, and related-record text continue to use the existing internationalization system. This feature does not introduce new untranslated form copy.
- **Responsive/mobile behavior**: Cat and stay forms remain usable at 320, 375, and 390 CSS pixels. Layout grouping stays in component SCSS and prevents incoherent overlap of controls, labels, validation text, backend errors, related links, and action buttons.

### Input/State Validation Matrix _(include when validation or state-sensitive behavior changes)_

| Input or State                                                                            | Submit/Action Blocked?                                  | API Call Made?                          | Visible Error or Conflict                                                                                      | Value Transformed or Preserved                                        | Correction Behavior                                                                                     |
| ----------------------------------------------------------------------------------------- | ------------------------------------------------------- | --------------------------------------- | -------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| Required cat or stay field missing or invalid                                             | Yes, matching current behavior                          | No                                      | Existing translated field validation appears through Material presentation                                     | Current form value state is preserved                                 | Correcting the value clears or replaces the field-level message as it does today                        |
| Date, datetime, or time boundary invalid                                                  | Yes, matching current behavior                          | No                                      | Existing translated validation or browser-supported invalid state remains visible through the migrated control | Existing date/time conversion and value semantics are preserved       | Correcting the value restores current submit eligibility                                                |
| Optional cat or stay value left blank                                                     | No, when currently allowed                              | Yes, when the rest of the form is valid | None beyond current optional-field behavior                                                                    | Existing blank/null/undefined payload semantics are preserved         | N/A                                                                                                     |
| Owner, vet, current owner, or status-related selection state                              | Matching current behavior                               | Matching current behavior               | Existing validation, disabled, or state message remains visible where currently shown                          | Existing selected identifiers and status-related values are preserved | Changing the selection updates dependent state as it does today                                         |
| Stay multi-cat selection has no selected cat, unavailable cat, or otherwise invalid state | Matching current behavior                               | Matching current behavior               | Existing translated validation or conflict presentation remains visible through Material presentation          | Existing selected cat identifiers and order semantics are preserved   | Correcting the selection clears or replaces the message as it does today                                |
| Backend-rejected create or update request                                                 | No additional client-side block beyond current behavior | Yes                                     | Existing backend-error presentation remains visible and translated                                             | Submitted values remain available for correction                      | A later successful correction follows current navigation and clears/replaces the error as it does today |

### Edge Cases

- A date or time control may not have a suitable agreed Material replacement for the exact current input role; the migrated form must still use the agreed Material component where one exists and must not invent a parallel custom control system.
- Existing validation timing must be preserved: Material error presentation must not enable submission earlier or later than the current form.
- Existing optional values must keep their current payload semantics, including blank and absent-value handling.
- Stay selection must preserve the current owner and multi-cat interactions, including any dependent option filtering, disabled state, validation, and correction behavior.
- Cat forms must preserve owner, vet, and related-record navigation behavior, including existing query-parameter-driven defaults or return paths.
- Stay edit status-related controls and display states must remain available and behave as they do today.
- Backend errors may appear after create, update, or edit-page load failures; those errors must remain visible, translated, and not be confused with field-level validation.
- At 320, 375, and 390 CSS pixels, dense field groups, long translated labels, validation text, related links, and action buttons must remain usable without overlap.

## Requirements _(mandatory)_

### Functional Requirements _(include when observable product or user behavior changes)_

- **FR-001**: Cat create and edit forms MUST use Angular Material form fields, inputs, selects, checkboxes, buttons, and validation presentation for every applicable interactive control where an agreed Material component exists.
- **FR-002**: Stay create and edit forms MUST use Angular Material form fields, inputs, date and time controls where suitable, selects, checkboxes, buttons, and validation presentation for every applicable interactive control where an agreed Material component exists.
- **FR-003**: The migrated forms MUST preserve current request payloads, client-side validation rules, backend-error behavior, loading behavior, disabled behavior, translations, navigation, related-record links, query-parameter behavior, and submit eligibility.
- **FR-004**: Date, datetime, time, optional-value, owner, vet, status-related, and multi-cat selection behavior MUST remain usable with keyboard and touch input and MUST preserve current value conversion semantics.
- **FR-005**: Stay forms MUST preserve existing current owner and multi-cat selection interactions, including current dependent state changes and validation behavior.
- **FR-006**: Cat forms MUST preserve existing owner, vet, and related-record interactions, including current query-parameter behavior.
- **FR-007**: Form layout, product-specific grouping, and responsive composition MUST remain in component SCSS for the migrated cat and stay pages.
- **FR-008**: The migrated forms MUST remain usable at 320, 375, and 390 CSS pixels with no incoherent overlap of controls, labels, validation text, backend errors, related links, or actions.
- **FR-009**: Superseded native-control styling used solely by the migrated cat and stay form surfaces MUST be removed while preserving styling still needed by out-of-scope surfaces.

### Technical Requirements _(include for technical, architectural, migration, security, operational, refactoring, or enabling work)_

- **TR-001**: The feature MUST reuse the approved Angular Material foundation from issue #177 and the Material form pattern established by issue #179; it MUST NOT introduce another UI framework, duplicate design system, or broad unapproved form infrastructure.
- **TR-002**: Backend behavior, persistence, authorization, API contracts, DTO payload shapes, route contracts, and CatWorld domain rules MUST remain unchanged.
- **TR-003**: Validation MUST include `cd frontend && npm run format:check`, `cd frontend && npm run test:ci`, `cd frontend && npm run build`, and keyboard/touch mobile form smoke testing at 320, 375, and 390 CSS pixels.

### Scope Boundaries

- **SB-001**: Feature MUST remain within the CatWorld cat-boarding domain.
- **SB-002**: Feature MUST distinguish implemented behavior from assumptions, exclusions, and unresolved product or architectural questions.
- **SB-003**: Feature MUST NOT introduce cross-species abstractions, multi-tenancy, generic platform claims, or permanent product limits without explicit requirements.
- **SB-004**: Feature scope is limited to GitHub issue #180 and the active worktree.
- **SB-005**: Implementation MUST follow the approved Angular Material foundation from issue #177 and the existing Material form migration pattern from issue #179 when present in the active worktree.

### Out of Scope

- New searchable selectors or draft-restoration behavior.
- Cat photo controls.
- Vaccine warnings.
- Pricing behavior or calculated-night behavior.
- Backend contract, persistence, authorization, route guard, DTO, or domain-rule changes.
- Product redesign unrelated to the Material migration.
- Later issue work from #119, #154, #160, #162, #165, #168, or #173.

### Open Questions

- No blocking specification questions are identified. Planning must verify that the issue #177 Angular Material foundation and issue #179 Material form pattern are present in the active worktree and document how this issue reuses them.

### Dependencies and Planning Inputs

- Parent epic: GitHub issue #176.
- Hard dependencies: GitHub issues #177 and #179, or their equivalent implemented Angular Material foundation and form pattern in the active worktree.
- Validation input: issue #180 requires frontend format, test, and build commands plus keyboard and target-iPhone form smoke testing.
- Coordination input: later issues #119, #154, #160, #162, #165, #168, and #173 should build on these migrated surfaces rather than be implemented inside this issue.

### Key Entities _(include if feature involves data)_

- **Cat**: The administered cat record edited by the cat create/edit forms, including existing required and optional attributes, owner relationship, vet relationship, and related-record navigation.
- **Stay**: The booking record edited by the stay create/edit forms, including existing date/time values, optional values, owner relationship, participating cats, and status-related state.
- **Owner**: The person or account associated with cats and stays, including current owner selection and related navigation behavior.
- **Vet**: The veterinary record associated with cat forms where currently supported.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: Review confirms every applicable interactive control in cat create/edit and stay create/edit forms uses the agreed Material component where one exists.
- **SC-002**: Review and tests confirm request payloads, validation rules, translations, navigation, related-record links, query-parameter behavior, submit eligibility, loading behavior, disabled behavior, and backend-error behavior are preserved for migrated forms.
- **SC-003**: Review and smoke testing confirm date, datetime, time, optional-value, owner, vet, status-related, and multi-cat selection controls remain usable with keyboard and touch input.
- **SC-004**: Review confirms superseded native-control styling used solely by the migrated cat and stay form pages has been removed without affecting out-of-scope surfaces.
- **SC-005**: Mobile smoke testing at 320, 375, and 390 CSS pixels confirms migrated cat and stay forms remain usable without incoherent overlap.
- **SC-006**: `cd frontend && npm run format:check` completes successfully.
- **SC-007**: `cd frontend && npm run test:ci` completes successfully.
- **SC-008**: `cd frontend && npm run build` completes successfully.
- **SC-009**: Review confirms no backend, persistence, API contract, route contract, cat photo, vaccine warning, pricing, calculated-night, searchable selector, draft-restoration, or unrelated product redesign change is included.

## Assumptions

- "Cat create/edit" and "stay create/edit" refer to the existing routed administration pages and shared form behavior present in the active worktree.
- "Agreed Material component" means the Angular Material components already approved by issue #177 and used by the issue #179 form migration pattern for matching form-control roles.
- Existing automated frontend tests and the production build are the baseline automated checks for preserving behavior, supplemented by the issue-required keyboard/touch mobile form smoke test.
