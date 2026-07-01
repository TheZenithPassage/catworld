# Tasks: Material Form Migration

**Input**: Design documents from `specs/003-material-form-migration/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/material-forms.md, quickstart.md

**Tests**: Frontend behavior coverage is required because the migration changes form templates, disabled states, validation presentation, and backend-error presentation while preserving payload and navigation behavior.

**Organization**: Tasks are grouped by user story so login, owner forms, and vet forms can be implemented and verified incrementally.

## Format: `[ID] [P?] [Trace] Description`

- **[P]**: Can run in parallel (different files, no dependency on incomplete tasks)
- **[Trace]**: User story label from `spec.md` (`US1`, `US2`, `US3`)
- Include exact file paths in descriptions

## Path Conventions

- **Login form**: `frontend/src/app/features/auth/pages/login-page/`
- **Owner forms**: `frontend/src/app/features/owners/pages/owner-create-page/`, `frontend/src/app/features/owners/pages/owner-edit-page/`
- **Vet forms**: `frontend/src/app/features/vets/pages/vet-create-page/`, `frontend/src/app/features/vets/pages/vet-edit-page/`
- **Shared state**: `frontend/src/app/shared/ui-state/`
- **Global styles**: `frontend/src/styles.scss`
- **Docs**: `docs/ARCHITECTURE.md`, `frontend/README.md`

## Phase 1: User Story 1 - Sign In With A Material Login Form (Priority: P1)

**Goal**: A user can sign in through the existing login workflow with Material form controls and validation presentation while preserving request payloads, backend errors, loading state, disabled behavior, translations, and navigation.

**Verification**: Login tests prove blank username/password blocking, successful login payload/navigation, unauthorized backend-error behavior, and Material form rendering. Manual review confirms login remains usable at 320, 375, and 390 CSS pixels.

### Tests for User Story 1

- [X] T001 [US1] Update login behavior and rendering coverage in `frontend/src/app/features/auth/pages/login-page/login-page.spec.ts`

### Implementation for User Story 1

- [X] T002 [US1] Import directly used Angular Material form, input, button, and shared state dependencies in `frontend/src/app/features/auth/pages/login-page/login-page.ts`
- [X] T003 [US1] Replace native login labels, inputs, button, and backend-error markup with Material presentation in `frontend/src/app/features/auth/pages/login-page/login-page.html`
- [X] T004 [US1] Update login Material form layout and mobile responsiveness in `frontend/src/app/features/auth/pages/login-page/login-page.scss`

**Checkpoint**: Login form can be validated independently with existing credential behavior preserved and Material form controls rendered.

---

## Phase 2: User Story 2 - Maintain Owners With Material Forms (Priority: P2)

**Goal**: Authenticated users can create and edit owner records through Material form controls and validation presentation while preserving owner payloads, validation, backend errors, loading, disabled behavior, translations, and navigation.

**Verification**: Owner create/edit tests prove required-field blocking, payload shaping, success navigation, load behavior, update behavior, backend-error behavior, and Material form rendering. Manual review confirms owner forms remain usable at 320, 375, and 390 CSS pixels.

### Tests for User Story 2

- [X] T005 [P] [US2] Add owner create behavior and rendering coverage in `frontend/src/app/features/owners/pages/owner-create-page/owner-create-page.spec.ts`
- [X] T006 [P] [US2] Add owner edit behavior and rendering coverage in `frontend/src/app/features/owners/pages/owner-edit-page/owner-edit-page.spec.ts`

### Implementation for User Story 2

- [X] T007 [P] [US2] Import directly used Angular Material form, input, button, and shared state dependencies in `frontend/src/app/features/owners/pages/owner-create-page/owner-create-page.ts`
- [X] T008 [P] [US2] Replace native owner create labels, inputs, button, and backend-error markup with Material presentation in `frontend/src/app/features/owners/pages/owner-create-page/owner-create-page.html`
- [X] T009 [P] [US2] Update owner create Material form layout and mobile responsiveness in `frontend/src/app/features/owners/pages/owner-create-page/owner-create-page.scss`
- [X] T010 [P] [US2] Import directly used Angular Material form, input, button, router link, and shared state dependencies in `frontend/src/app/features/owners/pages/owner-edit-page/owner-edit-page.ts`
- [X] T011 [P] [US2] Replace native owner edit labels, inputs, loading, button, link, and backend-error markup with Material presentation in `frontend/src/app/features/owners/pages/owner-edit-page/owner-edit-page.html`
- [X] T012 [P] [US2] Update owner edit Material form layout and mobile responsiveness in `frontend/src/app/features/owners/pages/owner-edit-page/owner-edit-page.scss`

**Checkpoint**: Owner create and edit forms can be validated independently with existing payload, load, save, and navigation behavior preserved.

---

## Phase 3: User Story 3 - Maintain Vets With Material Forms (Priority: P3)

**Goal**: Authenticated users can create and edit vet records through Material form controls and validation presentation while preserving vet payloads, validation, backend errors, loading, disabled behavior, translations, and navigation.

**Verification**: Vet create/edit tests prove required-field blocking, payload shaping, success navigation, load behavior, update behavior, backend-error behavior, and Material form rendering. Manual review confirms vet forms remain usable at 320, 375, and 390 CSS pixels.

### Tests for User Story 3

- [X] T013 [P] [US3] Add vet create behavior and rendering coverage in `frontend/src/app/features/vets/pages/vet-create-page/vet-create-page.spec.ts`
- [X] T014 [P] [US3] Add vet edit behavior and rendering coverage in `frontend/src/app/features/vets/pages/vet-edit-page/vet-edit-page.spec.ts`

### Implementation for User Story 3

- [X] T015 [P] [US3] Import directly used Angular Material form, input, button, and shared state dependencies in `frontend/src/app/features/vets/pages/vet-create-page/vet-create-page.ts`
- [X] T016 [P] [US3] Replace native vet create labels, inputs, button, and backend-error markup with Material presentation in `frontend/src/app/features/vets/pages/vet-create-page/vet-create-page.html`
- [X] T017 [P] [US3] Update vet create Material form layout and mobile responsiveness in `frontend/src/app/features/vets/pages/vet-create-page/vet-create-page.scss`
- [X] T018 [P] [US3] Import directly used Angular Material form, input, button, router link, and shared state dependencies in `frontend/src/app/features/vets/pages/vet-edit-page/vet-edit-page.ts`
- [X] T019 [P] [US3] Replace native vet edit labels, inputs, loading, button, link, and backend-error markup with Material presentation in `frontend/src/app/features/vets/pages/vet-edit-page/vet-edit-page.html`
- [X] T020 [P] [US3] Update vet edit Material form layout and mobile responsiveness in `frontend/src/app/features/vets/pages/vet-edit-page/vet-edit-page.scss`

**Checkpoint**: Vet create and edit forms can be validated independently with existing payload, load, save, and navigation behavior preserved.

---

## Phase 4: Polish & Cross-Cutting Concerns

**Purpose**: Remove superseded migrated-form native styling, update source-of-truth documentation, and run required validation.

- [X] T021 Narrow superseded native form/control styling for migrated login, owner, and vet pages while preserving out-of-scope cat and stay form coexistence in `frontend/src/styles.scss`
- [X] T022 [P] Document migrated Material form conventions and remaining native-form coexistence boundaries in `docs/ARCHITECTURE.md`
- [X] T023 [P] Update frontend-local Material form guidance in `frontend/README.md`
- [X] T024 Review `frontend/src/app/features/cats/`, `frontend/src/app/features/stays/`, `frontend/src/app/app.routes.ts`, `src/main/java/`, and `src/main/resources/db/migration/` to confirm no out-of-scope cat form, stay form, route, API, persistence, authorization, or domain-rule changes were introduced
- [X] T025 Run frontend format validation with `npm run format:check` from `frontend/`
- [X] T026 Run frontend CI tests with `npm run test:ci` from `frontend/`
- [X] T027 Run production frontend build with `npm run build` from `frontend/`
- [X] T028 Run mobile form smoke testing for login, owner create/edit, and vet create/edit at 320, 375, and 390 CSS pixels
- [X] T029 Validate completed implementation against `specs/003-material-form-migration/quickstart.md`
- [X] T030 Run final constitution compliance review against `specs/003-material-form-migration/plan.md` and `.specify/memory/constitution.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **US1 Login (Phase 1)**: Can start immediately and should be completed first because login gates authenticated workflows.
- **US2 Owner Forms (Phase 2)**: Can start after the approved plan exists; it does not depend on login implementation but should reuse any proven local pattern from US1.
- **US3 Vet Forms (Phase 3)**: Can start after the approved plan exists; it should match the owner/login Material form pattern.
- **Polish (Phase 4)**: Depends on all migrated forms being implemented so global style cleanup and documentation reflect final behavior.

### User Story Dependencies

- **US1 (P1)**: No implementation dependency beyond the approved #177/#178 foundation already present in the active worktree.
- **US2 (P2)**: No hard dependency on US1, but should follow the same Material form and validation-presentation pattern.
- **US3 (P3)**: No hard dependency on US1 or US2, but should follow the same Material form and validation-presentation pattern.

### Within Each User Story

- Update tests and implementation together for the same component when template rendering changes.
- Preserve existing submit methods, payload shaping, and navigation before changing presentation details.
- Validate each form's behavior before treating the story as complete.

### Parallel Opportunities

- Owner create and owner edit tasks marked [P] can run in parallel because they edit separate files.
- Vet create and vet edit tasks marked [P] can run in parallel because they edit separate files.
- Documentation tasks T022 and T023 can run in parallel after implementation.

---

## Parallel Example: User Story 2

```bash
Task: "Add owner create behavior and rendering coverage in frontend/src/app/features/owners/pages/owner-create-page/owner-create-page.spec.ts"
Task: "Add owner edit behavior and rendering coverage in frontend/src/app/features/owners/pages/owner-edit-page/owner-edit-page.spec.ts"
Task: "Replace native owner create labels, inputs, button, and backend-error markup with Material presentation in frontend/src/app/features/owners/pages/owner-create-page/owner-create-page.html"
Task: "Replace native owner edit labels, inputs, loading, button, link, and backend-error markup with Material presentation in frontend/src/app/features/owners/pages/owner-edit-page/owner-edit-page.html"
```

---

## Parallel Example: User Story 3

```bash
Task: "Add vet create behavior and rendering coverage in frontend/src/app/features/vets/pages/vet-create-page/vet-create-page.spec.ts"
Task: "Add vet edit behavior and rendering coverage in frontend/src/app/features/vets/pages/vet-edit-page/vet-edit-page.spec.ts"
Task: "Update vet create Material form layout and mobile responsiveness in frontend/src/app/features/vets/pages/vet-create-page/vet-create-page.scss"
Task: "Update vet edit Material form layout and mobile responsiveness in frontend/src/app/features/vets/pages/vet-edit-page/vet-edit-page.scss"
```

---

## Implementation Strategy

### MVP First

1. Complete Phase 1 login migration.
2. Verify login required-field blocking, successful submit payload/navigation, backend-error behavior, Material rendering, and mobile usability.

### Incremental Delivery

1. Migrate login form to prove the local Material form pattern.
2. Migrate owner create/edit forms and validate owner payload/load/save/navigation behavior.
3. Migrate vet create/edit forms and validate vet payload/load/save/navigation behavior.
4. Narrow superseded native styling and update documentation.
5. Run required validation and mobile smoke tests.

### Completion Criteria

The issue is complete when all tasks are checked, required validation commands pass, mobile smoke testing covers 320, 375, and 390 CSS pixels, quickstart review is satisfied, and no blocker remains under the constitution or issue boundaries.

---

## Notes

- Do not change backend contracts, payload shapes, routes, guards, persistence, authorization, domain rules, cat forms, stay forms, searchable selectors, tables, calendar behavior, or unrelated pages.
- Do not create a broad Material module, separate design-system package, or reusable form abstraction unless a future approved plan requires it.
- Do not commit unless the user explicitly asks for a commit.
