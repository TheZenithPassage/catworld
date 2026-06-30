# Feature Specification: Material Application Shell

**Feature Branch**: `feat/178-material-application-shell`

**Created**: 2026-06-30

**Input**: GitHub issue #178, "[Frontend] Migrate the application shell and shared UI states to Angular Material"

## User Scenarios, Technical Outcomes & Testing *(mandatory)*

### User Story 1 - Navigate From A Responsive Material Shell (Priority: P1)

An authenticated CatWorld user can move through the existing administration areas from an application shell built with Angular Material surfaces and controls, with the routed feature page content still appearing in the expected place.

**Why this priority**: The shell wraps every authenticated workflow, so preserving navigation, routing, and responsive layout is the highest-risk and highest-value part of the migration.

**Independent Test**: Can be tested by signing in, resizing between desktop and target iPhone width, using the shell navigation/actions, and confirming the same existing routes and feature pages render without changed domain behavior.

**Acceptance Scenarios**:

1. **Given** an authenticated user is on a desktop viewport, **When** they use the application navigation, top bar, and primary shell actions, **Then** the shell uses Material-appropriate toolbar, navigation, menu, button, icon, progress, card, and surface primitives while preserving existing destinations and workflows.
2. **Given** an authenticated user is on the target iPhone width, **When** they open and use shell navigation, **Then** the shell remains usable and responsive without adding, removing, or renaming product routes.
3. **Given** a routed stay, customer, cat, or calendar page, **When** the route renders inside the migrated shell, **Then** the existing page workflow remains available with unchanged guards, API calls, translations, and domain behavior.

---

### User Story 2 - Recognize Shared Loading And Feedback States (Priority: P2)

An authenticated CatWorld user sees consistent Material-themed loading, empty, and error states across migrated shared shell surfaces, with accessible status communication and existing copy managed through the i18n system.

**Why this priority**: Shared feedback states shape the user's understanding of system progress and failures across the administration UI.

**Independent Test**: Can be tested by triggering representative loading, empty, and error states in shared shell or routed surfaces and verifying Material-themed presentation, accessibility, and i18n-backed copy.

**Acceptance Scenarios**:

1. **Given** a shared surface is loading, **When** progress is displayed, **Then** the state follows the Material theme and communicates progress accessibly without changing the underlying data fetch.
2. **Given** a migrated shared surface has no records to show, **When** the empty state renders, **Then** it uses a Material-compatible pattern and preserves appropriate user-facing copy through i18n.
3. **Given** a shared surface encounters an error, **When** the error state renders, **Then** it remains accessible, themed consistently, and does not expose hard-coded user-facing copy outside i18n.

---

### User Story 3 - Continue Existing Domain Workflows (Priority: P3)

CatWorld users can continue existing stay, customer, cat, and calendar workflows after the shell and shared states migrate to Material.

**Why this priority**: This migration is presentation-focused and must not disturb operational workflows or backend contracts.

**Independent Test**: Can be tested by running the existing frontend unit suite and production build and by reviewing that backend, persistence, API contracts, guards, and domain workflows are unchanged.

**Acceptance Scenarios**:

1. **Given** the migrated shell is in place, **When** existing stay, customer, cat, and calendar workflows are exercised by current tests, **Then** they continue to pass.
2. **Given** the implementation is reviewed, **When** backend, persistence, route, guard, API, and domain workflow boundaries are checked, **Then** no behavior or contract changes are present.

### Edge Cases

- If issue #177 has already installed Angular Material, CDK, animations, and CatWorld theming, this feature must reuse that foundation instead of adding a competing foundation.
- If the shell is used at target iPhone width, navigation and actions must remain reachable without redesigning the information architecture or adding new product routes.
- If a shared state has loading, empty, or error content with existing translation keys, those keys should be reused or updated consistently rather than replaced with hard-coded copy.
- If a migrated surface contains FullCalendar content, FullCalendar must remain in place and outside this issue's replacement scope.
- If Material primitives do not fit a complex form or table migration cleanly, that work must remain out of scope for the dedicated form/table issues.

## Requirements *(mandatory)*

### Functional Requirements *(include when observable product or user behavior changes)*

- **FR-001**: The authenticated application shell MUST use Angular Material toolbar, navigation, menu, button, icon, progress, card, and surface primitives where appropriate for shell controls and primary shell actions.
- **FR-002**: The migrated shell MUST remain responsive and usable on desktop and target iPhone width.
- **FR-003**: Routed feature pages MUST continue to render inside the application shell without changing existing product routes, route guards, API calls, translations, or domain workflows.
- **FR-004**: Shared loading states across migrated shell or shared surfaces MUST follow the Material theme and remain accessible.
- **FR-005**: Shared empty and error states across migrated shell or shared surfaces MUST follow Material-compatible patterns, remain accessible, and preserve user-facing copy through the existing i18n system.
- **FR-006**: Existing stay, customer, cat, and calendar workflows MUST continue to pass current frontend validation after the shell migration.
- **FR-007**: The migration MUST NOT introduce hard-coded user-facing copy outside the existing internationalization system.

### Technical Requirements *(include for technical, architectural, migration, security, operational, refactoring, or enabling work)*

- **TR-001**: The feature MUST reuse the Angular Material foundation from issue #177 when present; it may add Angular Material, CDK, BrowserAnimationsModule, and CatWorld theme setup only if the foundation is not already present.
- **TR-002**: The feature MUST NOT introduce a duplicate global design system, separate shell component library, or parallel shell framework.
- **TR-003**: The feature MUST keep backend behavior, persistence, authorization, API contracts, route contracts, and CatWorld domain rules unchanged.
- **TR-004**: The feature MUST NOT migrate complex forms or tables, redesign navigation information architecture, implement dark-mode preference persistence from #126, replace FullCalendar, or add product routes.
- **TR-005**: Validation MUST include `cd frontend && npm run format:check`, `cd frontend && npm run test:ci`, and `cd frontend && npm run build`.

### Scope Boundaries

- **SB-001**: Feature MUST remain within the CatWorld cat-boarding domain.
- **SB-002**: Feature MUST distinguish implemented behavior from assumptions, exclusions, and unresolved product or architectural questions.
- **SB-003**: Feature MUST NOT introduce cross-species abstractions, multi-tenancy, generic platform claims, or permanent product limits without explicit requirements.
- **SB-004**: Feature scope is limited to GitHub issue #178 and the active worktree.
- **SB-005**: Implementation MUST follow the approved Angular Material foundation and migration boundaries from issue #177 when they are present in the active worktree.

### Out of Scope

- Migrating complex forms or tables covered by #179, #180, #181, and #182.
- Redesigning navigation information architecture or adding product routes.
- Implementing dark-mode preference persistence from #126.
- Replacing FullCalendar.
- Changing backend behavior, persistence, authorization, API contracts, or CatWorld domain rules.
- Creating a separate design-system package, duplicate global design system, or parallel shell component library.

### Open Questions

- No blocking specification questions are identified. Planning must verify whether the #177 Angular Material foundation is already present and must document how this issue reuses it.

### Dependencies and Planning Inputs

- Parent epic: GitHub issue #176.
- Foundation dependency: GitHub issue #177, or the equivalent Angular Material foundation in the active worktree.
- Follow-on issue boundaries: complex form and table migrations remain with #179, #180, #181, and #182.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Desktop review confirms the authenticated application shell uses Material-appropriate shell primitives while preserving the same routes, labels, and operational workflows.
- **SC-002**: Target iPhone width review confirms the shell remains usable and responsive without changing navigation information architecture or adding product routes.
- **SC-003**: Review of migrated shared loading, empty, and error states confirms they follow the Material theme, remain accessible, and use i18n-managed user-facing copy.
- **SC-004**: `cd frontend && npm run format:check` completes successfully.
- **SC-005**: `cd frontend && npm run test:ci` completes successfully.
- **SC-006**: `cd frontend && npm run build` completes successfully.
- **SC-007**: Review confirms no backend, persistence, API contract, FullCalendar replacement, dark-mode preference persistence, complex form/table migration, duplicate design system, or parallel shell component library change is included.

## Assumptions

- "Target iPhone width" uses the same viewport target applied by CatWorld's frontend migration validation for #176 child issues.
- Existing frontend tests and production build are the baseline automated checks for preserving current stay, customer, cat, and calendar workflows.
