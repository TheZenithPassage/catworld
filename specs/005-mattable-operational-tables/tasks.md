# Tasks: MatTable Operational Tables

**Input**: Design documents from `specs/005-mattable-operational-tables/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/material-operational-tables.md](./contracts/material-operational-tables.md), [quickstart.md](./quickstart.md)

**Tests**: Required by the specification, validation evidence plan, semantic-equivalence review, and validation matrix for visible table behavior, role-sensitive account actions, stay cancellation behavior, keyboard usability, and responsive overflow.

**Organization**: Tasks are grouped by user story from `spec.md`.

## Phase 1: Foundational Table Boundaries

**Purpose**: Establish the shared replacement boundary before individual table migrations.

- [x] T001 Review existing native table selectors and action-control selectors in `frontend/src/styles.scss` and identify only the selectors superseded by the five migrated table surfaces
- [x] T002 Confirm direct Material import patterns in `frontend/src/app/features/owners/pages/owner-create-page/owner-create-page.ts`, `frontend/src/app/features/vets/pages/vet-create-page/vet-create-page.ts`, and `frontend/src/app/features/stays/pages/stay-create-page/stay-create-page.ts` before updating table components

**Checkpoint**: Replacement boundary and import pattern are clear before surface-specific implementation begins.

---

## Phase 2: User Story 1 - Review Operational Overviews in Material Tables (Priority: P1)

**Goal**: Owner, cat, vet, and stay operational overviews render through `MatTable` while preserving existing data, filters, navigation, selected-row behavior, loading/empty/error states, and stay cancellation behavior.

**Verification**: Open or test each overview with records, filtered-empty state, and error/loading states; confirm headers, row content, filters, actions, selected-row IDs, and navigation match the pre-migration behavior with Material table/control markup.

### Evidence for User Story 1

- [x] T003 [P] [US1] Add owner overview visible-behavior tests for Material table headers, row content, search/clear, selected row ID, edit navigation, and state messages in `frontend/src/app/features/owners/pages/owners-overview-page/owners-overview-page.spec.ts`
- [x] T004 [P] [US1] Add cat overview visible-behavior tests for Material table headers, row content, search/clear, owner query-param navigation, edit navigation, and state messages in `frontend/src/app/features/cats/pages/cats-overview-page/cats-overview-page.spec.ts`
- [x] T005 [P] [US1] Add vet overview visible-behavior tests for Material table headers, row content, search/clear, edit navigation, and state messages in `frontend/src/app/features/vets/pages/vets-overview-page/vets-overview-page.spec.ts`
- [x] T006 [P] [US1] Add stay overview visible-behavior tests for Material table headers, row content, status/search filtering, selected row ID, edit/cancel/unavailable actions, cancellation pending/error behavior, and state messages in `frontend/src/app/features/stays/pages/stays-overview-page/stays-overview-page.spec.ts`

### Implementation for User Story 1

- [x] T007 [US1] Add owner overview Material table/control imports and displayed column ordering in `frontend/src/app/features/owners/pages/owners-overview-page/owners-overview-page.ts`
- [x] T008 [US1] Replace the owner overview native table, search controls, create action, clear action, and edit action with Material table/control markup in `frontend/src/app/features/owners/pages/owners-overview-page/owners-overview-page.html`
- [x] T009 [US1] Add owner overview local Material table wrapper, selected-row, search, and responsive styles in `frontend/src/app/features/owners/pages/owners-overview-page/owners-overview-page.scss`
- [x] T010 [US1] Add cat overview Material table/control imports and displayed column ordering in `frontend/src/app/features/cats/pages/cats-overview-page/cats-overview-page.ts`
- [x] T011 [US1] Replace the cat overview native table, search controls, create action, clear action, owner query-param link, and edit action with Material table/control markup in `frontend/src/app/features/cats/pages/cats-overview-page/cats-overview-page.html`
- [x] T012 [US1] Add cat overview local Material table wrapper, column width, owner link, search, and responsive styles in `frontend/src/app/features/cats/pages/cats-overview-page/cats-overview-page.scss`
- [x] T013 [US1] Add vet overview Material table/control imports and displayed column ordering in `frontend/src/app/features/vets/pages/vets-overview-page/vets-overview-page.ts`
- [x] T014 [US1] Replace the vet overview native table, search controls, create action, clear action, and edit action with Material table/control markup in `frontend/src/app/features/vets/pages/vets-overview-page/vets-overview-page.html`
- [x] T015 [US1] Add vet overview local Material table wrapper, search, and responsive styles in `frontend/src/app/features/vets/pages/vets-overview-page/vets-overview-page.scss`
- [x] T016 [US1] Add stay overview Material table/control imports and displayed column ordering in `frontend/src/app/features/stays/pages/stays-overview-page/stays-overview-page.ts`
- [x] T017 [US1] Replace the stay overview native table, create action, edit/cancel row actions, and unavailable action presentation with Material table/control markup while preserving status filters and stay search filters in `frontend/src/app/features/stays/pages/stays-overview-page/stays-overview-page.html`
- [x] T018 [US1] Add stay overview local Material table wrapper, selected-row, action, notes, cat-summary, and responsive styles in `frontend/src/app/features/stays/pages/stays-overview-page/stays-overview-page.scss`

**Checkpoint**: Operational overview tables are Material tables and pass their visible-behavior tests.

---

## Phase 3: User Story 2 - Manage Accounts Through the Migrated Table (Priority: P2)

**Goal**: Account management keeps the same account data and role-sensitive actions while using a Material table and Material row/page controls.

**Verification**: Open or test account management with admin and staff rows; confirm columns, current-account marker, role selection/save, enable/disable, pending disabled states, action errors, not-found refresh, and current-admin logout redirects remain unchanged.

### Evidence for User Story 2

- [x] T019 [US2] Update account-management tests to assert Material table headers/content, current-user marker, role select/save behavior, enable/disable behavior, pending disabled states, loading/empty/load-error states, action errors, not-found refresh, and self-demotion/self-disable logout behavior in `frontend/src/app/features/accounts/pages/account-management-page/account-management-page.spec.ts`

### Implementation for User Story 2

- [x] T020 [US2] Add account-management Material table/control imports and displayed column ordering in `frontend/src/app/features/accounts/pages/account-management-page/account-management-page.ts`
- [x] T021 [US2] Replace the account-management native table, role row control, save role action, enable/disable action, and applicable page action buttons with Material table/control markup in `frontend/src/app/features/accounts/pages/account-management-page/account-management-page.html`
- [x] T022 [US2] Replace account table native styles with local Material table wrapper, role-action, marker, and responsive styles in `frontend/src/app/features/accounts/pages/account-management-page/account-management-page.scss`

**Checkpoint**: Account-management table is a Material table and passes role/action behavior tests.

---

## Phase 4: User Story 3 - Use Tables Across Supported Viewports and Keyboard Navigation (Priority: P3)

**Goal**: Migrated tables remain keyboard-usable and readable on supported desktop and small-laptop layouts, while narrow screens use local table overflow without page-wide horizontal overflow.

**Verification**: Perform keyboard and responsive smoke checks after final table SCSS changes and confirm focus visibility, logical tab order, readable rows/actions, and local overflow behavior across all five migrated surfaces.

### Evidence for User Story 3

- [x] T023 [US3] Perform keyboard smoke testing for filters, links, selects, and buttons on owners, cats, vets, stays, and account-management surfaces; record results in `specs/005-mattable-operational-tables/quickstart.md`
- [x] T024 [US3] Perform responsive smoke testing for desktop, small-laptop, and narrow viewport table wrappers on owners, cats, vets, stays, and account-management surfaces; record results in `specs/005-mattable-operational-tables/quickstart.md`

### Implementation for User Story 3

- [x] T025 [US3] Remove or narrow superseded global native overview table and native row-action styles without affecting remaining native controls or FullCalendar in `frontend/src/styles.scss`
- [x] T026 [US3] Adjust final per-component responsive table wrapper styles for any smoke-test issues in `frontend/src/app/features/owners/pages/owners-overview-page/owners-overview-page.scss`
- [x] T027 [US3] Adjust final per-component responsive table wrapper styles for any smoke-test issues in `frontend/src/app/features/cats/pages/cats-overview-page/cats-overview-page.scss`
- [x] T028 [US3] Adjust final per-component responsive table wrapper styles for any smoke-test issues in `frontend/src/app/features/vets/pages/vets-overview-page/vets-overview-page.scss`
- [x] T029 [US3] Adjust final per-component responsive table wrapper styles for any smoke-test issues in `frontend/src/app/features/stays/pages/stays-overview-page/stays-overview-page.scss`
- [x] T030 [US3] Adjust final per-component responsive table wrapper styles for any smoke-test issues in `frontend/src/app/features/accounts/pages/account-management-page/account-management-page.scss`

**Checkpoint**: Keyboard and responsive smoke checks are fresh after final SCSS changes.

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Final validation, scope review, and source-of-truth cleanup.

- [x] T031 Preserve existing route paths and guards while using the existing `loadComponent` route pattern for migrated table surfaces if required by production build budgets in `frontend/src/app/app.routes.ts`
- [x] T032 Run `cd frontend && npm run format:check` after all relevant code and artifact changes
- [x] T033 Run `cd frontend && npm run test:ci` after all relevant code and artifact changes
- [x] T034 Run `cd frontend && npm run build` after all relevant code and artifact changes
- [x] T035 Review changed files against `specs/005-mattable-operational-tables/plan.md` source map and confirm no backend, persistence, authorization, route-guard, pagination, sorting, configurable-column, detail-dialog, or deletion work was introduced
- [x] T036 Perform replacement-boundary review for migrated native table/selectors and row-action styles in `frontend/src/styles.scss`, `frontend/src/app/features/owners/pages/owners-overview-page/owners-overview-page.scss`, `frontend/src/app/features/cats/pages/cats-overview-page/cats-overview-page.scss`, `frontend/src/app/features/vets/pages/vets-overview-page/vets-overview-page.scss`, `frontend/src/app/features/stays/pages/stays-overview-page/stays-overview-page.scss`, and `frontend/src/app/features/accounts/pages/account-management-page/account-management-page.scss`
- [x] T037 Update `frontend/README.md` only if implemented Material table conventions require source-of-truth documentation
- [x] T038 Update `docs/ARCHITECTURE.md` only if implemented frontend table conventions require source-of-truth documentation
- [x] T039 Rerun any validation or smoke check affected by late changes, or explicitly mark it stale/not revalidated in the final report

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1**: Must complete before table migration work.
- **Phase 2 (US1)**: Can start after Phase 1. It is the first verifiable increment and covers the four operational overview tables.
- **Phase 3 (US2)**: Can start after Phase 1 and may run independently of US1 except for shared global-style cleanup in Phase 4.
- **Phase 4 (US3)**: Depends on US1 and US2 implementation because smoke checks and final responsive adjustments need all five migrated surfaces.
- **Phase 5**: Depends on all implementation and smoke-check work.

### User Story Dependencies

- **US1 (P1)**: Depends on Phase 1 only.
- **US2 (P2)**: Depends on Phase 1 only.
- **US3 (P3)**: Depends on US1 and US2 because keyboard/responsive smoke spans all migrated tables.

### Parallel Opportunities

- T003, T004, T005, and T006 can be created in parallel because they cover separate specs.
- Owner, cat, vet, and stay component migrations can be worked in parallel after their tests are defined, as long as shared global style cleanup waits until Phase 4.
- Account-management work can run in parallel with operational overview work after Phase 1.

---

## Parallel Example: User Story 1

```text
Task: "Add owner overview visible-behavior tests in frontend/src/app/features/owners/pages/owners-overview-page/owners-overview-page.spec.ts"
Task: "Add cat overview visible-behavior tests in frontend/src/app/features/cats/pages/cats-overview-page/cats-overview-page.spec.ts"
Task: "Add vet overview visible-behavior tests in frontend/src/app/features/vets/pages/vets-overview-page/vets-overview-page.spec.ts"
Task: "Add stay overview visible-behavior tests in frontend/src/app/features/stays/pages/stays-overview-page/stays-overview-page.spec.ts"
```

---

## Implementation Strategy

### First Verifiable Increment

1. Complete Phase 1 replacement-boundary review.
2. Complete Phase 2 owner/cat/vet/stay table migrations and visible-behavior tests.
3. Run the affected frontend tests before moving to account management.

### Incremental Delivery

1. Operational overview Material tables (US1)
2. Account-management Material table and actions (US2)
3. Keyboard/responsive validation, style cleanup, and required frontend gates (US3 + polish)

### Notes

- Each task uses the approved Angular Material approach from `plan.md`.
- Do not add pagination, sorting, configurable columns, backend endpoints, new fields, new filters, detail dialogs, permanent deletion, or backend changes.
- Do not commit unless the user explicitly asks for a commit.
