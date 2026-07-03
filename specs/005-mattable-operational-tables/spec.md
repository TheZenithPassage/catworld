# Feature Specification: MatTable Operational Tables

**Feature Branch**: `feat/181-migrate-operational-overviews-account-management-mattable`

**Created**: 2026-07-03

**Input**: User description: "Issue #181: [Frontend] Migrate operational overviews and account management to MatTable. Use `MatTable` and Material controls for the existing operational overviews and account-management surface without adding unrequested table capabilities. Migrate owner, cat, vet and stay overview tables plus the account-management table and its existing actions. Preserve current columns, row content, translations, filters, navigation and role-sensitive actions. Use Material buttons and related controls for row and page actions. Keep responsive wrappers and product-specific layout in component SCSS. Preserve clear loading, empty and error states. Validation: `cd frontend && npm run format:check`, `cd frontend && npm run test:ci`, `cd frontend && npm run build`, plus keyboard and responsive table smoke test."

## User Scenarios, Technical Outcomes & Testing *(mandatory)*

### User Story 1 - Review Operational Overviews in Material Tables (Priority: P1)

Operational users need the owner, cat, vet, and stay overview pages to continue showing the same information and navigation affordances after the tables move to the approved Material table surface.

**Why this priority**: These overviews are core administration entry points, and the migration is only successful if existing users can still scan records and reach the same workflows.

**Independent Test**: Can be tested by opening each migrated operational overview with loaded data and confirming that the same columns, row content, filters, translations, navigation, loading state, empty state, and error state remain available through Material table and control elements.

**Acceptance Scenarios**:

1. **Given** records exist for owners, cats, vets, or stays, **When** an operational user opens the corresponding overview, **Then** the page presents the existing data columns and row content in a Material table without new pagination, sorting, or configurable column behavior.
2. **Given** an overview currently supports filtering or navigation, **When** the user filters records or activates an existing row/page action, **Then** the behavior and destination match the pre-migration surface.
3. **Given** an overview is loading, has no matching records, or cannot load records, **When** the page renders that state, **Then** the existing localized state message remains clear and is visually associated with the migrated table surface.

---

### User Story 2 - Manage Accounts Through the Migrated Table (Priority: P2)

Administrators need the account-management table to keep the same account data and role-sensitive actions while using Material table and button controls.

**Why this priority**: Account management is an administrative surface with role-sensitive actions, so preserving action visibility and behavior is required before the migration can be considered complete.

**Independent Test**: Can be tested by opening account management under roles with different permissions and confirming that existing data, actions, disabled/hidden states, and results are unchanged while the table uses Material table elements.

**Acceptance Scenarios**:

1. **Given** an administrator can view account rows, **When** account management loads, **Then** the same columns, row content, and existing actions appear in a Material table.
2. **Given** a user role should or should not see an account action, **When** the account-management table renders, **Then** the migrated action visibility and enabled/disabled behavior match the existing role-sensitive behavior.
3. **Given** an existing account action is activated, **When** the action completes, fails, or navigates, **Then** the user-observable behavior remains unchanged.

---

### User Story 3 - Use Tables Across Supported Viewports and Keyboard Navigation (Priority: P3)

Users on supported desktop and small-laptop layouts need the migrated tables to remain readable and keyboard-usable, while smaller screens need an explicit responsive strategy that avoids page-wide horizontal overflow.

**Why this priority**: The issue explicitly requires keyboard usability, desktop and small-laptop readability, and a responsive strategy for small screens.

**Independent Test**: Can be tested by tabbing through each migrated table/action area and resizing to desktop, small-laptop, and narrow viewports while confirming focus visibility, readable content, and no page-wide horizontal overflow.

**Acceptance Scenarios**:

1. **Given** a migrated table with row or page actions, **When** the user navigates with the keyboard, **Then** focus reaches actionable controls in a logical order and the focused control remains visible.
2. **Given** a supported desktop or small-laptop viewport, **When** a migrated overview or account-management page renders, **Then** table content remains readable without clipped controls or overlapping text.
3. **Given** a narrow screen, **When** a migrated table renders, **Then** the component uses its explicit responsive wrapper strategy instead of causing page-wide horizontal overflow.

### Observable Behavior Detail *(include when visible UI or user-observable behavior changes)*

- **Visible states**: Existing loading, empty, and error states remain present for each migrated surface. Existing action states and destructive or role-sensitive confirmations remain unchanged where they already exist.
- **Interaction outcomes**: Existing filters, row actions, page actions, navigation, and role-sensitive visibility continue to work as before. Migrated actions use Material buttons or related Material controls.
- **Copy and localization**: Existing translated user-facing copy is preserved. The migration must not introduce hard-coded replacement text where translations already exist.
- **Responsive/mobile behavior**: Component-level wrappers and SCSS provide the responsive strategy. Supported desktop and small-laptop layouts remain readable; narrow layouts avoid page-wide horizontal overflow.

### Input/State Validation Matrix *(include when validation or state-sensitive behavior changes)*

| Input or State | Submit/Action Blocked? | API Call Made? | Visible Error or Conflict | Value Transformed or Preserved | Correction Behavior |
|----------------|------------------------|----------------|---------------------------|--------------------------------|---------------------|
| Overview or account data loading | N/A | Existing load behavior preserved | Existing loading state | Existing data handling preserved | Loaded, empty, or error state replaces loading |
| No records or no filter matches | N/A | Existing load/filter behavior preserved | Existing empty state | Filter value and row data behavior preserved | Changing filter or data availability updates state as before |
| Backend-rejected or failed load/action | Existing behavior preserved | Existing API behavior preserved | Existing error or failed-action state | Existing user input/data preserved according to current behavior | Retrying or correcting follows current behavior |
| User role lacks an action | Yes for unavailable action | No call for unavailable action | Existing hidden or disabled action state | Existing row/account values preserved | Role or permission change updates visibility as before |
| Valid row or page action | No | Existing call/navigation behavior preserved | Existing success, navigation, or state result | Existing values preserved or updated according to current behavior | N/A |

### Edge Cases

- A migrated table has records with long names, email addresses, date ranges, or action labels; content remains readable and controls do not overlap on supported desktop and small-laptop layouts.
- A table has no records, no filter matches, or an API failure; users can distinguish the state without losing the table context.
- A role-sensitive account action is unavailable; the migrated control preserves whether the current product hides or disables that action.
- A narrow viewport cannot fit all columns at once; the component-level responsive wrapper handles the overflow locally without widening the full page.
- Keyboard focus reaches filters and all available actions without becoming hidden by the responsive wrapper.

## Requirements *(mandatory)*

### Functional Requirements *(include when observable product or user behavior changes)*

- **FR-001**: The owner overview table MUST use Material table semantics while preserving the existing owner columns, row content, translations, filters, navigation, page actions, row actions, loading state, empty state, and error state.
- **FR-002**: The cat overview table MUST use Material table semantics while preserving the existing cat columns, row content, translations, filters, navigation, page actions, row actions, loading state, empty state, and error state.
- **FR-003**: The vet overview table MUST use Material table semantics while preserving the existing vet columns, row content, translations, filters, navigation, page actions, row actions, loading state, empty state, and error state.
- **FR-004**: The stay overview table MUST use Material table semantics while preserving the existing stay columns, row content, translations, filters, navigation, page actions, row actions, loading state, empty state, and error state.
- **FR-005**: The account-management table MUST use Material table semantics while preserving the existing account columns, row content, translations, page actions, row actions, role-sensitive visibility, loading state, empty state, and error state.
- **FR-006**: Row and page actions on migrated surfaces MUST use Material buttons or related Material controls without changing the action's existing user-observable behavior.
- **FR-007**: Migrated tables MUST remain keyboard-usable, including reachable filters and actions, logical focus order, and visible focus treatment inherited from the approved Material control patterns.
- **FR-008**: Migrated tables MUST remain readable on supported desktop and small-laptop layouts and MUST use an explicit component-level responsive strategy on smaller screens without page-wide horizontal overflow.
- **FR-009**: Superseded native-table and row-action styles for the migrated surfaces MUST be removed when they are no longer used by those surfaces.
- **FR-010**: The migration MUST NOT add pagination, sorting, configurable columns, backend search, backend pagination, new data fields, new filters, new product workflows, detail dialogs, or permanent-deletion behavior.

### Technical Requirements *(include for technical, architectural, migration, security, operational, refactoring, or enabling work)*

- **TR-001**: The implementation MUST stay within the existing Angular Material frontend stack approved by prior Material foundation and shell work, using `MatTable` for the five migrated native application tables.
- **TR-002**: Product-specific responsive layout and table wrapper styling MUST remain in the relevant component SCSS rather than becoming unrelated global style changes.
- **TR-003**: The implementation MUST preserve existing frontend routing, service calls, API contracts, authorization assumptions, persistence behavior, and backend behavior.
- **TR-004**: Validation MUST include `npm run format:check`, `npm run test:ci`, `npm run build`, and a keyboard/responsive smoke test covering the migrated table surfaces.

### Scope Boundaries

- **SB-001**: Feature MUST remain within the CatWorld cat-boarding domain.
- **SB-002**: Feature MUST distinguish implemented behavior from assumptions, exclusions, and unresolved product or architectural questions.
- **SB-003**: Feature MUST NOT introduce cross-species abstractions, multi-tenancy, generic platform claims, or permanent product limits without explicit requirements.

### Out of Scope

- Pagination, sorting, configurable columns, backend search, or backend pagination endpoints.
- New fields, filters, product behavior, data contracts, authorization rules, persistence behavior, or backend changes.
- Detail-dialog implementation or permanent-deletion implementation from other issues.
- Broad design-system refactors beyond replacing the specified native tables and their row/page controls.

### Open Questions

- None.

### Key Entities *(include if feature involves data)*

- **Owner records**: Existing owner overview data displayed in the owner table; no data shape changes are included.
- **Cat records**: Existing cat overview data displayed in the cat table; no data shape changes are included.
- **Vet records**: Existing vet overview data displayed in the vet table; no data shape changes are included.
- **Stay records**: Existing stay overview data displayed in the stay table; no date/status or booking invariant changes are included.
- **Account records**: Existing account-management data displayed with role-sensitive administrative actions; no authorization or account contract changes are included.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: All five in-scope native application tables render through `MatTable` while preserving their existing visible columns, row data, and states.
- **SC-002**: Existing filters, navigation, and row/page actions on the migrated surfaces pass the current automated frontend tests and targeted smoke checks without behavior changes.
- **SC-003**: Keyboard smoke testing confirms filters and available actions on each migrated surface can be reached and activated with visible focus.
- **SC-004**: Responsive smoke testing confirms supported desktop and small-laptop layouts are readable and narrow layouts do not produce page-wide horizontal overflow.
- **SC-005**: `npm run format:check`, `npm run test:ci`, and `npm run build` complete successfully from `frontend`.

## Assumptions

- The existing repository state after issues #177 and #178 contains the approved Angular Material foundation, shell, feedback, and action patterns needed for this migration.
- "Supported desktop and small-laptop layouts" means the same viewport range currently targeted by the frontend unless the existing source-of-truth documentation states a narrower or broader range.
