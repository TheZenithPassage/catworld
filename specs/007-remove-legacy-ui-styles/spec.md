# Feature Specification: Remove Legacy UI Styles

**Feature Branch**: `chore/183-remove-legacy-ui-styles-and-validate-angular-material-migration`

**Created**: 2026-07-04

**Input**: User description: "Issue #183: Finish epic #176 by removing the superseded native component system and validating the migrated frontend as one coherent Material-based interface."

## User Scenarios, Technical Outcomes & Testing *(mandatory)*

### Verifiable Technical Outcomes *(use instead of user stories for technical/enabling work)*

- **TO-001**: The authenticated administration frontend no longer maintains a parallel global or component-level styling system for native buttons, inputs, selects, textareas, control-like links, or data tables that were replaced by Angular Material in epic #176.
  - **Why this priority**: This is the primary cleanup required to complete the Material migration and avoid two competing UI foundations.
  - **Acceptance Scenarios**:
    1. **Given** the frontend source, **When** the remaining styles are audited, **Then** rules that only supported replaced native controls or tables are removed.
    2. **Given** an intentionally retained native control or control-like element, **When** the audit is complete, **Then** its reason is documented.
  - **Validation Evidence**: Source audit, changed CSS/SCSS review, and the required frontend validation commands.

- **TO-002**: Approved frontend styling responsibilities remain intact after the cleanup.
  - **Why this priority**: The issue explicitly preserves document defaults, Material theme setup, shared utilities, layout, responsive composition, CatWorld-specific presentation, and FullCalendar integration styles.
  - **Acceptance Scenarios**:
    1. **Given** global styles and component styles, **When** legacy native-control support is removed, **Then** Material theme setup and approved layout, responsive, utility, CatWorld presentation, and FullCalendar styles remain available.
    2. **Given** existing authenticated routes, translations, and role-sensitive visibility, **When** the migrated frontend is validated, **Then** those behaviors remain unchanged.
  - **Validation Evidence**: Frontend tests, production build, targeted source review, and manual smoke checks.

- **TO-003**: Project documentation names Angular Material as the default UI foundation and records customization boundaries.
  - **Why this priority**: Documentation must remain a source of truth for the completed migration and future UI work.
  - **Acceptance Scenarios**:
    1. **Given** `docs/ARCHITECTURE.md`, **When** the feature is complete, **Then** it describes Material as the default frontend UI foundation.
    2. **Given** retained custom styles or native controls, **When** maintainers read the documentation, **Then** they can distinguish approved customization boundaries from superseded component-system styles.
  - **Validation Evidence**: Documentation review and final diff review.

- **TO-004**: The migrated frontend passes required automated and manual validation.
  - **Why this priority**: The issue closes only when the Material-based interface is validated as coherent across keyboard and target devices.
  - **Acceptance Scenarios**:
    1. **Given** the frontend package, **When** `npm run format:check`, `npm run test:ci`, and `npm run build` run, **Then** all commands pass.
    2. **Given** authenticated administration surfaces, **When** manual keyboard, target-iPhone, and small-laptop smoke tests are performed, **Then** controls remain usable and visible behavior remains unchanged.
  - **Validation Evidence**: Command output statuses and manual validation notes.

### Observable Behavior Detail *(include when visible UI or user-observable behavior changes)*

- **Visible states**: Existing authenticated administration visible states, including empty states, validation messages, loading states, disabled states, destructive confirmations, conflict states, and success states, must be preserved unless they were already changed by completed Material migration dependencies.
- **Interaction outcomes**: Existing routes, dialogs, form submissions, control actions, role-sensitive action visibility, focus movement, keyboard activation, and table interactions must remain unchanged from the migrated Material implementation.
- **Copy and localization**: Existing localized copy must be preserved; this feature does not introduce new user-facing strings except documentation.
- **Responsive/mobile behavior**: Existing responsive composition must remain usable on the target iPhone viewport and a small-laptop viewport; cleanup must not reintroduce overflow or inaccessible tap targets.

### Input/State Validation Matrix *(include when validation or state-sensitive behavior changes)*

This feature does not change input validation, backend-rejected states, authorization, persistence, or API behavior. Validation-sensitive behavior is preserved by regression tests and manual smoke checks.

### Edge Cases

- Intentionally retained native browser controls, third-party widgets, or integration points must remain only when Material replacement is out of scope or technically inappropriate, and each retained case must be documented with a reason.
- FullCalendar and other third-party integration styling must not be removed merely because it styles non-Material markup.
- Document-level defaults, focus visibility, responsive layout helpers, and CatWorld-specific presentation styles must not be removed when they still serve approved non-component-system responsibilities.
- Cleanup must not remove styles required by public shell layout, authenticated navigation, responsive table containers, or existing Material customization.
- CSS class names that look generic but are still referenced by templates must be reviewed before removal.

## Requirements *(mandatory)*

### Technical Requirements *(include for technical, architectural, migration, security, operational, refactoring, or enabling work)*

- **TR-001**: The frontend MUST remove global and component styles whose only remaining purpose is to style native buttons, inputs, selects, textareas, tables, or control-like links that have been replaced by Angular Material.
- **TR-002**: The frontend MUST preserve approved style responsibilities for document defaults, Angular Material theme setup, shared utilities, layout, responsive composition, CatWorld-specific presentation, and FullCalendar integration.
- **TR-003**: The frontend MUST not change existing routes, product behavior, translations, role-sensitive visibility, persistence, backend APIs, or authorization.
- **TR-004**: The audit MUST identify any intentionally retained native controls or control-like links covered by the epic and document the reason they remain.
- **TR-005**: `docs/ARCHITECTURE.md` MUST describe Angular Material as the default UI foundation and define the boundaries for custom styling and native-control retention.
- **TR-006**: Validation MUST include frontend format checking, frontend tests, frontend production build, manual keyboard validation, target-iPhone smoke testing, and small-laptop smoke testing.

### Scope Boundaries

- **SB-001**: Feature MUST remain within the CatWorld cat-boarding domain.
- **SB-002**: Feature MUST distinguish implemented behavior from assumptions, exclusions, and unresolved product or architectural questions.
- **SB-003**: Feature MUST NOT introduce cross-species abstractions, multi-tenancy, generic platform claims, or permanent product limits without explicit requirements.

### Out of Scope

- Implementing dark mode from issue #126.
- Introducing new product behavior, visual redesign, routes, permissions, API contracts, persistence, or backend changes.
- Replacing FullCalendar or changing its integration model.
- Broad refactors unrelated to removing superseded UI infrastructure.
- Reworking completed Material migration decisions from issues #177, #178, #179, #180, #181, or #182.

### Open Questions

- None.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Source audit finds no remaining undocumented native buttons, inputs, selects, textareas, tables, or control-like links in authenticated administration surfaces that are covered by epic #176.
- **SC-002**: CatWorld no longer maintains global CSS rules that form a parallel native component system for replaced controls and tables.
- **SC-003**: `docs/ARCHITECTURE.md` records Angular Material as the default UI foundation and documents customization boundaries.
- **SC-004**: `cd frontend && npm run format:check`, `cd frontend && npm run test:ci`, and `cd frontend && npm run build` pass.
- **SC-005**: Manual keyboard, target-iPhone, and small-laptop smoke tests are completed with no scope-relevant regressions.

## Assumptions

- Issues #177, #178, #179, #180, #181, and #182 have already completed the Material migration work that this issue validates and cleans up.
- Any native controls retained outside authenticated administration surfaces are outside the audit unless they are shared with the migrated administration UI.
