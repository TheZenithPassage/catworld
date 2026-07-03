# Feature Specification: Material Controls Migration

**Feature Branch**: `feat/182-migrate-calendar-dashboard-and-remaining-controls-to-angular-material`

**Created**: 2026-07-03

**Input**: User description: "Issue #182: [Frontend] Migrate calendar, dashboard and remaining controls to Angular Material. Complete the Material migration of existing interactive controls outside the application shell, forms and operational tables. Migrate dashboard actions and controls where Material provides an appropriate component. Migrate calendar filters, display options and surrounding actions while preserving FullCalendar itself. Migrate remaining existing buttons, links styled as controls, checkboxes, selectors and feedback controls not covered by #178-#181. Preserve current routes, filters, translations, authorization and feature behavior. Keep FullCalendar rendering and product-specific calendar layouts custom. Record an explicit reason for any remaining native interactive control that is intentionally retained. Validation: `cd frontend && npm run format:check`, `cd frontend && npm run test:ci`, `cd frontend && npm run build`, plus calendar, dashboard, keyboard and target-iPhone smoke tests."

## User Scenarios, Technical Outcomes & Testing *(mandatory)*

### User Story 1 - Use Dashboard Actions After Material Migration (Priority: P1)

Operational users need the dashboard's existing actions and controls to remain available and recognizable while using the approved Material control patterns.

**Why this priority**: The dashboard is a primary entry point, so its controls must migrate without changing daily navigation, authorization, or feature behavior.

**Independent Test**: Can be tested by opening the dashboard with representative roles and data states, then confirming that each existing action and control renders through an appropriate Material component and keeps its current route, enabled/disabled state, translated label, and behavior.

**Acceptance Scenarios**:

1. **Given** a dashboard action is available to the current user, **When** the dashboard renders, **Then** the action uses an appropriate Material control and leads to the same route or behavior as before.
2. **Given** a dashboard action is hidden, disabled, or otherwise unavailable under current authorization or data state, **When** the dashboard renders, **Then** the migrated control preserves the existing visibility and availability behavior.
3. **Given** the user navigates through dashboard controls with the keyboard, **When** focus reaches each available action, **Then** focus remains visible and the activation behavior matches the pre-migration surface.

---

### User Story 2 - Filter and Operate the Calendar Without Behavior Changes (Priority: P2)

Users need calendar filters, display options, and surrounding actions to use Material controls while FullCalendar and the product-specific calendar presentation continue to behave as they do today.

**Why this priority**: Calendar filtering and display controls affect daily stay visibility; the migration is only acceptable if these controls remain behaviorally stable.

**Independent Test**: Can be tested by opening the calendar, changing each existing filter and display option, activating surrounding actions, and confirming that displayed stays, labels, routes, translations, and FullCalendar behavior are unchanged.

**Acceptance Scenarios**:

1. **Given** the calendar has existing filter or display controls, **When** a user changes each control, **Then** the resulting calendar state and displayed stay data match the current behavior.
2. **Given** the calendar includes surrounding actions such as navigation or view actions, **When** the user activates them, **Then** the migrated Material control triggers the same action and route behavior as before.
3. **Given** FullCalendar renders stay content, labels, and custom layout, **When** the surrounding controls are migrated, **Then** FullCalendar itself remains in place and product-specific calendar rendering remains custom.

---

### User Story 3 - Finish Remaining Control Migration With Explicit Exceptions (Priority: P3)

Maintainers need remaining existing native controls outside the already migrated shell, forms, and operational tables to either move to Material equivalents or be intentionally retained with a clear reason.

**Why this priority**: The issue closes the remaining interactive-control migration scope and requires future maintainers to understand any native controls that remain.

**Independent Test**: Can be tested by reviewing remaining frontend interactive controls outside #178-#181 scope and confirming that each in-scope button, link styled as a control, checkbox, selector, and feedback control either uses an appropriate Material component or has an explicit retention reason.

**Acceptance Scenarios**:

1. **Given** an existing button, link styled as a control, checkbox, selector, or feedback control is outside the already migrated surfaces, **When** a Material equivalent exists, **Then** the control uses the Material equivalent without changing user-observable behavior.
2. **Given** an existing native interactive control is intentionally retained, **When** maintainers review the migration result, **Then** the retained control has an explicit reason tied to the current product or technical constraint.
3. **Given** a migrated control appears on a narrow target-iPhone viewport, **When** the user views and interacts with it, **Then** labels, focus, hit targets, and surrounding layout remain usable without incoherent overlap.

### Observable Behavior Detail *(include when visible UI or user-observable behavior changes)*

- **Visible states**: Existing loading, empty, error, disabled, selected, checked, filtered, and feedback states remain available wherever those states already exist. Material controls may change visual styling, but they must not remove or rename existing states.
- **Interaction outcomes**: Existing routes, filtering results, display options, action behavior, keyboard activation, focus order, and role-dependent visibility remain unchanged.
- **Copy and localization**: Existing translated labels, helper text, errors, and action copy are preserved through the existing internationalization system. New hard-coded user-facing copy is not introduced for migrated controls.
- **Responsive/mobile behavior**: Dashboard, calendar, and remaining control surfaces remain usable on supported desktop and target-iPhone viewports. Controls must not overlap, clip important text, or cause page-wide horizontal overflow.

### Input/State Validation Matrix *(include when validation or state-sensitive behavior changes)*

| Input or State | Submit/Action Blocked? | API Call Made? | Visible Error or Conflict | Value Transformed or Preserved | Correction Behavior |
|----------------|------------------------|----------------|---------------------------|--------------------------------|---------------------|
| Dashboard action available to current role | No | Existing call or navigation behavior preserved | Existing success, error, or navigation state | Existing values and route parameters preserved | N/A |
| Dashboard action unavailable to current role or state | Existing hidden/disabled behavior preserved | No call for unavailable action | Existing hidden, disabled, or unavailable state | Existing data preserved | Role or state change updates availability as before |
| Calendar filter or display option changed | Existing behavior preserved | Existing API/local filtering behavior preserved | Existing error or empty state if applicable | Existing filter value semantics preserved | Changing or clearing the control updates the calendar as before |
| Calendar data load fails or returns no visible stays | N/A | Existing load behavior preserved | Existing error or empty/zero-result state | Existing filter and date state preserved | Retry or state change follows current behavior |
| Remaining control has a Material equivalent | Existing behavior preserved | Existing call or local action behavior preserved | Existing state or validation message preserved | Existing values preserved or transformed exactly as before | Existing correction behavior preserved |
| Native control intentionally retained | Existing behavior preserved | Existing behavior preserved | Existing state preserved | Existing values preserved | Explicit retention reason documents why it remains native |

### Edge Cases

- Calendar controls are changed repeatedly or in combination; the displayed stay set and selected display options remain consistent with the current behavior.
- FullCalendar content, custom stay labels, and product-specific calendar layout remain intact after surrounding controls migrate.
- Dashboard or calendar action labels are long in one supported language; Material controls and responsive layout avoid text overlap or clipped critical actions.
- A role-sensitive action is unavailable; the migrated surface preserves whether the existing product hides or disables the action.
- A target-iPhone viewport presents dashboard, calendar, or remaining controls; focus, hit targets, wrapping, and scrolling remain usable.
- A native control remains because Material does not provide an appropriate equivalent or because replacing it would change FullCalendar/product-specific behavior; the reason is explicitly recorded.

## Requirements *(mandatory)*

### Functional Requirements *(include when observable product or user behavior changes)*

- **FR-001**: Dashboard actions and controls MUST use appropriate Angular Material components where equivalents exist while preserving current routes, translations, authorization-sensitive visibility, enabled/disabled states, and feature behavior.
- **FR-002**: Calendar filters, display options, and surrounding actions MUST use appropriate Angular Material controls where equivalents exist while preserving existing filter semantics, display behavior, date/view behavior, translations, and routes.
- **FR-003**: FullCalendar itself MUST remain integrated as the calendar renderer, and product-specific calendar layout and stay rendering MUST remain custom.
- **FR-004**: Remaining existing buttons, links styled as controls, checkboxes, selectors, and feedback controls outside the application shell, forms, and operational tables MUST use Material equivalents when an appropriate equivalent exists.
- **FR-005**: Any native interactive control intentionally retained after this migration MUST have an explicit reason recorded for reviewers and future maintainers.
- **FR-006**: Migrated controls MUST preserve existing keyboard reachability, visible focus behavior, activation behavior, and logical focus order.
- **FR-007**: Migrated dashboard, calendar, and remaining control surfaces MUST remain responsive and usable on supported desktop and target-iPhone viewports without incoherent overlap, clipped critical text, or page-wide horizontal overflow.
- **FR-008**: The migration MUST preserve existing user-facing copy through the current internationalization system and MUST NOT introduce hard-coded replacement text where translations already exist.
- **FR-009**: The migration MUST NOT add new routes, filters, sorting, display modes, calendar behavior, data fields, authorization rules, backend calls, persistence behavior, or product workflows.

### Technical Requirements *(include for technical, architectural, migration, security, operational, refactoring, or enabling work)*

- **TR-001**: The implementation MUST stay within the existing Angular and Angular Material frontend stack approved by the prior Material foundation and migration work.
- **TR-002**: The implementation MUST NOT introduce new frontend frameworks, component libraries, backend API contracts, persistence changes, or authorization mechanisms.
- **TR-003**: Material migration work MUST remain focused on the dashboard, calendar surrounding controls, and remaining existing controls not covered by #178-#181.
- **TR-004**: Product-specific FullCalendar rendering and responsive styling MUST remain in the existing frontend component styling approach rather than becoming unrelated global style or framework changes.
- **TR-005**: Validation MUST include `npm run format:check`, `npm run test:ci`, `npm run build`, and calendar, dashboard, keyboard, and target-iPhone smoke tests.

### Scope Boundaries

- **SB-001**: Feature MUST remain within the CatWorld cat-boarding domain.
- **SB-002**: Feature MUST distinguish implemented behavior from assumptions, exclusions, and unresolved product or architectural questions.
- **SB-003**: Feature MUST NOT introduce cross-species abstractions, multi-tenancy, generic platform claims, or permanent product limits without explicit requirements.

### Out of Scope

- Replacing FullCalendar.
- Adding the full-month occupancy mode from #163.
- Adding new filters, sorting, calendar display modes, or calendar behavior.
- Implementing dark mode from #126.
- Changing backend APIs, persistence, authorization rules, routing contracts, or domain behavior.
- Reworking the application shell, forms, or operational tables already covered by #178-#181 except where a remaining control outside those scopes is discovered and justified by this issue.

### Open Questions

- None.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Dashboard controls in scope render through Angular Material equivalents where available while preserving current routes, authorization-sensitive availability, translations, and behavior.
- **SC-002**: Calendar filters, display options, and surrounding actions render through Angular Material equivalents where available while FullCalendar rendering and current calendar behavior remain unchanged.
- **SC-003**: Remaining in-scope buttons, links styled as controls, checkboxes, selectors, and feedback controls either use Material equivalents or have an explicit recorded retention reason.
- **SC-004**: Keyboard and focus smoke testing confirms migrated dashboard, calendar, and remaining controls are reachable and activatable with visible focus.
- **SC-005**: Target-iPhone smoke testing confirms migrated controls remain usable without incoherent overlap, clipped critical text, or page-wide horizontal overflow.
- **SC-006**: `npm run format:check`, `npm run test:ci`, and `npm run build` complete successfully from `frontend`.

## Assumptions

- The current repository state includes the approved Angular Material foundation and earlier migration patterns from #177-#181.
- Existing behavior means the behavior present on the issue branch before this feature's implementation changes begin.
