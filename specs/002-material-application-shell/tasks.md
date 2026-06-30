# Tasks: Material Application Shell

**Input**: Design documents from `specs/002-material-application-shell/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/material-shell-and-states.md, quickstart.md

**Tests**: No separate TDD-first test phase is requested. Affected existing frontend tests must be updated where behavior or rendered structure changes, and the required validation commands are captured in the final phase.

**Organization**: Tasks are grouped by user story so the shell migration, shared-state migration, and workflow-preservation review can be implemented and validated incrementally.

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no dependency on incomplete tasks)
- **[Story]**: User story label from `spec.md` (`US1`, `US2`, `US3`)
- Include exact file paths in descriptions

## Phase 1: Setup

**Purpose**: Confirm the #177 foundation and current shell/state entry points before changing UI code.

- [X] T001 Confirm Angular Material/CDK foundation is present in `frontend/package.json`, `frontend/package-lock.json`, `frontend/src/styles.scss`, `docs/ARCHITECTURE.md`, and `frontend/README.md`
- [X] T002 Inspect current route, guard, and shell ownership in `frontend/src/app/app.routes.ts`, `frontend/src/app/app.html`, `frontend/src/app/app.scss`, and `frontend/src/app/app.ts`

---

## Phase 2: Foundational

**Purpose**: Establish shared implementation boundaries that block shared-state story work.

- [X] T003 Define the shared loading/empty/error presentation API in `frontend/src/app/shared/ui-state/ui-state.ts`
- [X] T004 Add the shared loading/empty/error template in `frontend/src/app/shared/ui-state/ui-state.html`
- [X] T005 Add Material-themed shared state styles in `frontend/src/app/shared/ui-state/ui-state.scss`
- [X] T006 Add focused shared state rendering coverage in `frontend/src/app/shared/ui-state/ui-state.spec.ts`

**Checkpoint**: Shared state component files exist but are not yet required by routed pages until US2 migration tasks.

---

## Phase 3: User Story 1 - Navigate From A Responsive Material Shell (Priority: P1)

**Goal**: An authenticated user can navigate existing administration areas from a responsive Angular Material shell with existing routes and workflows preserved.

**Independent Test**: Render `App` as ADMIN and STAFF, verify shell navigation and accounts visibility, and review desktop plus target iPhone responsive shell behavior.

- [X] T007 [US1] Import required Angular Material shell modules in `frontend/src/app/app.ts` and provide Material animations in `frontend/src/app/app.config.ts`
- [X] T008 [US1] Add needed shell accessibility and menu labels through `frontend/src/app/core/i18n/translations/app-shell.translations.ts`
- [X] T009 [US1] Replace handcrafted shell markup with Material toolbar/navigation/menu/button/icon/surface primitives in `frontend/src/app/app.html`
- [X] T010 [US1] Replace handcrafted shell layout styles with responsive Material shell styles in `frontend/src/app/app.scss`
- [X] T011 [US1] Add root shell interaction state needed for responsive navigation in `frontend/src/app/app.ts`
- [X] T012 [US1] Update root shell unit coverage for ADMIN/STAFF navigation and Material shell rendering in `frontend/src/app/app.spec.ts`

**Checkpoint**: Shell navigation works for desktop and target iPhone width without route, guard, API, or workflow changes.

---

## Phase 4: User Story 2 - Recognize Shared Loading And Feedback States (Priority: P2)

**Goal**: Shared loading, empty, and error states use accessible Material-compatible presentation and existing i18n copy.

**Independent Test**: Trigger representative loading, empty, and error states on migrated shared surfaces and verify accessible Material-themed output with i18n-backed text.

- [X] T013 [P] [US2] Use the shared UI state component for owners overview loading/empty/error states in `frontend/src/app/features/owners/pages/owners-overview-page/owners-overview-page.html`
- [X] T014 [P] [US2] Import the shared UI state component in `frontend/src/app/features/owners/pages/owners-overview-page/owners-overview-page.ts`
- [X] T015 [P] [US2] Remove owners overview page-local error state styles made redundant by shared state presentation in `frontend/src/app/features/owners/pages/owners-overview-page/owners-overview-page.scss`
- [X] T016 [P] [US2] Use the shared UI state component for cats overview loading/empty/error states in `frontend/src/app/features/cats/pages/cats-overview-page/cats-overview-page.html`
- [X] T017 [P] [US2] Import the shared UI state component in `frontend/src/app/features/cats/pages/cats-overview-page/cats-overview-page.ts`
- [X] T018 [P] [US2] Remove cats overview page-local error state styles made redundant by shared state presentation in `frontend/src/app/features/cats/pages/cats-overview-page/cats-overview-page.scss`
- [X] T019 [P] [US2] Use the shared UI state component for vets overview loading/empty/error states in `frontend/src/app/features/vets/pages/vets-overview-page/vets-overview-page.html`
- [X] T020 [P] [US2] Import the shared UI state component in `frontend/src/app/features/vets/pages/vets-overview-page/vets-overview-page.ts`
- [X] T021 [P] [US2] Remove vets overview page-local error state styles made redundant by shared state presentation in `frontend/src/app/features/vets/pages/vets-overview-page/vets-overview-page.scss`
- [X] T022 [P] [US2] Use the shared UI state component for stays overview loading/empty/error states in `frontend/src/app/features/stays/pages/stays-overview-page/stays-overview-page.html`
- [X] T023 [P] [US2] Import the shared UI state component in `frontend/src/app/features/stays/pages/stays-overview-page/stays-overview-page.ts`
- [X] T024 [P] [US2] Remove stays overview page-local error state styles made redundant by shared state presentation in `frontend/src/app/features/stays/pages/stays-overview-page/stays-overview-page.scss`
- [X] T025 [P] [US2] Use the shared UI state component for calendar loading/empty/error states without replacing FullCalendar in `frontend/src/app/features/calendar/pages/calendar-page/calendar-page.html`
- [X] T026 [P] [US2] Import the shared UI state component in `frontend/src/app/features/calendar/pages/calendar-page/calendar-page.ts`
- [X] T027 [P] [US2] Remove calendar page-local error state styles made redundant by shared state presentation in `frontend/src/app/features/calendar/pages/calendar-page/calendar-page.scss`

**Checkpoint**: Migrated shared states render through one Material-compatible pattern while page data loading, filtering, and error decisions remain page-owned.

---

## Phase 5: User Story 3 - Continue Existing Domain Workflows (Priority: P3)

**Goal**: Existing stay, customer, cat, vet, account, and calendar workflows remain unchanged after the shell and shared-state migration.

**Independent Test**: Review route/API/domain boundaries and run the existing frontend validation commands.

- [X] T028 [US3] Review `frontend/src/app/app.routes.ts` to confirm no route, guard, or navigation information architecture changes were introduced
- [X] T029 [US3] Review `frontend/src/app/features/owners/pages/owners-overview-page/owners-overview-page.ts` to confirm API calls, filtering, and workflow behavior are unchanged
- [X] T030 [US3] Review `frontend/src/app/features/cats/pages/cats-overview-page/cats-overview-page.ts` to confirm API calls, filtering, and workflow behavior are unchanged
- [X] T031 [US3] Review `frontend/src/app/features/vets/pages/vets-overview-page/vets-overview-page.ts` to confirm API calls, filtering, and workflow behavior are unchanged
- [X] T032 [US3] Review `frontend/src/app/features/stays/pages/stays-overview-page/stays-overview-page.ts` to confirm API calls, filtering, and workflow behavior are unchanged
- [X] T033 [US3] Review `frontend/src/app/features/calendar/pages/calendar-page/calendar-page.html` and `frontend/src/app/features/calendar/pages/calendar-page/calendar-page.scss` to confirm FullCalendar remains in place
- [X] T034 [US3] Review `frontend/src/app/shared/ui-state/ui-state.ts`, `frontend/src/app/app.html`, `frontend/src/app/app.scss`, `frontend/src/app/app.ts`, `frontend/src/app/app.config.ts`, and `frontend/package.json` to confirm no duplicate design system, broad Material module, or parallel shell component library was introduced

**Checkpoint**: Implementation remains presentation-focused and inside issue #178 scope.

---

## Phase 6: Documentation & Polish

**Purpose**: Update source-of-truth documentation and run required validation.

- [X] T035 [P] Document the migrated Material shell and shared-state conventions in `docs/ARCHITECTURE.md`
- [X] T036 [P] Update frontend-local shell/shared-state guidance in `frontend/README.md`
- [X] T037 Run frontend format validation with `npm run format:check` from `frontend/`
- [X] T038 Run frontend CI tests with `npm run test:ci` from `frontend/`
- [X] T039 Run production frontend build with `npm run build` from `frontend/`
- [X] T040 Validate completed implementation against `specs/002-material-application-shell/quickstart.md`
- [X] T041 Run final constitution compliance review against `specs/002-material-application-shell/plan.md` and `.specify/memory/constitution.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Must complete before implementation.
- **Foundational (Phase 2)**: Must complete before US2 page migrations and can complete before or alongside US1.
- **US1 Shell (Phase 3)**: Highest priority and can be validated independently after Phase 1.
- **US2 Shared States (Phase 4)**: Depends on Phase 2 shared state component.
- **US3 Workflow Preservation (Phase 5)**: Depends on US1 and US2 implementation changes.
- **Documentation & Polish (Phase 6)**: Depends on implementation and scope review.

### User Story Dependencies

- **US1 (P1)**: Depends on setup only.
- **US2 (P2)**: Depends on the shared UI state component from Phase 2.
- **US3 (P3)**: Depends on US1 and US2 so the review covers all changed frontend behavior.

### Parallel Opportunities

- T035 and T036 can run in parallel after implementation because they edit separate documentation files.
- T013-T027 can be batched by feature page once T003-T006 are complete, with care to keep each page's template, TypeScript import, and SCSS cleanup together.
- T028-T034 can be reviewed in parallel after implementation because they inspect different scope boundaries.

---

## Parallel Example: User Story 2

```bash
Task: "Use the shared UI state component for owners overview loading/empty/error states in frontend/src/app/features/owners/pages/owners-overview-page/owners-overview-page.html"
Task: "Use the shared UI state component for cats overview loading/empty/error states in frontend/src/app/features/cats/pages/cats-overview-page/cats-overview-page.html"
Task: "Use the shared UI state component for vets overview loading/empty/error states in frontend/src/app/features/vets/pages/vets-overview-page/vets-overview-page.html"
```

---

## Implementation Strategy

### MVP First

1. Complete setup and the responsive Material shell migration (US1).
2. Verify ADMIN and STAFF navigation still render correctly and that the shell remains responsive.

### Incremental Delivery

1. Reuse the #177 Material foundation.
2. Migrate the root shell to Material primitives.
3. Add the shared state component and migrate representative shared loading/empty/error states.
4. Review boundaries to preserve existing routes, guards, APIs, workflows, FullCalendar, and out-of-scope form/table behavior.
5. Update documentation and run validation.

### Completion Criteria

The issue is complete when all tasks are checked, the required validation commands pass, quickstart review is satisfied, and no blocker remains under the constitution or issue boundaries.
