# Tasks: Material Controls Migration

**Input**: Design documents from `specs/006-material-controls-migration/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/material-controls.md](./contracts/material-controls.md), [quickstart.md](./quickstart.md)

**Tests**: Required by issue #182, the specification, semantic-equivalence review, validation matrix, and validation evidence plan. Use frontend visible-behavior tests plus required format, unit, build, calendar, dashboard, keyboard, and target-iPhone smoke evidence.

**Organization**: Tasks are grouped by the three user stories from [spec.md](./spec.md).

## Phase 1: Setup

**Purpose**: Establish the feature-specific remaining-control inventory before implementation.

- [X] T001 Run the initial in-scope interactive-control scan and update retained native/vendor-control notes in specs/006-material-controls-migration/contracts/material-controls.md

---

## Phase 2: User Story 1 - Use Dashboard Actions After Material Migration (Priority: P1)

**Goal**: Dashboard navigation and quick actions use Material patterns where appropriate while preserving routes, labels, focus, and responsive behavior.

**Verification**: Open the dashboard, confirm quick actions use Material controls, card navigation still reaches the same routes, translated labels remain unchanged, and controls stay keyboard/reflow usable.

### Implementation for User Story 1

- [X] T002 [US1] Import the dashboard Material modules used by the migrated dashboard controls in frontend/src/app/features/dashboard/pages/dashboard-page/dashboard-page.ts
- [X] T003 [US1] Migrate dashboard quick actions and card visual structure while preserving native anchor navigation where required in frontend/src/app/features/dashboard/pages/dashboard-page/dashboard-page.html
- [X] T004 [US1] Update responsive dashboard Material-control styling and retained card-link styling in frontend/src/app/features/dashboard/pages/dashboard-page/dashboard-page.scss
- [X] T005 [US1] Record the final dashboard card-link retention reason or Material equivalent outcome in specs/006-material-controls-migration/contracts/material-controls.md

### Evidence for User Story 1

- [X] T006 [P] [US1] Add dashboard DOM evidence for translated route links, Material quick-action controls, and retained card navigation in frontend/src/app/features/dashboard/pages/dashboard-page/dashboard-page.spec.ts
- [X] T007 [US1] Smoke-check dashboard keyboard reachability and target-iPhone wrapping, then record the result in specs/006-material-controls-migration/quickstart.md

**Checkpoint**: Dashboard migration is complete and independently verifiable.

---

## Phase 3: User Story 2 - Filter and Operate the Calendar Without Behavior Changes (Priority: P2)

**Goal**: Calendar header actions, status filters, display options, and stay search filters use Material controls while preserving FullCalendar and current filter/display behavior.

**Verification**: Open the calendar, use each header action, status filter, display option, and stay search filter, and confirm displayed stays, routes, labels, FullCalendar rendering, and local preferences remain unchanged.

### Implementation for User Story 2

- [X] T008 [US2] Import Material button, checkbox, radio, and related modules for calendar controls in frontend/src/app/features/calendar/pages/calendar-page/calendar-page.ts
- [X] T009 [US2] Migrate calendar header actions, status filters, filtered daily-label toggle, and display-mode options to Material controls in frontend/src/app/features/calendar/pages/calendar-page/calendar-page.html
- [X] T010 [US2] Update calendar control layout, Material control spacing, responsive wrapping, and FullCalendar wrapper coexistence in frontend/src/app/features/calendar/pages/calendar-page/calendar-page.scss
- [X] T011 [US2] Import Material form-field, input, autocomplete, and button modules for stay search filters in frontend/src/app/features/stays/components/stay-search-filters/stay-search-filters.ts
- [X] T012 [US2] Migrate stay search inputs, option lists, and clear buttons to Material controls while preserving selection and no-match behavior in frontend/src/app/features/stays/components/stay-search-filters/stay-search-filters.html
- [X] T013 [US2] Update stay search filter Material layout, autocomplete panel spacing, clear actions, and target-iPhone wrapping in frontend/src/app/features/stays/components/stay-search-filters/stay-search-filters.scss
- [X] T014 [US2] Record FullCalendar vendor-owned control retention and any calendar-specific native retention outcome in specs/006-material-controls-migration/contracts/material-controls.md

### Evidence for User Story 2

- [X] T015 [P] [US2] Add calendar DOM/component evidence for Material header actions, status filter toggles, display-mode radio behavior, filtered daily-label behavior, and unchanged FullCalendar presence in frontend/src/app/features/calendar/pages/calendar-page/calendar-page.spec.ts
- [X] T016 [P] [US2] Add stay search filter DOM evidence for typing, option selection, no-match messages, clearing, and emitted filters in frontend/src/app/features/stays/components/stay-search-filters/stay-search-filters.spec.ts
- [X] T017 [US2] Smoke-check calendar filtering, display options, FullCalendar rendering, keyboard reachability, and target-iPhone layout, then record the result in specs/006-material-controls-migration/quickstart.md

**Checkpoint**: Calendar and stay search filter migration is complete and independently verifiable.

---

## Phase 4: User Story 3 - Finish Remaining Control Migration With Explicit Exceptions (Priority: P3)

**Goal**: Remaining in-scope controls either use Material equivalents or have explicit retained-control reasons, with superseded styles narrowed safely.

**Verification**: Run a final interactive-control scan, confirm forms/shell/tables/out-of-scope surfaces are not changed unnecessarily, and confirm retained native/vendor controls are documented.

### Implementation for User Story 3

- [X] T018 [US3] Run the final interactive-control scan and update all intentionally retained native/vendor-control reasons in specs/006-material-controls-migration/contracts/material-controls.md
- [X] T019 [US3] Remove or narrow superseded native dashboard/calendar control styles while preserving form, shell, table, FullCalendar, and retained-control support in frontend/src/styles.scss
- [X] T020 [US3] Remove or narrow superseded local dashboard/calendar/search-filter styles after Material migration in frontend/src/app/features/dashboard/pages/dashboard-page/dashboard-page.scss
- [X] T021 [US3] Remove or narrow superseded local calendar/search-filter styles after Material migration in frontend/src/app/features/calendar/pages/calendar-page/calendar-page.scss
- [X] T022 [US3] Remove or narrow superseded local stay search filter styles after Material migration in frontend/src/app/features/stays/components/stay-search-filters/stay-search-filters.scss

### Evidence for User Story 3

- [X] T023 [US3] Review the changed files against specs/006-material-controls-migration/plan.md and confirm no backend, API, persistence, authorization, route-guard, new filter/display mode, dark-mode, or FullCalendar replacement work was introduced
- [X] T024 [US3] Perform the replacement-boundary review for old native selectors and retained controls, then record the result in specs/006-material-controls-migration/quickstart.md

**Checkpoint**: Remaining-control inventory, retention notes, and style cleanup are complete.

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Final validation, freshness, and workflow cleanup required by issue #182 and the CatWorld workflow.

- [X] T025 Preserve route paths and guards while lazy-loading dashboard and calendar page components to keep the Material migration within production build budgets in frontend/src/app/app.routes.ts
- [X] T026 Run `npm run format:check` from frontend and record the passed/failed result in specs/006-material-controls-migration/quickstart.md
- [X] T027 Run `npm run test:ci` from frontend and record the passed/failed result in specs/006-material-controls-migration/quickstart.md
- [X] T028 Run `npm run build` from frontend and record the passed/failed result in specs/006-material-controls-migration/quickstart.md
- [X] T029 Run final calendar, dashboard, keyboard, and target-iPhone smoke checks and record freshness status in specs/006-material-controls-migration/quickstart.md
- [X] T030 Rerun or explicitly mark stale/not-revalidated any affected validation after late changes in specs/006-material-controls-migration/quickstart.md
- [X] T031 Restore the transient Spec Kit active-plan pointer if AGENTS.md changed only between the SPECKIT START and SPECKIT END markers in AGENTS.md
- [X] T032 Review final git status and diff summary against the source map in specs/006-material-controls-migration/plan.md

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 Setup**: Must complete before implementation so retained controls are tracked from the start.
- **US1 Dashboard (Phase 2)**: Depends on Phase 1 only.
- **US2 Calendar/Search Filters (Phase 3)**: Depends on Phase 1 only and may proceed independently of US1 after setup.
- **US3 Remaining Controls (Phase 4)**: Depends on US1 and US2 because it performs the final scan and style cleanup.
- **Polish (Phase 5)**: Depends on all implementation and evidence phases.

### User Story Dependencies

- **US1 (P1)**: No story dependency after setup.
- **US2 (P2)**: No story dependency after setup.
- **US3 (P3)**: Depends on US1 and US2 implementation and evidence completion.

### Parallel Opportunities

- T006 and T015/T016 can be prepared in parallel after their respective implementation files are known.
- US1 and US2 implementation can proceed in parallel after T001 because they touch different feature directories.
- T015 and T016 can run in parallel because they cover different test files.
- Final command validations T025-T027 must run after implementation, but their underlying command execution is independent once all late changes are complete.

---

## Parallel Example: User Story 2

```bash
Task: "Add calendar DOM/component evidence in frontend/src/app/features/calendar/pages/calendar-page/calendar-page.spec.ts"
Task: "Add stay search filter DOM evidence in frontend/src/app/features/stays/components/stay-search-filters/stay-search-filters.spec.ts"
```

---

## Implementation Strategy

### First Verifiable Increment

1. Complete T001.
2. Complete US1 dashboard implementation and evidence tasks.
3. Validate dashboard routes, Material quick actions, retained card-link semantics, keyboard focus, and target-iPhone wrapping.

### Incremental Delivery

1. Add dashboard migration and validate US1.
2. Add calendar and stay search filter migration and validate US2.
3. Complete final remaining-control inventory and style cleanup for US3.
4. Run all required automated validation and smoke checks after the latest relevant changes.

### Notes

- Do not commit unless the user explicitly asks for a commit.
- Keep backend, persistence, authorization, route guards, new filters, dark mode, FullCalendar replacement, forms, shell, and operational table behavior out of scope.
- Validation results are complete only when fresh after the latest relevant changes.
