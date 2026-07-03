# Tasks: Cat and Stay Material Forms

**Input**: Design documents from `specs/004-cat-stay-material-forms/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/material-cat-stay-forms.md, quickstart.md

**Tests**: Frontend behavior coverage is required because the migration changes form templates, select/checkbox/date presentation, disabled states, validation presentation, and backend-error presentation while preserving payload, query-param, and navigation behavior.

**Organization**: Tasks are grouped by user story so cat forms and stay forms can be implemented and verified incrementally.

## Format: `[ID] [P?] [Trace] Description`

- **[P]**: Can run in parallel (different files, no dependency on incomplete tasks)
- **[Trace]**: User story label from `spec.md` (`US1`, `US2`)
- Include exact file paths in descriptions

## Path Conventions

- **Cat create form**: `frontend/src/app/features/cats/pages/cat-create-page/`
- **Cat edit form**: `frontend/src/app/features/cats/pages/cat-edit-page/`
- **Stay create form**: `frontend/src/app/features/stays/pages/stay-create-page/`
- **Stay edit form**: `frontend/src/app/features/stays/pages/stay-edit-page/`
- **Shared state and form helpers**: `frontend/src/app/shared/ui-state/`, `frontend/src/app/shared/forms/`
- **Global styles**: `frontend/src/styles.scss`
- **Docs**: `docs/ARCHITECTURE.md`, `frontend/README.md`

## Phase 1: User Story 1 - Maintain Cats With Material Forms (Priority: P1)

**Goal**: Authenticated users can create and edit cat records through Material form controls and validation presentation while preserving payloads, optional values, owner/vet behavior, related-record navigation, query params, backend errors, loading, disabled behavior, translations, and submit behavior.

**Verification**: Cat create/edit tests prove required-field blocking, optional blank-to-null payload values, date-string preservation, successful save navigation, owner/vet query-param behavior, backend-error behavior, loading behavior, and Material rendering. Manual review confirms cat forms remain usable at 320, 375, and 390 CSS pixels.

### Evidence for User Story 1

- [x] T001 [P] [US1] Add cat create behavior and Material rendering coverage in `frontend/src/app/features/cats/pages/cat-create-page/cat-create-page.spec.ts`
- [x] T002 [P] [US1] Add cat edit behavior and Material rendering coverage in `frontend/src/app/features/cats/pages/cat-edit-page/cat-edit-page.spec.ts`

### Implementation for User Story 1

- [x] T003 [P] [US1] Import directly used Angular Material form, input, select, button, shared state, and validation helper dependencies in `frontend/src/app/features/cats/pages/cat-create-page/cat-create-page.ts`
- [x] T004 [P] [US1] Replace native cat create labels, text/date inputs, textarea, selects, related links, submit button, loading, and backend-error markup with Material presentation in `frontend/src/app/features/cats/pages/cat-create-page/cat-create-page.html`
- [x] T005 [P] [US1] Update cat create Material form layout and mobile responsiveness in `frontend/src/app/features/cats/pages/cat-create-page/cat-create-page.scss`
- [x] T006 [P] [US1] Import directly used Angular Material form, input, select, button, router link, shared state, and validation helper dependencies in `frontend/src/app/features/cats/pages/cat-edit-page/cat-edit-page.ts`
- [x] T007 [P] [US1] Replace native cat edit labels, text/date inputs, textarea, selects, back link, submit button, loading, and backend-error markup with Material presentation in `frontend/src/app/features/cats/pages/cat-edit-page/cat-edit-page.html`
- [x] T008 [P] [US1] Update cat edit Material form layout and mobile responsiveness in `frontend/src/app/features/cats/pages/cat-edit-page/cat-edit-page.scss`

**Checkpoint**: Cat create and edit forms can be validated independently with existing payload, load, save, owner/vet, query-param, and navigation behavior preserved.

---

## Phase 2: User Story 2 - Maintain Stays With Material Forms (Priority: P2)

**Goal**: Authenticated users can create and edit stays through Material form controls and validation presentation while preserving owner selection, multi-cat selection, date/datetime string values, optional notes, closed-stay blocking, backend errors, loading, disabled behavior, translations, related-record navigation, query params, and submit behavior.

**Verification**: Stay create/edit tests prove owner filtering, query-param preselection, multi-cat selection, required-cat and date validation, end-after-start validation, payload shaping, closed-stay edit blocking, successful save navigation, backend-error behavior, and Material rendering. Manual review confirms stay forms remain usable at 320, 375, and 390 CSS pixels.

### Evidence for User Story 2

- [x] T009 [P] [US2] Add stay create behavior and Material rendering coverage in `frontend/src/app/features/stays/pages/stay-create-page/stay-create-page.spec.ts`
- [x] T010 [P] [US2] Add stay edit behavior and Material rendering coverage in `frontend/src/app/features/stays/pages/stay-edit-page/stay-edit-page.spec.ts`

### Implementation for User Story 2

- [x] T011 [P] [US2] Import directly used Angular Material form, input, select, checkbox, button, shared state, and router link dependencies in `frontend/src/app/features/stays/pages/stay-create-page/stay-create-page.ts`
- [x] T012 [P] [US2] Replace native stay create owner select, cat checkbox list, datetime inputs, textarea, related links, submit button, loading, and backend-error markup with Material presentation in `frontend/src/app/features/stays/pages/stay-create-page/stay-create-page.html`
- [x] T013 [P] [US2] Update stay create Material form layout, multi-cat grouping, related-link spacing, and mobile responsiveness in `frontend/src/app/features/stays/pages/stay-create-page/stay-create-page.scss`
- [x] T014 [P] [US2] Import directly used Angular Material form, input, button, router link, and shared state dependencies in `frontend/src/app/features/stays/pages/stay-edit-page/stay-edit-page.ts`
- [x] T015 [P] [US2] Replace native stay edit datetime inputs, textarea, summary/error/loading markup, back link, and submit button with Material presentation in `frontend/src/app/features/stays/pages/stay-edit-page/stay-edit-page.html`
- [x] T016 [P] [US2] Update stay edit Material form layout, summary presentation, and mobile responsiveness in `frontend/src/app/features/stays/pages/stay-edit-page/stay-edit-page.scss`
- [x] T017 [US2] Lazy-load the stay create route without changing the `/stays/new` path or guard in `frontend/src/app/app.routes.ts`

**Checkpoint**: Stay create and edit forms can be validated independently with existing payload, load, save, owner/cat, query-param, status-related, date/datetime, and navigation behavior preserved.

---

## Phase 3: Polish & Cross-Cutting Concerns

**Purpose**: Remove superseded migrated-form native styling, update source-of-truth documentation, and run required validation.

- [x] T018 Narrow superseded native cat/stay form card and control styling while preserving native coexistence styles still needed by out-of-scope controls in `frontend/src/styles.scss`
- [x] T019 [P] Document migrated cat/stay Material form conventions and remaining native-control coexistence boundaries in `docs/ARCHITECTURE.md`
- [x] T020 [P] Update frontend-local Material form guidance for cat/stay forms in `frontend/README.md`
- [x] T021 Review `frontend/src/app/features/cats/`, `frontend/src/app/features/stays/`, `frontend/src/app/app.routes.ts`, `src/main/java/`, and `src/main/resources/db/migration/` to confirm no out-of-scope route, API, persistence, authorization, stay invariant, searchable selector, cat photo, vaccine warning, pricing, calculated-night, or unrelated product redesign changes were introduced
- [x] T022 Run frontend format validation with `npm run format:check` from `frontend/`
- [x] T023 Run frontend CI tests with `npm run test:ci` from `frontend/`
- [x] T024 Run production frontend build with `npm run build` from `frontend/`
- [x] T025 Run keyboard and target-iPhone form smoke testing for cat create/edit and stay create/edit at 320, 375, and 390 CSS pixels against `specs/004-cat-stay-material-forms/quickstart.md`
- [x] T026 Validate completed implementation against `specs/004-cat-stay-material-forms/contracts/material-cat-stay-forms.md` and `specs/004-cat-stay-material-forms/quickstart.md`
- [x] T027 Run final constitution compliance review against `specs/004-cat-stay-material-forms/plan.md` and `.specify/memory/constitution.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **US1 Cat Forms (Phase 1)**: Can start immediately and should be completed first because cats are core records used by stays.
- **US2 Stay Forms (Phase 2)**: Can start after the approved plan exists; it can be implemented independently from cat form code, but smoke validation should include the cat-return flow because stay creation links to cat creation.
- **Polish (Phase 3)**: Depends on all migrated forms being implemented so global style cleanup and documentation reflect final behavior.

### User Story Dependencies

- **US1 (P1)**: No implementation dependency beyond the approved #177/#179 foundation already present in the active worktree.
- **US2 (P2)**: No hard dependency on US1 implementation, but it must preserve stay-to-cat related navigation behavior and should match the same Material form pattern.

### Within Each User Story

- Update tests and implementation together for the same component when template rendering changes.
- Preserve existing submit methods, payload shaping, query-param helpers, and navigation before changing presentation details.
- Validate each form's behavior before treating the story as complete.

### Parallel Opportunities

- Cat create and cat edit tasks marked [P] can run in parallel because they edit separate files.
- Stay create and stay edit tasks marked [P] can run in parallel because they edit separate files.
- Documentation tasks T018 and T019 can run in parallel after implementation.

---

## Parallel Example: User Story 1

```bash
Task: "Add cat create behavior and Material rendering coverage in frontend/src/app/features/cats/pages/cat-create-page/cat-create-page.spec.ts"
Task: "Add cat edit behavior and Material rendering coverage in frontend/src/app/features/cats/pages/cat-edit-page/cat-edit-page.spec.ts"
Task: "Replace native cat create labels, text/date inputs, textarea, selects, related links, submit button, loading, and backend-error markup with Material presentation in frontend/src/app/features/cats/pages/cat-create-page/cat-create-page.html"
Task: "Replace native cat edit labels, text/date inputs, textarea, selects, back link, submit button, loading, and backend-error markup with Material presentation in frontend/src/app/features/cats/pages/cat-edit-page/cat-edit-page.html"
```

---

## Parallel Example: User Story 2

```bash
Task: "Add stay create behavior and Material rendering coverage in frontend/src/app/features/stays/pages/stay-create-page/stay-create-page.spec.ts"
Task: "Add stay edit behavior and Material rendering coverage in frontend/src/app/features/stays/pages/stay-edit-page/stay-edit-page.spec.ts"
Task: "Replace native stay create owner select, cat checkbox list, datetime inputs, textarea, related links, submit button, loading, and backend-error markup with Material presentation in frontend/src/app/features/stays/pages/stay-create-page/stay-create-page.html"
Task: "Replace native stay edit datetime inputs, textarea, summary/error/loading markup, back link, and submit button with Material presentation in frontend/src/app/features/stays/pages/stay-edit-page/stay-edit-page.html"
```

---

## Implementation Strategy

### MVP First

1. Complete Phase 1 cat form migration.
2. Verify cat required-field blocking, successful submit payload/navigation, owner/vet query-param behavior, backend-error behavior, Material rendering, and mobile usability.

### Incremental Delivery

1. Migrate cat create/edit forms and validate cat payload/load/save/navigation behavior.
2. Migrate stay create/edit forms and validate owner/cat selection, date/datetime, payload/load/save/navigation behavior.
3. Narrow superseded native styling and update documentation.
4. Run required validation and mobile smoke tests.

### Completion Criteria

The issue is complete when all tasks are checked, required validation commands pass, keyboard/touch smoke testing covers 320, 375, and 390 CSS pixels, quickstart review is satisfied, and no blocker remains under the constitution or issue boundaries.

---

## Notes

- Do not change backend contracts, payload shapes, routes, guards, persistence, authorization, domain rules, searchable selectors, cat photo controls, vaccine warnings, pricing behavior, calculated-night behavior, or unrelated pages.
- Do not create a broad Material module, separate design-system package, searchable selector, date/time abstraction, or reusable form abstraction unless a future approved plan requires it.
- Do not commit unless the user explicitly asks for a commit.
